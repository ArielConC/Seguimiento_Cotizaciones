from __future__ import annotations

import sys
import tempfile
import unittest
import base64
import http.client
import json
import threading
from datetime import date, timedelta
from http.server import ThreadingHTTPServer
from io import BytesIO
from pathlib import Path

from openpyxl import Workbook, load_workbook
from pypdf import PdfReader


PROJECT_DIR=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(PROJECT_DIR))

import auth
import app
import backup
import database
import invoice_manager
import imports_manager
import special
from reports import build_report_pdf, build_report_xlsx


def standard_book(total: float = 6000, order: str = "OP-100") -> bytes:
    book=Workbook(); sheet=book.active; sheet.title="Hoja1"
    sheet.append(["Todos los Documentos"]); sheet.append([])
    sheet.append(["Fecha","Serie","Folio","Razón Social","Total","Texto Extra 1","Texto Extra 3","Pendiente","Texto Extra 2","Nombre del agente","Neto"])
    sheet.append([date.today(),"QT",100,"DISTRIBUTOR SA",total,"END USER MX","DISTRIBUTOR AGENT","",order,"TAKUJI YAMADA",total/1.16])
    sheet.append([date.today(),"QTI",101,"INTERNATIONAL CO",500,"END USER USA","AGENT USA","","","ELEONOR BARRAGAN",431.03])
    buffer=BytesIO(); book.save(buffer); return buffer.getvalue()


def special_book(model_x_price: float = 2000) -> bytes:
    book=Workbook(); sheet=book.active; sheet.title="Sheet1"
    headers=[""]*27
    for index,value in {1:"Quote No.",2:"Quote Date",5:"Company",6:"Rank",7:"Item Code",8:"Model / Size",9:"Qty",10:"Unit Price",27:"Contact"}.items(): headers[index-1]=value
    sheet.append(headers)
    rows=[
        ("S1",date(2026,9,1),"CLIENT A","F","C1","MODEL-X",1,1000,"Ariel"),
        ("S2",date(2026,9,1),"CLIENT A","F","C2","MODEL-X",2,5000,"Ariel"),
        ("S3",date(2026,9,1),"CLIENT A","F","C3","MODEL-X",1,model_x_price,"Ariel"),
        ("S4",date(2026,9,2),"CLIENT A","F","C4","MODEL-X",1,1500,"Ariel"),
        ("S5",date(2026,9,1),"CLIENT B","B","C5","MODEL-Y",5,500,"Eleonor"),
    ]
    for quote_no,quote_date,company,rank,code,model,qty,price,agent in rows:
        values=[""]*27
        for index,value in {1:quote_no,2:quote_date,5:company,6:rank,7:code,8:model,9:qty,10:price,27:agent}.items(): values[index-1]=value
        sheet.append(values)
    buffer=BytesIO(); book.save(buffer); return buffer.getvalue()


def invoice_book(order: str = "OP-100", include_unmatched: bool = True) -> bytes:
    book=Workbook(); sheet=book.active; sheet.title="Facturas"
    sheet.append(["Reporte de facturas"]); sheet.append([])
    sheet.append(["Fecha","Serie","Folio","Cliente","Total","Texto Extra 2"])
    sheet.append([date(2026,9,10),"IV",8772,"CLIENT",150.25,order])
    sheet.append([date(2026,9,12),"IV",8762,"CLIENT",200,order])
    if include_unmatched:
        sheet.append([date(2026,9,13),"IV",9999,"CLIENT",75,"UNKNOWN-PO"])
    buffer=BytesIO(); book.save(buffer); return buffer.getvalue()


class V2WorkflowTests(unittest.TestCase):
    def setUp(self)->None:
        self.temp=tempfile.TemporaryDirectory(); self.old=(database.DATA_DIR,database.DB_PATH,database.IMPORT_DIR,backup.BACKUP_DIR)
        database.DATA_DIR=Path(self.temp.name); database.DB_PATH=database.DATA_DIR/"test.db"; database.IMPORT_DIR=database.DATA_DIR/"imports"; backup.BACKUP_DIR=database.DATA_DIR/"backups"
        database.initialize(); special.initialize(); auth.initialize(); invoice_manager.initialize(); backup.initialize()
        self.user,self.token=auth.bootstrap("takujiyamada","TestPassword123!","en")

    def tearDown(self)->None:
        database.DATA_DIR,database.DB_PATH,database.IMPORT_DIR,backup.BACKUP_DIR=self.old; self.temp.cleanup()

    def test_standard_import_po_missing_comments_and_report(self)->None:
        content=standard_book(); preview=imports_manager.preview("standard",content,"daily.xlsx",self.user)
        self.assertEqual((preview["new"],preview["errors"]),(2,0))
        result=imports_manager.confirm("standard",preview["token"],self.user)
        self.assertEqual((result["inserted"],result["updated"]),(2,0))
        quotes=database.list_quotes({"status":"pending"}); self.assertEqual(len(quotes),2)
        first=next(q for q in quotes if q["folio"]=="QT-100")
        self.assertEqual(first["total_usd"],6000); self.assertAlmostEqual(first["net_total_usd"],6000/1.16)
        self.assertEqual(first["end_user"],"END USER MX"); self.assertEqual(first["priority"],"S"); self.assertEqual(first["po_detected"],1)
        self.assertEqual([q["id"] for q in database.list_quotes({"po_missing":"1"})],[first["id"]])
        with self.assertRaisesRegex(ValueError,"at least one invoice"):
            database.update_quote(first["id"],"po","","","email",False,None,None,self.user,[])
        database.update_quote(first["id"],"pending","Customer contacted","","email",False,None,None,self.user)
        yesterday=(date.today()-timedelta(days=1)).isoformat(); two_days_ago=(date.today()-timedelta(days=2)).isoformat()
        invoices=[
            {"invoice_date":two_days_ago,"invoice_series":"IV","invoice_number":"8,772","amount":3000},
            {"invoice_date":yesterday,"invoice_series":"IV","invoice_number":"8,762","amount":3100},
        ]
        database.update_quote(first["id"],"po","This must not be saved","","call",False,None,None,self.user,invoices)
        detail=database.get_quote(first["id"])
        self.assertEqual(detail["po_total_usd"],6100); self.assertEqual(detail["po_date"],yesterday)
        self.assertEqual(len(detail["invoices"]),2)
        comments=[c["body"] for c in detail["comments"]]
        self.assertEqual(comments[0],"Customer contacted"); self.assertNotIn("This must not be saved",comments)
        self.assertIn("2 invoices",comments[1]); self.assertIn("USD 6,100.00",comments[1])
        self.assertEqual(database.dashboard()["po_today"],1)
        revised=[
            {"invoice_date":two_days_ago,"invoice_series":"IV","invoice_number":"8,772","amount":3000},
            {"invoice_date":yesterday,"invoice_series":"IV","invoice_number":"8,762","amount":3200},
        ]
        database.update_quote(first["id"],"po","","","call",False,None,None,self.user,revised)
        detail=database.get_quote(first["id"]); self.assertEqual(detail["po_total_usd"],6200)
        self.assertEqual(database.dashboard()["po_today"],1)
        report=database.report_activity(date.today().isoformat(),date.today().isoformat(),self.user["id"])
        self.assertEqual(report["quotes_reviewed"],1); self.assertEqual(report["po_changes"],1); self.assertEqual(report["po_value"],6200)
        self.assertEqual(report["po_rows"][0]["invoice_count"],2)
        pdf_path=Path(self.temp.name)/"report.pdf"; pdf=build_report_pdf({**report,"generated_by":self.user["display_name"],"scope":"mine","agent":""},pdf_path,"en")
        self.assertTrue(pdf.startswith(b"%PDF")); self.assertIn("Quotation follow-up report","\n".join(page.extract_text() or "" for page in PdfReader(BytesIO(pdf)).pages))
        xlsx_path=Path(self.temp.name)/"report.xlsx"; build_report_xlsx(report,xlsx_path,"es"); self.assertEqual(load_workbook(xlsx_path).sheetnames,["Resumen","PO","Perdidas","Revisadas"])
        repeated=imports_manager.preview("standard",content,"daily.xlsx",self.user); self.assertEqual(repeated["updated"],2)

    def test_special_duplicate_visibility_and_archive(self)->None:
        content=special_book(); records,errors=special.parse_workbook(content,"special.xlsx")
        self.assertEqual(errors,[]); visible=[r for r in records if not r["is_archived"]]; archived=[r for r in records if r["is_archived"]]
        self.assertEqual(len(visible),3); self.assertEqual(len(archived),2)
        self.assertIn("S3",[r["source_quote_number"] for r in visible]); self.assertIn("S4",[r["source_quote_number"] for r in visible]); self.assertIn("S5",[r["source_quote_number"] for r in visible])
        preview=imports_manager.preview("special",content,"special.xlsx",self.user); self.assertEqual(preview["archived"],2)
        first_import=imports_manager.confirm("special",preview["token"],self.user)
        self.assertEqual((first_import["inserted"],first_import["updated"],first_import["unchanged"]),(5,0,0))
        self.assertEqual(len(special.list_quotes({})),3); self.assertEqual(len(special.list_quotes({"archive":"1"})),2)
        quote=special.list_quotes({})[0]
        special.update_quote(quote["id"],"lost","Budget rejected","Over Budget","call",False,None,None,self.user)
        self.assertEqual(special.get_quote(quote["id"])["comments"][0]["body"],"Budget rejected")
        report=special.report_activity(date.today().isoformat(),date.today().isoformat(),self.user["id"])
        self.assertEqual(report["currency"],"JPY"); self.assertEqual(report["lost_changes"],1); self.assertEqual(report["loss_breakdown"],{"Over Budget":1})
        repeated=imports_manager.preview("special",content,"special.xlsx",self.user)
        self.assertEqual((repeated["new"],repeated["updated"],repeated["unchanged"]),(0,0,5))
        repeated_result=imports_manager.confirm("special",repeated["token"],self.user)
        self.assertEqual((repeated_result["inserted"],repeated_result["updated"],repeated_result["unchanged"]),(0,0,5))
        changed_content=special_book(2250)
        changed=imports_manager.preview("special",changed_content,"special_changed.xlsx",self.user)
        self.assertEqual((changed["new"],changed["updated"],changed["unchanged"]),(0,1,4))
        changed_result=imports_manager.confirm("special",changed["token"],self.user)
        self.assertEqual((changed_result["inserted"],changed_result["updated"],changed_result["unchanged"]),(0,1,4))
        changed_quote=next(row for row in special.list_quotes({}) if row["source_quote_number"]=="S3")
        self.assertEqual(changed_quote["unit_price"],2250)

    def test_special_po_uses_multiple_jpy_invoices(self)->None:
        preview=imports_manager.preview("special",special_book(),"special.xlsx",self.user)
        imports_manager.confirm("special",preview["token"],self.user)
        quote=next(row for row in special.list_quotes({}) if row["source_quote_number"]=="S3")
        invoice_date=(date.today()-timedelta(days=3)).isoformat()
        result=special.update_quote(quote["id"],"po","Ignored","","visit",False,None,None,self.user,[
            {"invoice_date":invoice_date,"invoice_series":"IV","invoice_number":"1001","amount":800000},
            {"invoice_date":invoice_date,"invoice_series":"IV","invoice_number":"1002","amount":250000},
        ])
        self.assertEqual(result["po_total_usd"],1050000); self.assertEqual(result["po_date"],invoice_date)
        self.assertEqual(len(result["invoices"]),2); self.assertIn("JPY 1,050,000",result["comments"][0]["body"])
        self.assertEqual(special.dashboard()["po_today"],1)
        report=special.report_activity(date.today().isoformat(),date.today().isoformat(),self.user["id"])
        self.assertEqual(report["po_value"],1050000); self.assertEqual(report["po_rows"][0]["invoice_count"],2)

    def test_historical_po_totals_migrate_to_legacy_invoices(self)->None:
        standard_preview=imports_manager.preview("standard",standard_book(),"daily.xlsx",self.user)
        imports_manager.confirm("standard",standard_preview["token"],self.user)
        standard_quote=next(q for q in database.list_quotes({}) if q["folio"]=="QT-100")
        special_preview=imports_manager.preview("special",special_book(),"special.xlsx",self.user)
        imports_manager.confirm("special",special_preview["token"],self.user)
        special_quote=next(q for q in special.list_quotes({}) if q["source_quote_number"]=="S3")
        legacy_date=(date.today()-timedelta(days=30)).isoformat()
        with database.connect() as db:
            db.execute("UPDATE quotes SET status='po',po_total_usd=4321,po_date=? WHERE id=?",(legacy_date,standard_quote["id"]))
            db.execute("UPDATE special_quotes SET status='po',po_total_usd=765432,po_date=? WHERE id=?",(legacy_date,special_quote["id"]))
        database.initialize(); special.initialize()
        standard_detail=database.get_quote(standard_quote["id"]); special_detail=special.get_quote(special_quote["id"])
        self.assertEqual(len(standard_detail["invoices"]),1); self.assertEqual(standard_detail["invoices"][0]["is_legacy"],1)
        self.assertEqual(standard_detail["invoices"][0]["amount"],4321)
        self.assertEqual(len(special_detail["invoices"]),1); self.assertEqual(special_detail["invoices"][0]["amount"],765432)
        database.initialize(); special.initialize()
        self.assertEqual(len(database.get_quote(standard_quote["id"])["invoices"]),1)
        self.assertEqual(len(special.get_quote(special_quote["id"])["invoices"]),1)

    def test_invoice_excel_replaces_legacy_invoice_and_is_idempotent(self)->None:
        quotation=imports_manager.preview("standard",standard_book(),"daily.xlsx",self.user)
        imports_manager.confirm("standard",quotation["token"],self.user)
        quote=next(row for row in database.list_quotes({}) if row["folio"]=="QT-100")
        legacy_date=date(2026,8,1).isoformat()
        with database.connect() as db:
            db.execute("UPDATE quotes SET status='po',follow_up_type='email',po_total_usd=9999,po_date=? WHERE id=?",(legacy_date,quote["id"]))
        database.initialize()
        self.assertEqual(database.get_quote(quote["id"])["invoices"][0]["is_legacy"],1)

        preview=invoice_manager.preview("standard",invoice_book(),"invoices.xlsx",self.user)
        self.assertEqual((preview["new"],preview["unmatched"],preview["invalid"]),(2,1,0))
        result=invoice_manager.confirm("standard",preview["token"],self.user)
        self.assertEqual((result["invoices_added"],result["quotes_updated"],result["legacy_invoices_replaced"]),(2,1,1))
        detail=database.get_quote(quote["id"])
        self.assertEqual([row["invoice_number"] for row in detail["invoices"]],["8772","8762"])
        self.assertTrue(all(not row["is_legacy"] for row in detail["invoices"]))
        self.assertAlmostEqual(detail["po_total_usd"],350.25)
        self.assertEqual(detail["po_date"],"2026-09-12")
        self.assertIn("USD 350.25",detail["comments"][-1]["body"])
        self.assertEqual(detail["events"][-1]["event_type"],"po_invoices_updated")

        repeated=invoice_manager.preview("standard",invoice_book(include_unmatched=False),"invoices-again.xlsx",self.user)
        self.assertEqual((repeated["new"],repeated["duplicate"]),(0,2))
        repeated_result=invoice_manager.confirm("standard",repeated["token"],self.user)
        self.assertEqual((repeated_result["invoices_added"],repeated_result["quotes_updated"]),(0,0))
        with self.assertRaisesRegex(ValueError,"already been confirmed"):
            invoice_manager.confirm("standard",repeated["token"],self.user)

    def test_invoice_excel_rejects_non_po_and_special_workspace(self)->None:
        quotation=imports_manager.preview("standard",standard_book(),"daily.xlsx",self.user)
        imports_manager.confirm("standard",quotation["token"],self.user)
        preview=invoice_manager.preview("standard",invoice_book(include_unmatched=False),"invoices.xlsx",self.user)
        self.assertEqual((preview["new"],preview["not_po"]),(0,2))
        with self.assertRaisesRegex(ValueError,"only in Follow Up Quotations"):
            invoice_manager.preview("special",invoice_book(),"invoices.xlsx",self.user)

    def test_invoice_import_http_route_accepts_authenticated_csrf_request(self)->None:
        server=ThreadingHTTPServer(("127.0.0.1",0),app.Handler)
        thread=threading.Thread(target=server.serve_forever,daemon=True); thread.start()
        connection=http.client.HTTPConnection("127.0.0.1",server.server_port,timeout=10)
        headers={
            "Content-Type":"application/json",
            "Cookie":f"{app.COOKIE_NAME}={self.token}",
            "X-CSRF-Token":self.user["csrf_token"],
        }
        try:
            body=json.dumps({"filename":"invoices.xlsx","content_base64":base64.b64encode(invoice_book()).decode("ascii")})
            connection.request("POST","/api/import/invoices/preview",body=body,headers=headers)
            response=connection.getresponse(); payload=json.loads(response.read())
            self.assertEqual(response.status,201); self.assertEqual(payload["unmatched"],3)
            connection.request("POST","/api/import/invoices/confirm",body=json.dumps({"token":payload["token"]}),headers=headers)
            response=connection.getresponse(); confirmed=json.loads(response.read())
            self.assertEqual(response.status,201); self.assertEqual(confirmed["invoices_added"],0)
        finally:
            connection.close(); server.shutdown(); server.server_close(); thread.join(timeout=5)

    def test_special_legacy_duplicate_is_merged_with_history(self)->None:
        content=special_book(); preview=imports_manager.preview("special",content,"special.xlsx",self.user)
        imports_manager.confirm("special",preview["token"],self.user)
        with database.connect() as db:
            current=db.execute("SELECT * FROM special_quotes WHERE source_quote_number='S3'").fetchone()
            values=dict(current); values.pop("id"); values.update({
                "source_key":"legacy-full-row-key","source_quote_number":"","customer_name":"",
                "source_file":"old-special.xlsx","import_id":None,"status":"lost","loss_reason":"Over Budget",
                "follow_up_type":"call","comment":"Legacy follow-up","last_reviewed_at":database.now_iso(),
            })
            columns=list(values); marks=",".join("?" for _ in columns)
            legacy_id=db.execute(f"INSERT INTO special_quotes({','.join(columns)}) VALUES({marks})",tuple(values[c] for c in columns)).lastrowid
            db.execute("INSERT INTO special_quote_comments(quote_id,body,user_name,created_at) VALUES(?,?,?,?)",
                       (legacy_id,"Legacy follow-up","Historical data",database.now_iso()))
        special.initialize()
        with database.connect() as db:
            legacy=db.execute("SELECT * FROM special_quotes WHERE id=?",(legacy_id,)).fetchone()
            active=db.execute("SELECT * FROM special_quotes WHERE source_quote_number='S3' AND is_archived=0").fetchall()
        self.assertEqual(len(active),1); self.assertEqual(active[0]["status"],"lost")
        self.assertEqual(legacy["is_archived"],1); self.assertIn("Merged duplicate",legacy["archive_reason"])
        detail=special.get_quote(active[0]["id"])
        self.assertIn("Legacy follow-up",[comment["body"] for comment in detail["comments"]])

    def test_auth_user_password_reset_backup_and_audit(self)->None:
        logged,token=auth.login("takujiyamada","TestPassword123!","es")
        self.assertEqual(logged["language"],"es"); self.assertIsNotNone(auth.authenticate(token))
        created=auth.create_user(logged,{"username":"viewer","display_name":"Viewer","role":"superadmin","password":"ViewerPass123!","agent_name":"Viewer"})
        self.assertEqual(created["role"],"user"); self.assertTrue(created["can_edit"])
        updated=auth.update_user(logged,created["id"],{"display_name":"Viewer","role":"superadmin","agent_name":"Viewer","active":True,"password":"TemporaryPass456!"})
        self.assertEqual(updated["role"],"user"); self.assertTrue(updated["must_change_password"])
        reset_login,_=auth.login("viewer","TemporaryPass456!","en"); self.assertTrue(reset_login["must_change_password"])
        result=backup.perform(logged["display_name"]); self.assertTrue(result["ok"]); self.assertTrue(result["verified"]); self.assertFalse(backup.status()["overdue"])
        self.assertFalse(logged["can_view_audit"])
        with self.assertRaisesRegex(PermissionError,"Secretadmin"):
            auth.recent_audit(logged)
        ariel=next(user for user in auth.list_users(logged) if user["username"]=="arielcontreras")
        auth.update_user(logged,ariel["id"],{"display_name":ariel["display_name"],"agent_name":ariel["agent_name"],"active":True,"password":"SecretAdmin123!"})
        secret,_=auth.login("arielcontreras","SecretAdmin123!","en")
        self.assertTrue(secret["can_view_audit"])
        audit=auth.recent_audit(secret); self.assertTrue(any(row["action"]=="user_created" for row in audit)); self.assertTrue(any(row["action"]=="user_updated" for row in audit))

    def test_language_switch_preserves_manage_and_user_controls(self)->None:
        html=(PROJECT_DIR/"static"/"index.html").read_text(encoding="utf-8")
        javascript=(PROJECT_DIR/"static"/"app.js").read_text(encoding="utf-8")
        for element_id in ("sidebar-toggle","manage-status","manage-method","manage-comment","add-invoice","invoice-rows","new-display-name","new-agent","new-password","edit-name","edit-agent","edit-password"):
            self.assertIn(f'id="{element_id}"',html)
        self.assertIn("invoicePayload()",javascript)
        self.assertIn("/api/import/invoices/preview",javascript)
        self.assertNotIn("await loadData()",javascript)
        self.assertNotIn("const request = await fetch(endpoint",javascript)
        self.assertIn("sidebar-collapsed",javascript)
        self.assertIn("el.matches('label')",javascript)
        self.assertIn(":scope > input, :scope > select, :scope > textarea",javascript)
        self.assertNotIn("forEach(el=>el.textContent=t(el.dataset.i18n))",javascript)


if __name__=="__main__": unittest.main()
