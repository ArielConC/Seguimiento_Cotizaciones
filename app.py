from __future__ import annotations

import base64
import ipaddress
import json
import mimetypes
import os
import re
import socket
import threading
import traceback
import webbrowser
from http import HTTPStatus
from http.cookies import SimpleCookie
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any
from urllib.parse import parse_qs, urlparse

import auth
import backup
import database
import imports_manager
import invoice_manager #<-------- NUEVA LÍNEA
import special
from reports import build_report_pdf, build_report_xlsx


APP_DIR=Path(__file__).resolve().parent
STATIC_DIR=APP_DIR/"static"
HOST=os.environ.get("NT_QUOTE_HOST","0.0.0.0")
PORT=int(os.environ.get("PORT") or os.environ.get("NT_QUOTE_PORT","8765"))
COOKIE_NAME="nt_quote_session"
CLOUD_DEPLOYMENT=bool(os.environ.get("RAILWAY_ENVIRONMENT_ID"))
COOKIE_SECURE=os.environ.get("NT_QUOTE_COOKIE_SECURE","1" if CLOUD_DEPLOYMENT else "0")=="1"
TRUST_PROXY=os.environ.get("NT_QUOTE_TRUST_PROXY","1" if CLOUD_DEPLOYMENT else "0")=="1"


class SingleInstanceHTTPServer(ThreadingHTTPServer):
    allow_reuse_address=False
    def server_bind(self)->None:
        if os.name=="nt" and hasattr(socket,"SO_EXCLUSIVEADDRUSE"):
            self.socket.setsockopt(socket.SOL_SOCKET,socket.SO_EXCLUSIVEADDRUSE,1)
        super().server_bind()


class Handler(BaseHTTPRequestHandler):
    server_version="QuotationFollowUp/2.0"

    def end_headers(self)->None:
        self.send_header("Referrer-Policy","same-origin")
        self.send_header("Permissions-Policy","camera=(), microphone=(), geolocation=()")
        self.send_header("X-Robots-Tag","noindex, nofollow")
        if COOKIE_SECURE:
            self.send_header("Strict-Transport-Security","max-age=31536000; includeSubDomains")
        super().end_headers()

    def log_message(self,fmt:str,*args:object)->None:
        print(f"[{self.log_date_time_string()}] {fmt % args}")

    def _json(self,payload:object,status:int=HTTPStatus.OK)->None:
        body=json.dumps(payload,ensure_ascii=False,default=str).encode("utf-8")
        self.send_response(status); self.send_header("Content-Type","application/json; charset=utf-8")
        self.send_header("Content-Length",str(len(body))); self.send_header("Cache-Control","no-store")
        self.send_header("X-Content-Type-Options","nosniff"); self.send_header("X-Frame-Options","SAMEORIGIN")
        self.end_headers(); self.wfile.write(body)

    def _read_json(self,max_bytes:int=1_000_000)->dict[str,Any]:
        length=int(self.headers.get("Content-Length","0"))
        if length>max_bytes: raise ValueError("The request is too large")
        raw=self.rfile.read(length) if length else b"{}"
        return json.loads(raw.decode("utf-8"))

    def _serve_static(self,relative:str)->None:
        target=(STATIC_DIR/relative).resolve()
        if STATIC_DIR.resolve() not in target.parents and target!=STATIC_DIR.resolve():
            self.send_error(HTTPStatus.FORBIDDEN); return
        if not target.is_file(): self.send_error(HTTPStatus.NOT_FOUND); return
        data=target.read_bytes(); mime=mimetypes.guess_type(target.name)[0] or "application/octet-stream"
        self.send_response(HTTPStatus.OK); self.send_header("Content-Type",mime); self.send_header("Content-Length",str(len(data)))
        self.send_header("Cache-Control","no-store, max-age=0"); self.send_header("Pragma","no-cache")
        self.send_header("X-Content-Type-Options","nosniff"); self.end_headers(); self.wfile.write(data)

    def _token(self)->str|None:
        cookie=SimpleCookie(); cookie.load(self.headers.get("Cookie","")); morsel=cookie.get(COOKIE_NAME)
        return morsel.value if morsel else None

    def _client_ip(self)->str:
        direct=self.client_address[0]
        if not TRUST_PROXY: return direct
        forwarded=self.headers.get("X-Forwarded-For","").split(",",1)[0].strip()
        try: return str(ipaddress.ip_address(forwarded))
        except ValueError: return direct

    def _user(self,required:bool=True)->dict[str,Any]|None:
        user=auth.authenticate(self._token())
        if required and not user: raise PermissionError("Authentication required")
        return user

    def _csrf(self,user:dict[str,Any])->None:
        auth.require_csrf(user,self.headers.get("X-CSRF-Token"))

    def _set_session(self,token:str)->None:
        secure="; Secure" if COOKIE_SECURE else ""
        self.send_header("Set-Cookie",f"{COOKIE_NAME}={token}; Path=/; HttpOnly; SameSite=Strict; Max-Age={auth.SESSION_HOURS*3600}{secure}")

    def _clear_session(self)->None:
        secure="; Secure" if COOKIE_SECURE else ""
        self.send_header("Set-Cookie",f"{COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0{secure}")

    def _auth_response(self,user:dict[str,Any],token:str)->None:
        body=json.dumps({"user":user},ensure_ascii=False).encode("utf-8")
        self.send_response(HTTPStatus.OK); self.send_header("Content-Type","application/json; charset=utf-8")
        self._set_session(token); self.send_header("Content-Length",str(len(body))); self.send_header("Cache-Control","no-store"); self.end_headers(); self.wfile.write(body)

    def _download(self,content:bytes,mime:str,filename:str)->None:
        self.send_response(HTTPStatus.OK); self.send_header("Content-Type",mime); self.send_header("Content-Length",str(len(content)))
        self.send_header("Content-Disposition",f'attachment; filename="{filename}"'); self.send_header("Cache-Control","no-store"); self.end_headers(); self.wfile.write(content)

    def _report(self,workspace:str,params:dict[str,str],user:dict[str,Any])->dict[str,Any]:
        start=params.get("start",database.today_local().isoformat()); end=params.get("end",start); scope=params.get("scope","mine")
        if scope=="all" and not auth.can_team_reports(user): raise PermissionError("Your role cannot generate team-wide reports")
        actor_id=None if scope=="all" else int(user["id"]); agent=params.get("agent","")
        data=database.report_activity(start,end,actor_id,agent) if workspace=="standard" else special.report_activity(start,end,actor_id,agent)
        data.update({"scope":scope,"agent":agent,"generated_by":user["display_name"],"language":params.get("language",user.get("language","en"))})
        return data

    def do_GET(self)->None:  # noqa: N802
        parsed=urlparse(self.path); params={key:values[0] for key,values in parse_qs(parsed.query).items()}
        try:
            if parsed.path=="/health":
                with database.connect() as db: db.execute("SELECT 1").fetchone()
                self._json({"status":"ok","database":"ok"}); return
            if parsed.path=="/": self._serve_static("index.html"); return
            if parsed.path.startswith("/static/"): self._serve_static(parsed.path.removeprefix("/static/")); return
            if parsed.path=="/api/auth/status": self._json({"bootstrap_required":auth.bootstrap_needed()}); return
            user=self._user()
            if parsed.path=="/api/me": self._json(user)
            elif parsed.path=="/api/quotes": self._json(database.list_quotes(params))
            elif parsed.path=="/api/special/quotes": self._json(special.list_quotes(params))
            elif re.fullmatch(r"/api/quotes/\d+",parsed.path): self._json(database.get_quote(int(parsed.path.rsplit("/",1)[1])))
            elif re.fullmatch(r"/api/special/quotes/\d+",parsed.path): self._json(special.get_quote(int(parsed.path.rsplit("/",1)[1])))
            elif parsed.path=="/api/managed": self._json(database.list_managed_quotes(params))
            elif parsed.path=="/api/special/managed": self._json(special.list_managed(params))
            elif parsed.path=="/api/management":
                if not auth.is_management_profile(user): raise PermissionError("Management view is restricted")
                self._json(database.list_management_quotes(params))
            elif parsed.path=="/api/special/management":
                if not auth.is_management_profile(user): raise PermissionError("Management view is restricted")
                self._json(special.list_management(params))
            elif parsed.path=="/api/dashboard":
                data=database.dashboard(params.get("agent",""),params.get("start",""),params.get("end","")); data["backup"]=backup.status(); self._json(data)
            elif parsed.path=="/api/special/dashboard":
                data=special.dashboard(params.get("agent",""),params.get("start",""),params.get("end","")); data["backup"]=backup.status(); self._json(data)
            elif parsed.path=="/api/agents": self._json(database.agents())
            elif parsed.path=="/api/special/agents": self._json(special.agents())
            elif parsed.path=="/api/special/ranks": self._json(special.ranks())
            elif parsed.path=="/api/imports": self._json(imports_manager.history(params.get("workspace","standard")))
            elif parsed.path=="/api/users": self._json(auth.list_users(user))
            elif parsed.path=="/api/audit": self._json(auth.recent_audit(user,int(params.get("limit","100"))))
            elif parsed.path=="/api/backup/status": self._json(backup.status())
            elif parsed.path in {"/api/reports/range","/api/special/reports/range"}:
                workspace="special" if "/special/" in parsed.path else "standard"; self._json(self._report(workspace,params,user))
            elif parsed.path in {"/api/reports/export.pdf","/api/special/reports/export.pdf","/api/reports/export.xlsx","/api/special/reports/export.xlsx"}:
                workspace="special" if "/special/" in parsed.path else "standard"; data=self._report(workspace,params,user)
                language=data["language"]; slug=f"{workspace}_follow_up_{data['start_date']}_{data['end_date']}"
                output=APP_DIR/"output"/("pdf" if parsed.path.endswith("pdf") else "xlsx")
                target=output/f"{slug}.{parsed.path.rsplit('.',1)[1]}"
                if parsed.path.endswith("pdf"):
                    content=build_report_pdf(data,target,language); mime="application/pdf"
                else:
                    content=build_report_xlsx(data,target,language); mime="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                auth.audit(user,"report_generated",workspace,"report",f"{data['start_date']}:{data['end_date']}",f"scope={data['scope']}; format={target.suffix}",self._client_ip())
                self._download(content,mime,target.name)
            else: self.send_error(HTTPStatus.NOT_FOUND)
        except Exception as exc: self._handle_error(exc)

    def do_POST(self)->None:  # noqa: N802
        parsed=urlparse(self.path)
        try:
            if parsed.path=="/api/auth/bootstrap":
                payload=self._read_json(); user,token=auth.bootstrap(str(payload.get("username","")),str(payload.get("password","")),str(payload.get("language","en")),self._client_ip(),self.headers.get("User-Agent","")); self._auth_response(user,token); return
            if parsed.path=="/api/auth/login":
                payload=self._read_json(); user,token=auth.login(str(payload.get("username","")),str(payload.get("password","")),str(payload.get("language","en")),self._client_ip(),self.headers.get("User-Agent","")); self._auth_response(user,token); return
            user=self._user(); self._csrf(user)
            if parsed.path=="/api/auth/logout":
                auth.logout(self._token(),user,self._client_ip()); body=b'{"ok":true}'; self.send_response(HTTPStatus.OK); self.send_header("Content-Type","application/json"); self._clear_session(); self.send_header("Content-Length",str(len(body))); self.end_headers(); self.wfile.write(body)
            elif parsed.path in {"/api/import/preview","/api/special/import/preview"}:
                workspace="special" if "/special/" in parsed.path else "standard"; payload=self._read_json(35_000_000)
                try: content=base64.b64decode(str(payload.get("content_base64","")),validate=True)
                except Exception as exc: raise ValueError("The uploaded Excel content is invalid") from exc
                self._json(imports_manager.preview(workspace,content,str(payload.get("filename") or "quotations.xlsx"),user),HTTPStatus.CREATED)
            elif parsed.path in {"/api/import/confirm","/api/special/import/confirm"}:
                workspace="special" if "/special/" in parsed.path else "standard"; payload=self._read_json(); self._json(imports_manager.confirm(workspace,str(payload.get("token","")),user),HTTPStatus.CREATED)
            
            # --- RUTAS PARA FACTURAS (VISTA PREVIA Y CONFIRMAR) ---
            elif parsed.path in {"/api/import/invoices/preview", "/api/special/import/invoices/preview"}:
                workspace = "special" if "/special/" in parsed.path else "standard"
                payload = self._read_json(35_000_000)
                try: content = base64.b64decode(str(payload.get("content_base64", "")), validate=True)
                except Exception as exc: raise ValueError("El archivo Excel es inválido") from exc
                self._json(invoice_manager.preview(workspace, content, str(payload.get("filename", "")), user), HTTPStatus.CREATED)
                
            elif parsed.path in {"/api/import/invoices/confirm", "/api/special/import/invoices/confirm"}:
                workspace = "special" if "/special/" in parsed.path else "standard"
                payload = self._read_json()
                self._json(invoice_manager.confirm(workspace, str(payload.get("token", "")), user), HTTPStatus.CREATED)
            # ------------------------------------------------------

            elif parsed.path=="/api/users": self._json(auth.create_user(user,self._read_json()),HTTPStatus.CREATED)
            elif parsed.path=="/api/backup/run":
                if not auth.can_admin(user): raise PermissionError("Administrator permission required")
                result=backup.perform(user["display_name"]); auth.audit(user,"backup_run",detail=json.dumps(result),ip=self._client_ip()); self._json(result,HTTPStatus.CREATED if result["ok"] else HTTPStatus.INTERNAL_SERVER_ERROR)
            elif re.fullmatch(r"/api/special/archive/\d+/restore",parsed.path):
                if not auth.can_admin(user): raise PermissionError("Administrator permission required")
                quote_id=int(parsed.path.split("/")[4]); result=special.restore_quote(quote_id); auth.audit(user,"archive_restored","special","quote",str(quote_id),ip=self._client_ip()); self._json(result)
            else: self.send_error(HTTPStatus.NOT_FOUND)
        except Exception as exc: self._handle_error(exc)

    def do_PATCH(self)->None:  # noqa: N802
        parsed=urlparse(self.path)
        try:
            user=self._user(); self._csrf(user); payload=self._read_json()
            if re.fullmatch(r"/api/quotes/\d+",parsed.path):
                quote_id=int(parsed.path.rsplit("/",1)[1]); current=database.get_quote(quote_id)
                if not auth.can_edit_quote(user,current["nt_agent"]): raise PermissionError("You can only manage quotations assigned to you")
                result=database.update_quote(quote_id,str(payload.get("status","pending")),str(payload.get("comment","")),str(payload.get("loss_reason","")),str(payload.get("follow_up_type","")),bool(payload.get("is_safe",False)),payload.get("po_total"),str(payload.get("po_date") or "") or None,user,payload.get("invoices"))
                detail=f"status={result['status']}; invoices={len(result.get('invoices',[]))}; po_total={result.get('po_total_usd') or ''}"
                auth.audit(user,"quote_review_saved","standard","quote",str(quote_id),detail=detail,ip=self._client_ip()); self._json(result)
            elif re.fullmatch(r"/api/special/quotes/\d+",parsed.path):
                quote_id=int(parsed.path.rsplit("/",1)[1]); current=special.get_quote(quote_id)
                if not auth.can_edit_quote(user,current["nt_agent"]): raise PermissionError("You can only manage quotations assigned to you")
                result=special.update_quote(quote_id,str(payload.get("status","pending")),str(payload.get("comment","")),str(payload.get("loss_reason","")),str(payload.get("follow_up_type","")),bool(payload.get("is_safe",False)),payload.get("po_total"),str(payload.get("po_date") or "") or None,user,payload.get("invoices"))
                detail=f"status={result['status']}; invoices={len(result.get('invoices',[]))}; po_total={result.get('po_total_usd') or ''}"
                auth.audit(user,"quote_review_saved","special","quote",str(quote_id),detail=detail,ip=self._client_ip()); self._json(result)
            elif re.fullmatch(r"/api/users/\d+",parsed.path): self._json(auth.update_user(user,int(parsed.path.rsplit("/",1)[1]),payload))
            elif parsed.path=="/api/me/preferences": self._json(auth.update_preferences(user,str(payload.get("language","en"))))
            elif parsed.path=="/api/me/password": auth.change_password(user,str(payload.get("current_password","")),str(payload.get("new_password",""))); self._json({"ok":True})
            else: self.send_error(HTTPStatus.NOT_FOUND)
        except Exception as exc: self._handle_error(exc)

    def _handle_error(self,exc:Exception)->None:
        if isinstance(exc,PermissionError): status=HTTPStatus.UNAUTHORIZED if str(exc)=="Authentication required" else HTTPStatus.FORBIDDEN
        elif isinstance(exc,KeyError): status=HTTPStatus.NOT_FOUND
        elif isinstance(exc,(ValueError,json.JSONDecodeError)): status=HTTPStatus.BAD_REQUEST
        else: status=HTTPStatus.INTERNAL_SERVER_ERROR; traceback.print_exc()
        self._json({"error":str(exc).strip("'")},status)


def main()->None:
    database.initialize(); special.initialize(); auth.initialize(); backup.initialize(); backup.launch_automatic()
    display_host="127.0.0.1" if HOST in {"0.0.0.0","::"} else HOST; url=f"http://{display_host}:{PORT}"
    print(f"Data directory: {database.DATA_DIR}")
    try: server=SingleInstanceHTTPServer((HOST,PORT),Handler)
    except OSError:
        print("The application is already running.")
        if os.environ.get("NT_QUOTE_NO_BROWSER")!="1": webbrowser.open(url)
        return
    print(f"Quotation Follow-up is available at {url}")
    if os.environ.get("NT_QUOTE_NO_BROWSER")!="1": threading.Timer(1,lambda:webbrowser.open(url)).start()
    try: server.serve_forever()
    except KeyboardInterrupt: print("\nApplication stopped.")
    finally: server.server_close()


if __name__=="__main__": main()
