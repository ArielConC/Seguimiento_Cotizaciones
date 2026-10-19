# Despliegue en Render con Neon

La aplicacion usa SQLite cuando `DATABASE_URL` no existe y PostgreSQL cuando Render proporciona esa variable. Nunca se debe guardar la cadena de Neon en Git, capturas, archivos `.env` versionados o mensajes.

## Antes de desplegar

1. Confirmar que `CAMBIOS_RENDER_NEON.md` no tenga fases criticas pendientes.
2. Ejecutar todas las pruebas locales con SQLite.
3. Ejecutar el migrador en modo lectura y comprobar el SHA-256 de la copia fuente.
4. Copiar la cadena **pooled** de Neon directamente al campo secreto `DATABASE_URL` de Render.

## Migracion controlada

Desde PowerShell, dentro de la carpeta del proyecto:

```powershell
$env:DATABASE_URL = Read-Host "Pega temporalmente la cadena pooled de Neon"
python .\migrate_sqlite_to_postgres.py --source .\data\backups\cotizaciones_20261007_000729.db
```

El primer comando no escribe la clave en un archivo. El segundo solo realiza un inventario de lectura. Si el hash, la integridad y los conteos son correctos:

```powershell
python .\migrate_sqlite_to_postgres.py --source .\data\backups\cotizaciones_20261007_000729.db --apply --report .\tmp\migration_report.json
Remove-Item Env:DATABASE_URL
```

El migrador se niega a sobrescribir una base Neon que ya contenga informacion de negocio o contrasenas configuradas. Conserva los IDs historicos y ajusta las secuencias de PostgreSQL.

## Respaldo y restauracion

En PostgreSQL, el boton de respaldo genera un ZIP logico con un manifiesto y un archivo JSONL por tabla. Se debe descargar inmediatamente, porque el disco de Render es temporal. Para inspeccionar un ZIP sin modificar ninguna base:

```powershell
python .\restore_postgres_export.py --source .\cotizaciones_YYYYMMDD_HHMMSS.zip
```

Para restaurarlo en una base PostgreSQL vacia, definir temporalmente `DATABASE_URL`, comprobar opcionalmente el hash esperado y ejecutar:

```powershell
$env:DATABASE_URL = Read-Host "Pega temporalmente la cadena de la base PostgreSQL vacia"
python .\restore_postgres_export.py --source .\cotizaciones_YYYYMMDD_HHMMSS.zip --expected-sha256 HASH_DEL_ZIP --apply --report .\tmp\restore_report.json
Remove-Item Env:DATABASE_URL
```

El restaurador se niega a sobrescribir una base que ya contenga informacion de negocio o contrasenas configuradas. Al terminar compara los conteos y ajusta las secuencias de IDs.

## Crear el servicio mediante Blueprint

1. Subir el commit preparado a GitHub.
2. En Render seleccionar **New > Blueprint**.
3. Elegir el repositorio `Seguimiento_Cotizaciones`.
4. Render detectara `render.yaml` y mostrara un Web Service gratuito en Virginia.
5. Cuando solicite `DATABASE_URL`, pegar directamente la cadena pooled copiada desde Neon.
6. Confirmar que el plan diga **Free** y que no se haya agregado una base Postgres de Render.
7. Crear el Blueprint y esperar a que `/health` responda correctamente.

## Validacion posterior

- Abrir la URL `onrender.com` y comprobar inicio de sesion.
- Comparar Dashboard, conteos, importaciones, usuarios, cotizaciones especiales y reportes con el informe del migrador.
- Cargar los TXT del 7 de octubre para recuperar QT-12090 a QT-12097 y sus facturas.
- Cargar los reportes mas recientes disponibles de Compact.
- Ejecutar una copia logica desde la app y descargar el ZIP; no dejar la unica copia en el disco temporal de Render.
- Probar desde dos navegadores antes de entregar la URL al equipo.

## Caracteristicas del plan gratuito

Render puede suspender el servicio despues de 15 minutos sin trafico. El primer acceso posterior puede tardar alrededor de un minuto. Esto no borra datos porque la informacion permanente vive en Neon; solamente los archivos temporales de Render se descartan.
