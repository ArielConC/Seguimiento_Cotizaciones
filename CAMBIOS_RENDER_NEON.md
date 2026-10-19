# Migracion y despliegue Render + Neon

Actualizado el 19 de octubre de 2026.

Este documento es el punto de reanudacion obligatorio para preparar la aplicacion de seguimiento de cotizaciones para Render y Neon. Debe actualizarse al terminar cada fase y antes de interrumpir el trabajo. No sustituye `CAMBIOS_PENDIENTES.md`: ese archivo conserva el historial funcional; este registra exclusivamente la migracion de infraestructura y base de datos.

## Objetivo

Publicar la aplicacion Python en un Web Service gratuito de Render y almacenar toda la informacion persistente en PostgreSQL de Neon, recuperando la ultima copia disponible de SQLite sin modificarla y sin depender del disco efimero de Render.

Arquitectura objetivo:

```text
Usuarios -> HTTPS de Render -> aplicacion Python -> PostgreSQL de Neon
                                      |
                                      +-> archivos temporales y reportes efimeros
```

## Estado actual y decisiones confirmadas

- [x] Render: cuenta creada. Aun no se ha creado el Web Service.
- [x] Neon: proyecto `seguimiento-cotizaciones` creado.
- [x] Neon: branch `production`, base `neondb`, rol `neondb_owner`.
- [x] Neon: region AWS US East 1 (N. Virginia).
- [x] Neon: connection pooling activado.
- [x] No usar PostgreSQL gratuito de Render: expira a los 30 dias.
- [x] No usar Koyeb: las cuentas nuevas requieren metodo de pago y plan pagado.
- [x] No publicar ni guardar `DATABASE_URL`, contrasenas o secretos en Git.
- [x] Mantener funcionamiento local con SQLite para pruebas y recuperacion.
- [x] Adaptar produccion para usar PostgreSQL cuando exista `DATABASE_URL`.
- [x] Migrar y conciliar la copia SQLite del 7 de octubre en Neon.
- [ ] Crear y validar el Web Service gratuito de Render.

## Fuente de recuperacion protegida

Archivo original:

`data/backups/cotizaciones_20261007_000729.db`

- SHA-256: `3CEA3DC09C3CDE0D81D8B36BB857A3689F13E9E04BFCC8AB6F8D538F5FA85BD7`
- Integridad SQLite verificada anteriormente: `ok`.
- Corte efectivo aproximado: 6 de octubre de 2026 a las 18:07, hora de Mexico.
- Ultimo folio normal confirmado en la copia: `QT-12089`.
- Regla de seguridad: la migracion solo puede leer este archivo; nunca debe abrirlo en modo escritura, renombrarlo ni reemplazarlo.
- Antes de importar a Neon se debe crear una segunda copia de trabajo y volver a comprobar el hash del original.

Recuperacion complementaria ya identificada:

- El reporte de cotizaciones TXT del 7 de octubre contiene `QT-12090` a `QT-12097` y puede reimportarse despues de restaurar la base.
- El reporte de facturas TXT del 7 de octubre puede reponer conciliaciones de facturas disponibles en ese corte.
- Los seguimientos manuales posteriores al corte solo se recuperaran si se obtiene el volumen de Railway u otra copia mas reciente.

## Restricciones tecnicas encontradas

La aplicacion actual usa directamente SQLite en `database.py`, `auth.py`, `special.py` y `backup.py`. La migracion debe resolver, como minimo:

- `sqlite3`, `sqlite3.Row` y cursores con acceso por nombre e indice.
- Marcadores SQL `?` frente a los marcadores de PostgreSQL.
- `INTEGER PRIMARY KEY AUTOINCREMENT` y recuperacion de `lastrowid`.
- `INSERT OR IGNORE`.
- `BEGIN IMMEDIATE`.
- `PRAGMA table_info`, `foreign_keys`, `journal_mode`, `busy_timeout` e `integrity_check`.
- Funcion SQLite `datetime(...)` usada en ordenamientos y subconsultas.
- Creacion incremental de columnas y tablas al iniciar.
- Copias de seguridad basadas en copiar el archivo `.db`, incompatibles con Neon.
- Directorios persistentes `data/imports` y `data/backups`, que no pueden considerarse durables en Render gratuito.

## Estrategia de implementacion

### Fase 1: capa de acceso compatible

- [x] Introducir una capa de conexion comun que seleccione PostgreSQL si existe `DATABASE_URL` y SQLite en caso contrario.
- [x] Conservar la interfaz que usan los modulos actuales: `execute`, `executemany`, `executescript`, `fetchone`, `fetchall`, `rowcount`, `lastrowid`, `commit`, `rollback` y context manager.
- [x] Mantener filas compatibles con acceso `row["campo"]`, `row[0]`, `dict(row)` y `row.keys()`.
- [x] Evitar concatenar datos del usuario en SQL durante la conversion de marcadores.
- [x] Configurar conexiones PostgreSQL para el endpoint pooled de Neon; cada operacion abre una conexion nueva y la cadena de Neon determina SSL. Falta validar esta conexion contra el proyecto real.
- [x] Añadir `psycopg[binary]==3.2.12` a `requirements.txt`.

### Fase 2: esquema portable

- [x] Traducir el subconjunto de DDL y SQL de SQLite utilizado por la aplicacion a PostgreSQL.
- [x] Preparar la creacion de todas las tablas, indices, restricciones y columnas incrementales en PostgreSQL.
- [x] Convertir IDs autoincrementales a `IDENTITY`/secuencias sin cambiar los IDs historicos.
- [x] Convertir `INSERT OR IGNORE` a `ON CONFLICT DO NOTHING`.
- [x] Convertir `BEGIN IMMEDIATE` a una transaccion con bloqueo asesor en PostgreSQL.
- [x] Reemplazar `PRAGMA table_info` por introspeccion de `information_schema` en PostgreSQL.
- [x] Traducir los usos de `datetime`, `date`, `instr`, `printf` y sumas booleanas usados por las consultas actuales.
- [x] Conservar fechas y horas como cadenas ISO y mantener `America/Mexico_City` en Render.
- [x] Diseñar la inicializacion como idempotente; falta demostrarla en Neon con dos arranques reales.

### Fase 3: respaldos y archivos efimeros

- [x] Mantener el respaldo SQLite actual solamente cuando el backend sea SQLite.
- [x] En PostgreSQL, generar y descargar un ZIP logico verificado con manifiesto y JSONL por tabla.
- [x] Guardar en PostgreSQL el contenido de una importacion entre Preview y Confirm; no depender del filesystem efimero de Render.
- [x] Mantener Excel/TXT y reportes generados como temporales descargables, sin considerarlos datos durables.
- [x] Confirmar mediante las pruebas locales que los reportes se generan y descargan sin persistencia posterior.
- [x] Añadir `restore_postgres_export.py` y documentar la exportacion/restauracion fuera del proveedor.

### Fase 4: migrador SQLite -> PostgreSQL

- [x] Crear `migrate_sqlite_to_postgres.py` como comando independiente, seguro y de solo lectura por defecto.
- [x] Exigir `DATABASE_URL` por variable de entorno; nunca por argumento visible ni archivo versionado.
- [x] Abrir SQLite en modo de solo lectura.
- [x] Crear/verificar el esquema PostgreSQL antes de copiar.
- [x] Importar tablas en orden de dependencias y dentro de una transaccion.
- [x] Preparar la conservacion de IDs, estados, comentarios, eventos, usuarios, hashes, auditoria, especiales, facturas, importaciones y configuraciones.
- [x] Ajustar secuencias PostgreSQL al ID maximo despues de importar.
- [x] Bloquear una segunda importacion si el destino contiene datos de negocio o contrasenas configuradas.
- [x] Generar un reporte de conciliacion por tabla y abortar ante diferencias de conteo.
- [x] Incluir validaciones sobre `QT-11966`, `QT-12004` y `QT-12089`.
- [ ] Reimportar posteriormente los TXT del 7 de octubre para recuperar `QT-12090` a `QT-12097` y sus facturas, verificando deduplicacion.

### Fase 5: configuracion de Render

- [x] Añadir `render.yaml` y documentar el procedimiento en `DEPLOY_RENDER_NEON.md`.
- [x] Definir un Web Service gratuito conectado al repositorio de GitHub.
- [x] Definir region Virginia, cercana a Neon N. Virginia.
- [x] Instalar dependencias Python fijadas mediante el `Dockerfile`.
- [x] Iniciar el servidor enlazado a `0.0.0.0` y al `PORT` proporcionado por Render.
- [x] Configurar `/health` como health check sin informacion sensible.
- [ ] Variables secretas: `DATABASE_URL` y secreto de sesion/aplicacion; capturarlas directamente en Render.
- [x] Definir host, zona horaria, temporales y banderas de nube no secretas.
- [x] No configurar `NT_QUOTE_DATA_DIR` como almacenamiento persistente en Render.
- [x] Activar cookies seguras y proxy HTTPS en Render.
- [x] Fijar Python 3.12 mediante la imagen del `Dockerfile`.

### Fase 6: pruebas obligatorias antes del corte

- [x] Ejecutar todas las pruebas existentes con SQLite: 44/44 correctas el 19 de octubre de 2026.
- [x] Añadir pruebas de traduccion SQL, filas compatibles, configuracion Render y validacion de respaldos logicos.
- [ ] Probar contra PostgreSQL temporal o Neon: inicio de sesion, cambio de contrasena y permisos.
- [ ] Probar Follow Up Quotations: listas, filtros, Manage, View, estados Pending/Lost/PO y Seguras.
- [ ] Probar facturas multiples, PO sin fecha, conciliacion e importacion Excel/TXT.
- [ ] Probar Special Quotations JPY, deduplicacion y Monthly Report.
- [ ] Probar comentarios inmutables, auditoria privada y usuarios.
- [ ] Probar reportes diarios, semanales, mensuales y por rango, incluido PDF ejecutivo.
- [ ] Probar dos escrituras concurrentes para confirmar que PostgreSQL evita los bloqueos propios de SQLite.
- [ ] Comparar conteos y sumas clave entre SQLite y PostgreSQL.
- [ ] Confirmar que un redeploy y un periodo de suspension de Render no eliminan datos.

### Fase 7: despliegue y recuperacion diaria

- [ ] Crear el Web Service solo cuando el commit compatible con PostgreSQL este en GitHub.
- [ ] Cargar secretos directamente en Render, nunca en el repositorio o capturas.
- [ ] Desplegar primero sin trafico del equipo y revisar logs/health check.
- [ ] Ejecutar la migracion una sola vez de forma controlada.
- [ ] Entrar con una cuenta de prueba y validar los totales antes de invitar al equipo.
- [ ] Importar los reportes mas recientes de Compact para alcanzar el dia del corte.
- [ ] Cambiar contrasenas temporales si existe duda sobre accesos anteriores.
- [ ] Entregar URL, manual de acceso y procedimiento de respaldo al equipo.

## Criterios de aceptacion

La migracion se considerara terminada solamente cuando:

1. La aplicacion funcione localmente con SQLite y en Render con Neon.
2. Todas las tablas y conteos de la copia origen esten conciliados.
3. Los IDs y relaciones historicas se conserven.
4. Las operaciones criticas funcionen con al menos dos sesiones simultaneas.
5. Un redeploy no pierda cambios.
6. La base original conserve el mismo SHA-256.
7. Exista un respaldo PostgreSQL descargable y un procedimiento documentado de restauracion.
8. No haya secretos en `git diff`, historial nuevo, logs de prueba ni archivos `.env`.

## Registro de avance

### 19 de octubre de 2026

- [x] Creado este documento antes de modificar el codigo.
- [x] Confirmado que el repositorio estaba limpio al iniciar.
- [x] Identificada la dependencia extensa de SQL especifico de SQLite.
- [x] Registrado el hash de la base fuente.
- [x] Implementada `db_backend.py`, capa dual SQLite/PostgreSQL con traduccion del dialecto usado por la app.
- [x] Adaptados esquema, usuarios, cotizaciones normales, cotizaciones especiales, importaciones y respaldos.
- [x] El contenido temporal de Preview/Confirm ahora se conserva en PostgreSQL cuando se usa Neon.
- [x] Creado migrador seguro `migrate_sqlite_to_postgres.py`; el modo lectura verifico integridad `ok`, hash y conteos sin modificar el origen.
- [x] Creado respaldo logico ZIP y restaurador `restore_postgres_export.py` para un destino PostgreSQL vacio.
- [x] Añadidos `render.yaml`, controlador PostgreSQL y guia `DEPLOY_RENDER_NEON.md`.
- [x] Suite completa ejecutada en una sola corrida y ampliada despues: 47 pruebas, todas correctas. La prueba HTTP real de Preview/Confirm tambien paso.
- [x] Corregida la diferencia de precision de `REAL`: PostgreSQL usa `DOUBLE PRECISION` para conservar centavos e importes altos.
- [x] Hash vuelto a comprobar despues de los cambios: `3CEA3DC09C3CDE0D81D8B36BB857A3689F13E9E04BFCC8AB6F8D538F5FA85BD7`.
- [x] `compileall` y `git diff --check` correctos; no se encontro una cadena real de conexion ni una credencial en los cambios preparados.
- [x] Migracion real ejecutada contra Neon el 19 de octubre de 2026; integridad `ok` y todos los conteos `source = target`.
- [x] Reporte local de conciliacion guardado en `tmp/migration_report.json`; no contiene la cadena de conexion.
- [x] Verificados en Neon `QT-11966` y `QT-12004` como PO, y `QT-12089` como Pending, iguales al origen.
- [x] La base SQLite original mantuvo el mismo SHA-256 despues de la migracion.
- [ ] Pendiente inmediato: ejecutar `verify_postgres.py` en la misma PowerShell para validar consultas reales, doble inicializacion y lecturas concurrentes.
- [ ] Pendiente externo: configurar `DATABASE_URL` de forma privada en Render.
- [ ] Despues: crear el Blueprint de Render, validar `/health`, entrar con dos navegadores y reimportar los TXT del 7 de octubre.

## Reanudacion rapida si el trabajo se interrumpe

1. Leer este archivo completo.
2. Ejecutar `git status --short` y conservar cualquier cambio existente.
3. Revisar el ultimo punto marcado en **Registro de avance**.
4. Verificar nuevamente el SHA-256 de la base fuente antes de ejecutar un migrador.
5. Ejecutar las pruebas SQLite antes y despues de cada fase.
6. Las fases de codigo 1 a 4 ya estan implementadas localmente. Antes de crear Render, ejecutar la migracion real y las pruebas de Neon indicadas arriba.
7. No marcar la migracion como completa solo por las pruebas SQLite: la conexion real a Neon sigue siendo obligatoria.
