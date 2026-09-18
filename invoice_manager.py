import io
import pandas as pd
import database
import special
import auth

def sync_invoices(workspace: str, content: bytes, user: dict) -> dict:
    try:
        # 1. Leer el archivo Excel desde la memoria (saltando las primeras 2 filas de encabezado)
        df = pd.read_excel(io.BytesIO(content), header=2)
    except Exception as e:
        raise ValueError(f"No se pudo leer el archivo Excel. Detalle: {e}")

    # 2. Verificar que el reporte sea el correcto buscando nuestras columnas clave
    if 'Texto Extra 2' not in df.columns or 'Total' not in df.columns:
        raise ValueError("El Excel no tiene las columnas 'Texto Extra 2' o 'Total'. Asegúrate de subir el reporte 'Facturas - Todos los Documentos'.")

    # 3. Filtrar solo las filas que sí tienen un número de orden de cliente
    df_valid = df.dropna(subset=['Texto Extra 2'])
    
    invoices_added = 0
    invoices_skipped = 0
    
    # Seleccionar la base de datos correcta (USD o JPY)
    db_module = special if workspace == "special" else database
    
    with db_module.connect() as db:
        cursor = db.cursor()
        
        for index, row in df_valid.iterrows():
            customer_order = str(row['Texto Extra 2']).strip()
            if not customer_order or customer_order == 'nan':
                continue
            
            # Formatear la fecha, folio y total
            try:
                fecha = pd.to_datetime(row['Fecha']).strftime('%Y-%m-%d')
                total = float(row['Total'])
            except:
                continue # Si la fila tiene datos corruptos en fecha o total, la saltamos
            
            serie = str(row['Serie']).strip() if pd.notna(row['Serie']) else ''
            folio = str(row['Folio']).strip() if pd.notna(row['Folio']) else ''
            
            # 4. Buscar qué cotizaciones en el sistema tienen esta orden de cliente
            cursor.execute("SELECT id FROM quotes WHERE customer_order = ?", (customer_order,))
            quotes = cursor.fetchall()
            
            for q in quotes:
                quote_id = q['id']
                
                # 5. ANTIDUPLICADOS: Revisar si ya existe esta factura exacta
                cursor.execute("""
                    SELECT 1 FROM po_invoices 
                    WHERE quote_id = ? AND invoice_series = ? AND invoice_number = ?
                """, (quote_id, serie, folio))
                
                if cursor.fetchone():
                    invoices_skipped += 1
                    continue # Ya la tenemos guardada, saltamos al siguiente
                    
                # 6. Guardar la nueva factura
                cursor.execute("""
                    INSERT INTO po_invoices (quote_id, invoice_date, invoice_series, invoice_number, invoice_amount)
                    VALUES (?, ?, ?, ?, ?)
                """, (quote_id, fecha, serie, folio, total))
                
                # 7. Cambiar la cotización a "PO" y sumar todas sus facturas
                cursor.execute("""
                    UPDATE quotes 
                    SET status = 'po', 
                        po_date = COALESCE(po_date, ?),
                        po_total_usd = (SELECT SUM(invoice_amount) FROM po_invoices WHERE quote_id = ?)
                    WHERE id = ?
                """, (fecha, quote_id, quote_id))
                
                invoices_added += 1

        db.commit()
        
    # Registrar en el historial de auditoría quién subió el archivo
    auth.audit(user, "invoices_synced", workspace, "batch", f"Agregadas: {invoices_added}", f"Omitidas: {invoices_skipped}")
    
    return {
        "ok": True,
        "message": f"Sincronización exitosa. Se agregaron {invoices_added} facturas nuevas. Se omitieron {invoices_skipped} facturas que ya estaban en el sistema."
    }