# Despliegue de NT Tool Quotation Follow-up en Railway

La aplicación usa una sola instancia y una base SQLite en un volumen persistente. No se deben crear réplicas adicionales mientras se utilice SQLite.

## 1. Crear un repositorio privado

Subir únicamente el código de esta carpeta a un repositorio privado de GitHub. `.gitignore` y `.dockerignore` excluyen la base, respaldos, archivos importados, reportes y entornos locales.

Antes del primer `push`, confirmar que `data`, `.venv`, `output` y cualquier archivo `.db` o `.xlsx` no aparecen en la lista de cambios.

## 2. Crear el proyecto en Railway

1. En Railway, elegir **New Project**.
2. Elegir **Deploy from GitHub repo**.
3. Autorizar y seleccionar el repositorio privado.
4. Railway detectará `Dockerfile` y construirá el servicio.

El primer despliegue puede quedar detenido hasta que se agregue el almacenamiento persistente. Esto es intencional para evitar crear una base temporal.

## 3. Agregar el volumen

1. En el proyecto, crear un **Volume**.
2. Asociarlo al servicio de la aplicación.
3. Usar `/data` como **Mount Path**.
4. Mantener exactamente una réplica del servicio.

Railway expone automáticamente `RAILWAY_VOLUME_MOUNT_PATH`; la aplicación lo usa como directorio de datos. También se puede establecer `NT_QUOTE_DATA_DIR=/data` explícitamente.

## 4. Configurar variables

En **Service > Variables**, agregar:

```text
NT_QUOTE_DATA_DIR=/data
NT_QUOTE_HOST=0.0.0.0
NT_QUOTE_NO_BROWSER=1
NT_QUOTE_COOKIE_SECURE=1
NT_QUOTE_TRUST_PROXY=1
```

No establecer manualmente `PORT`: Railway lo proporciona y la aplicación lo reconoce automáticamente.

## 5. Configurar el despliegue

En **Service > Settings > Deploy**:

- Healthcheck Path: `/health`
- Restart Policy: `Always` en un plan pagado, o `On Failure` durante la prueba.
- Replicas: `1`

Generar un dominio en **Settings > Networking > Public Networking > Generate Domain**. La dirección tendrá HTTPS automático.

## 6. Migrar la base actual

1. Detener temporalmente la aplicación local para que no haya cambios durante la copia final.
2. Ejecutar un respaldo manual y verificarlo.
3. Instalar Railway CLI y enlazar el proyecto con `railway login` y `railway link`.
4. Subir la base verificada al volumen:

```text
railway volume files upload "C:\ruta\al\cotizaciones.db" /cotizaciones.db --overwrite
```

5. Si también se desea trasladar el archivo histórico de Excels, subir la carpeta `imports`:

```text
railway volume files upload "C:\ruta\a\imports" /imports --overwrite
```

6. Reiniciar o desplegar nuevamente el servicio.

Al arrancar, la aplicación crea las tablas de facturas de PO y convierte automáticamente cada PO histórica con fecha e importe en una factura heredada `LEGACY`. La migración es idempotente: reiniciar el servicio no crea facturas duplicadas. Después del primer arranque, revisar una PO histórica en **View** y confirmar que muestra el importe y la fecha anteriores.

No subir la base a GitHub ni colocarla como variable de entorno.

## 7. Respaldos

En la pestaña **Backups** del volumen, configurar:

- Daily
- Weekly
- Monthly

La aplicación también conserva sus respaldos SQLite verificados en `/data/backups`. Descargar periódicamente una copia externa:

```text
railway volume files download /backups "C:\Respaldos\NT Tool"
```

## 8. Validación antes de entregar el enlace

1. Abrir `/health` y comprobar `{"status":"ok","database":"ok"}`.
2. Iniciar sesión con una cuenta de prueba.
3. Confirmar que aparecen las cotizaciones existentes.
4. Hacer una vista previa de un Excel ya importado y comprobar que aparece como **Sin cambios**.
5. Guardar un seguimiento de prueba y comprobar usuario y hora.
6. Generar un PDF y un Excel.
7. Ejecutar un respaldo manual.
8. Cerrar sesión y comprobar que las páginas de datos requieren autenticación.

## 9. Cambio definitivo

Cuando la validación termine, detener la copia local y declarar Railway como la única base activa. No permitir que parte del equipo use la base local mientras otros usan la nube, porque se formarían dos historiales independientes.
