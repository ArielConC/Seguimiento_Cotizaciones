import io
import uuid
import html
import pandas as pd
import database
import special
import auth

# Memoria temporal para guardar las facturas entre el paso 1 y el paso 2
_pending_invoices = {}

def preview(workspace: str, content: bytes, filename: str, user: dict) -> dict:
    try: df = pd.read_excel(io.BytesIO(content), header=2)
    except Exception as e: raise ValueError(f"No se pudo leer el archivo Excel. Detalle: {e}")

    if 'Texto Extra 2' not in df.columns or 'Total' not in df.columns:
        raise ValueError("El Excel no tiene las columnas necesarias (Texto Extra 2, Total).")

    df_valid = df.dropna(subset=['Texto Extra 2'])
    db_module = special if workspace == "special" else database
    
    to_insert = []
    html_rows = []
    
    with db_module.connect() as db:
        cursor = db.cursor()
        for index, row in df_valid.iterrows():
            customer_order = str(row['Texto Extra 2']).strip()
            if not customer_order or customer_order == 'nan': continue
                
            try:
                fecha = pd.to_datetime(row['Fecha']).strftime('%Y-%m-%d')
                total = float(row['Total'])
            except: continue
            
            serie = str(row['Serie']).strip() if pd.notna(row['Serie']) else ''
            folio = str(row['Folio']).strip() if pd.notna(row['Folio']) else ''
            
            cursor.execute("SELECT id FROM quotes WHERE customer_order = ?", (customer_order,))
            quotes = cursor.fetchall()
            
            safe_order = html.escape(customer_order)
            safe_factura = html.escape(f"{serie}-{folio}")
            
            if not quotes:
                html_rows.append(f"<tr><td>{fecha}</td><td>{safe_factura}</td><td>{safe_order}</td><td><span class='badge' style='background:var(--gray-300)'>Sin cotización</span></td></tr>")
                continue
                
            for q in quotes:
                quote_id = q['id']
                cursor.execute("SELECT 1 FROM po_invoices WHERE quote_id = ? AND invoice_series = ? AND invoice_number = ?", (quote_id, serie, folio))
                if cursor.fetchone():
                    html_rows.append(f"<tr><td>{fecha}</td><td>{safe_factura}</td><td>{safe_order}</td><td><span class='badge' style='background:var(--gray-300)'>Duplicada (Omitida)</span></td></tr>")
                else:
                    html_rows.append(f"<tr><td>{fecha}</td><td>{safe_factura}</td><td>{safe_order}</td><td><span class='badge' style='background:#10b981;color:white'>Nueva</span></td></tr>")
                    to_insert.append((quote_id, fecha, serie, folio, total))
                    
    token = str(uuid.uuid4())
    _pending_invoices[token] = to_insert
    
    preview_html = f"""
    <div class="table-wrap" style="max-height: 250px; overflow-y: auto; margin-top: 1rem;">
        <table>
            <thead><tr><th>Fecha</th><th>Factura</th><th>Orden (PO)</th><th>Estado</th></tr></thead>
            <tbody>{''.join(html_rows) if html_rows else '<tr><td colspan="4">No hay facturas válidas</td></tr>'}</tbody>
        </table>
    </div>
    <p style="margin-top: 1rem; font-weight: bold; color: #10b981;">Se agregarán {len(to_insert)} facturas nuevas a la base de datos.</p>
    """
    return {"token": token, "preview_html": preview_html}

def confirm(workspace: str, token: str, user: dict) -> dict:
    if token not in _pending_invoices:
        raise ValueError("La sesión expiró. Sube el archivo de nuevo.")
        
    data = _pending_invoices.pop(token)
    if not data:
        return {"ok": True, "message": "No había facturas nuevas para agregar."}
        
    db_module = special if workspace == "special" else database
    invoices_added = 0
    
    with db_module.connect() as db:
        cursor = db.cursor()
        for quote_id, fecha, serie, folio, total in data:
            cursor.execute("""
                INSERT INTO po_invoices (quote_id, invoice_date, invoice_series, invoice_number, invoice_amount)
                VALUES (?, ?, ?, ?, ?)
            """, (quote_id, fecha, serie, folio, total))
            
            cursor.execute("""
                UPDATE quotes 
                SET status = 'po', 
                    po_date = COALESCE(po_date, ?),
                    po_total_usd = (SELECT SUM(invoice_amount) FROM po_invoices WHERE quote_id = ?)
                WHERE id = ?
            """, (fecha, quote_id, quote_id))
            invoices_added += 1
        db.commit()
        
    auth.audit(user, "invoices_synced", workspace, "batch", f"Agregadas: {invoices_added}", "")
    return {"ok": True, "message": f"¡Éxito! Se agregaron {invoices_added} facturas nuevas."}