# Migración definitiva del módulo Manager al portal de Gerencia

Actualizado: 2 de noviembre de 2026.

## Respuesta ejecutiva

Sí es viable trasladar definitivamente el sistema al portal del jefe y retirar la web actual. La interfaz nueva puede conservar únicamente las pantallas **Gerencia** y **Reporte mensual**, junto con los controles generales mostrados en la imagen.

La solución recomendada es migrar la lógica necesaria al backend del portal del jefe y conservar PostgreSQL Neon como base viva única. No es necesario mover los datos a otra base si el nuevo backend puede conectarse de forma segura a Neon. La aplicación actual dejará de recibir tráfico y se apagará después de validar el reemplazo.

```text
Portal del jefe (nuevo sistema único)
  ├─ Autenticación y permisos del portal
  └─ Módulo Seguimiento de cotizaciones
       ├─ Gerencia
       ├─ Reporte mensual
       └─ Backend de cotizaciones migrado
            └─ PostgreSQL Neon (base viva única)
```

La web actual solo se conservará temporalmente durante las pruebas de aceptación y el corte. Después se deshabilitará, se retirarán sus secretos y se apagará su servicio. No quedarán dos aplicaciones operando en paralelo.

## Condición para poder retirar la aplicación actual

Aunque la navegación nueva muestre solo dos pantallas, el nuevo sistema debe absorber o reemplazar estas capacidades:

- lectura de cotizaciones USD y especiales JPY;
- Ver y Gestionar, si seguirán disponibles;
- importación Excel/TXT de cotizaciones y facturas;
- cálculo de prioridades, respuestas, fechas, alertas y totales;
- comentarios inmutables, eventos e historial;
- usuarios, permisos y cambio de contraseña, o su reemplazo por el login del portal;
- auditoría privada para Secretadmin;
- respaldos automáticos de Neon y procedimiento de restauración;
- health check, logs y recuperación ante fallos.

Las funciones administrativas pueden quedar fuera de la navegación de Manager, pero no pueden desaparecer sin un reemplazo documentado.

## Alcance funcional solicitado

### Navegación visible

Mostrar solamente:

1. **Gerencia** como página inicial.
2. **Reporte mensual**.

Ocultar Dashboard, Prioridades, Gestionadas, Seguras, PO sin fecha, PO, Perdidas, Archivo, Históricas, Reportes generales y Usuarios. La restricción debe existir también en el backend; no basta con esconder botones.

### Controles generales que se conservan

- Selector de sistema: **Follow Up Quotations (USD)** y **Special Quotations (JPY)**, si Gerencia desea consultar ambos.
- Selector global de agente NT Tool.
- Idioma: español, inglés y japonés.
- Nombre del usuario autenticado.
- Cambio de contraseña y cierre de sesión, salvo que el portal del jefe use inicio de sesión único.
- Importación de cotizaciones Excel/TXT e importación de facturas únicamente si el usuario tiene el permiso explícito `manager_import`.
- Acciones **Ver** y **Gestionar** únicamente si el usuario tiene `manager_write`; de lo contrario, **Ver** será de solo lectura.

### Pantalla Gerencia

- Periodos: todo el historial, hoy, mes actual, año fiscal abril–fecha actual y rango personalizado.
- El total Pending se filtra por fecha de cotización; el total PO se filtra por fecha de PO.
- Banners de total pendiente y total PO.
- Distribución S/A/B/C con importe y cantidad.
- Follow Up Quotations USD:
  - C: USD 0–500.
  - B: USD 501–1,000.
  - A: USD 1,001–5,000.
  - S: USD 5,001 en adelante.
- Special Quotations JPY conserva su clasificación percentil existente.
- Efectividad de contacto: con respuesta, sin respuesta y en espera.
- Resumen financiero: Pending, PO y Pending + PO.
- Filtros por búsqueda, estado, distribuidor, usuario final, prioridad, agente y periodo.
- Ordenamientos por prioridad, fecha, folio, importe y última actividad.
- Estado adicional **No gestionada**: Pending sin `last_reviewed_at`.
- Una fila por cotización, excluyendo históricos y archivados.
- Columnas: prioridad, fecha, cotización, código de distribuidor, usuario final, orden del cliente, estado, fecha PO, total PO, antigüedad, última actividad y acciones.
- Colores:
  - blanco: Pending con 0–8 días desde actividad;
  - naranja: Pending con 9–14 días;
  - rojo: Pending con 15 días o más;
  - verde: PO;
  - morado: Lost.
- Indicador de alto riesgo para cotizaciones Pending antiguas y distintivo 90+ días.
- **Ver** muestra el detalle completo, comentarios inmutables, eventos, agente distribuidor, serie, total interno y facturas.
- **Gestionar**, si está autorizado, conserva método Email/Llamada/Visita, respuesta, Pending/PO/Lost, Safe, motivo de pérdida, comentarios y facturas múltiples de PO.

### Pantalla Reporte mensual

- El periodo se calcula por la fecha de cada seguimiento guardado, no por la fecha original de la cotización.
- Excluir altas iniciales; incluir solamente acciones `review_saved`.
- Filtros por fecha inicial/final, usuario gestor, resultado y estado actual.
- Resultado: Gestionadas, Hubo respuesta, Sin respuesta o En espera.
- Estado actual: Todos, Pending, Lost o PO.
- El usuario gestor es quien guardó el cambio, aunque el agente asignado sea otra persona.
- KPIs: con respuesta, sin respuesta, en espera y cotizaciones gestionadas.
- La tabla conserva una fila por cotización y muestra la última gestión del periodo; el contador de actividades indica cuántas gestiones se guardaron.
- Columnas: fecha de actividad, cotización, gestionada por, agente asignado, respuesta, método, estado vigente, cambio realizado, importe y Ver.
- PO y Lost cuentan como respuesta; una Pending conserva “Hubo respuesta” si alguna gestión histórica registró respuesta positiva.
- USD y JPY nunca se mezclan ni se convierten.

## Arquitectura de destino recomendada

### Opción recomendada — Backend migrado al portal y una sola base Neon

Portar al backend del portal las reglas de negocio que hoy viven en `database.py`, `special.py`, `po_invoices.py`, `imports_manager.py`, `invoice_manager.py`, `auth.py` y `reports.py`, o empaquetarlas como un módulo interno reutilizable. El portal expone una API `/api/manager/v1` bajo su propio dominio. El servicio actual ya no será una dependencia después del corte.

El nuevo backend se conecta directamente a la base Neon únicamente desde el servidor. Debe utilizar un usuario PostgreSQL dedicado y secretos del hosting. Durante la migración puede usar el esquema actual; cualquier cambio futuro debe administrarse mediante migraciones versionadas del portal.

Endpoints necesarios:

- `GET /api/manager/v1/calendar`
- `GET /api/manager/v1/workspaces`
- `GET /api/manager/v1/agents?workspace=standard|special`
- `GET /api/manager/v1/dashboard?...filtros`
- `GET /api/manager/v1/quotes?...filtros`
- `GET /api/manager/v1/quotes/{workspace}/{id}`
- `GET /api/manager/v1/monthly-report?...filtros`
- `GET /api/manager/v1/report-users`
- Si habrá escritura: `PATCH /api/manager/v1/quotes/{workspace}/{id}`.
- Si habrá importaciones: rutas Preview/Confirm separadas para cotizaciones y facturas.

La API debe devolver JSON, validar todos los filtros, paginar las listas y aplicar permisos en servidor. Las fórmulas y consultas deben compararse contra la aplicación actual antes de apagarla.

### Autenticación

Usar el login del portal del jefe como identidad única. Mapear permisos equivalentes a `quotation_manager_read`, `quotation_manager_write`, `quotation_manager_import`, `quotation_manager_admin` y `quotation_audit_private`.

No se debe enviar `DATABASE_URL` al navegador ni consultar Neon directamente desde JavaScript.

Las cuentas y sesiones del sistema anterior no tienen que migrarse si el portal ya administra usuarios; sí debe conservarse `user_id`/nombre del actor en los nuevos eventos para que Reporte mensual y auditoría sigan identificando quién hizo cada cambio.

### Alternativa — Módulo interno aislado dentro del mismo despliegue

Si el stack del portal no es Python, puede mantener la lógica Python como un servicio interno privado desplegado junto al portal. No será la web anterior: será un backend sin interfaz pública, administrado como parte del nuevo sistema. En ese caso:

- solo el portal puede llamarlo mediante red privada o autenticación servidor-a-servidor;
- el navegador nunca lo contacta directamente;
- debe tener health check, logs, despliegue y rollback propios;
- no debe conservar rutas ni páginas de la aplicación anterior;
- sigue usando la misma base Neon y las mismas transacciones.

### Opción no recomendada — Nueva base separada

Mover los datos a otra base solo tiene sentido si el portal no puede usar Neon. Requeriría migración final, reconciliación de todas las tablas, secuencias, hashes, relaciones y un nuevo sistema de respaldo. No debe mantenerse sincronización bidireccional ni dos bases operativas.

## Plan de corte y retiro del sitio actual

1. Confirmar stack, autenticación, hosting y permisos del portal del jefe.
2. Implementar Gerencia, Reporte mensual y las operaciones de backend requeridas en un entorno de prueba.
3. Conectar ese entorno a una rama o copia de Neon, nunca a producción durante desarrollo destructivo.
4. Ejecutar pruebas de equivalencia con datos reales: totales, filtros, prioridades, respuesta, actividad, PO y Lost.
5. Programar una ventana corta de corte y anunciarla al equipo.
6. Bloquear temporalmente escrituras/importaciones en la web anterior.
7. Generar un respaldo final verificado de Neon y guardar su SHA-256.
8. Desplegar el portal nuevo con el secreto de Neon y ejecutar sus migraciones versionadas, si existen.
9. Reconciliar conteos y folios críticos antes de permitir escritura.
10. Habilitar el portal nuevo y validar con usuarios reales.
11. Mantener la web anterior apagada pero recuperable durante un periodo corto de rollback; no permitir uso simultáneo.
12. Al aprobar el corte, retirar dominio/acceso, borrar variables de entorno y credenciales del hosting anterior y conservar únicamente el código archivado y los respaldos.
13. Rotar la contraseña/rol usado por la aplicación anterior para impedir reconexiones accidentales.

No se debe apagar primero y migrar después. El retiro ocurre únicamente cuando el nuevo portal ha pasado la conciliación y las pruebas de escritura.

## Requisitos no funcionales

- Diseño responsive desde 1280 px y con tabla desplazable en pantallas menores.
- Toda cifra monetaria debe indicar USD o JPY.
- Fechas visibles numéricas; persistencia ISO `YYYY-MM-DD` y zona `America/Mexico_City`.
- HTTPS obligatorio.
- Secretos únicamente en variables protegidas del servidor.
- Control de acceso por permiso, no por elementos ocultos del frontend.
- Registro de auditoría para Ver sensible, Gestionar, imports y cambios de estado.
- Protección CSRF si se usan cookies; validación de audiencia/issuer si se usa JWT/OIDC.
- Rate limiting para login, exportaciones e importaciones.
- Health check de aplicación y base.
- Timeouts, mensajes de error no sensibles y trazabilidad con request ID.
- Pruebas de aislamiento: Manager no puede abrir rutas ocultas escribiendo la URL manualmente.
- No mostrar auditoría privada; continúa restringida al Secretadmin.
- No exponer hashes de contraseña, sesiones, IP, auditoría ni cadena de Neon.

## Fuente de datos y respaldo actual

La producción usa PostgreSQL Neon. Si el portal nuevo conserva esta base, no hay que importar un archivo para operar: basta configurar el nuevo backend con un rol seguro y realizar el corte. El respaldo se usa para recuperación, pruebas controladas o para migrar a otro proveedor.

El respaldo lógico verificado más reciente al preparar este documento es:

`C:\Users\fcoar\Documents\Respaldos_Cotizaciones\cotizaciones_neon_20261102_082810.zip`

- Creado: 2 de noviembre de 2026, 08:28:12, hora de México.
- Formato: `quotation-follow-up-postgresql-jsonl-v1`.
- 24 tablas y 4,427 filas.
- 554 cotizaciones USD y 192 cotizaciones especiales JPY.
- 1,485 eventos USD y 295 eventos JPY.
- SHA-256: `733dae5228aefc2c354edfe09feb10771a2f4ba11dab2af4ea436c5363fcc28d`.
- El checksum fue verificado correctamente.

Este ZIP contiene también usuarios, sesiones y auditoría. Debe transferirse únicamente por un canal privado, nunca subirse a GitHub ni entregarse como archivo público. Para desarrollar la interfaz debe usarse un snapshot sanitizado sin `users`, `sessions`, `audit_log`, contraseñas, IP ni comentarios sensibles. Para el corte definitivo se generará un respaldo nuevo inmediatamente antes de habilitar el portal.

## Criterios de aceptación

1. Solo aparecen Gerencia y Reporte mensual en la navegación.
2. Las rutas ocultas responden 403 para el perfil Manager.
3. Los totales, prioridades, respuestas y filas coinciden con el sistema actual para los mismos filtros.
4. USD y JPY permanecen separados.
5. El periodo de Gerencia y el de Reporte mensual conservan sus diferentes reglas de fecha.
6. Ver y Gestionar respetan permisos de servidor.
7. Todas las operaciones necesarias funcionan desde el portal nuevo sin depender del servicio anterior.
8. No existe una segunda base operativa, sincronización manual ni dos portales aceptando escrituras.
9. Ningún secreto o campo privado aparece en el bundle del navegador, logs o respuestas API.
10. Se validan escritorio, laptop, Chrome y Edge, español e inglés; japonés si se conserva el selector actual.

## Prompt maestro para el equipo o agente que modificará el portal del jefe

```text
Actúa como arquitecto y desarrollador full-stack senior. Debes migrar definitivamente al portal existente un módulo llamado “Seguimiento de cotizaciones — Manager” y preparar el retiro de la aplicación de cotizaciones anterior. Antes de modificar código, inspecciona el stack, la autenticación, el enrutamiento, el sistema de diseño, la gestión de secretos, las pruebas y el despliegue del portal. Conserva todas las funciones existentes del portal y evita reescrituras innecesarias.

OBJETIVO
Agregar únicamente dos pantallas visibles: “Gerencia” y “Reporte mensual”. Gerencia será la ruta inicial del módulo. No muestres Dashboard, Prioridades, Gestionadas, Safe, PO sin fecha, PO, Lost, Archive, Historical, Reportes generales o Usuarios. Sin embargo, migra o reemplaza todas las capacidades de backend necesarias para que el portal nuevo funcione sin la aplicación anterior: lectura, gestión, importaciones, eventos, comentarios, facturas, permisos, auditoría y respaldos.

ARQUITECTURA OBLIGATORIA
- La fuente única de verdad seguirá siendo PostgreSQL Neon. Reutiliza la base actual salvo que exista una razón técnica documentada para migrarla.
- Porta la lógica de negocio al backend del portal o empaquétala como un servicio interno privado perteneciente al nuevo despliegue. El servicio web anterior no puede quedar como dependencia.
- Implementa una API Manager versionada dentro del nuevo sistema. No crees una segunda base operativa.
- Nunca expongas DATABASE_URL, credenciales de Neon, cookies de servicio o tokens privilegiados al navegador.
- No conectes el frontend directamente a PostgreSQL.
- Reutiliza OIDC/JWT/SSO del portal y mapea permisos de lectura, escritura, importación, administración y auditoría privada.
- Si la lógica queda en un servicio interno Python, protégelo con red privada y autenticación servidor-a-servidor administrada por el nuevo portal.
- No uses iframe, reverse proxy permanente hacia la web anterior ni enlaces que mantengan esa aplicación como dependencia.
- Aplica permisos en backend. Ocultar elementos visuales no es autorización.

ALCANCE DE NAVEGACIÓN
- Mostrar únicamente “Gerencia” y “Reporte mensual”.
- Mantener selector USD/JPY, agente NT Tool, idioma, usuario, cambio de contraseña y logout cuando sean compatibles con la autenticación del portal.
- Mantener Upload Excel/TXT, Upload invoices, Ver y Gestionar solo con permisos explícitos `manager_import` y `manager_write`. En ausencia de esos permisos, la integración será de solo lectura.

PANTALLA GERENCIA
- Periodos: todo, hoy, mes actual, año fiscal abril–hoy y personalizado.
- Pending se filtra por quote_date; PO por po_date.
- Mostrar total Pending, total PO, prioridad S/A/B/C con importe y cantidad, efectividad de contacto y Pending + PO.
- USD: C 0–500, B 501–1,000, A 1,001–5,000, S 5,001+.
- JPY: conservar percentiles actuales; no convertir monedas.
- Filtros: búsqueda, estado —incluido Unmanaged—, distribuidor, End User, prioridad, agente y periodo.
- Ordenar por prioridad, fecha, folio, importe o actividad.
- Excluir históricos y archivados; una fila por cotización.
- Columnas: prioridad, fecha, folio, código distribuidor, End User, orden, estado, fecha PO, total PO, días abierta, última actividad y acciones.
- Colores: Pending 0–8 blanco, 9–14 naranja, 15+ rojo, PO verde, Lost morado. Marcar riesgo alto y 90+ días.
- Ver debe mostrar detalle, comentarios, eventos y facturas. Gestionar debe portar sin cambios funcionales las reglas de negocio comprobadas del sistema anterior.

PANTALLA REPORTE MENSUAL
- El rango usa `review_saved.created_at`, no quote_date; excluir altas iniciales.
- Filtros: inicio, fin, usuario gestor, resultado Managed/Yes/No/Pending y estado actual All/Pending/Lost/PO.
- El usuario gestor es quien guardó el seguimiento, no necesariamente el agente asignado.
- KPIs: responded, no response, awaiting response y managed quotations.
- Una fila por cotización con la última gestión del periodo y el número total de gestiones.
- Columnas: fecha actividad, cotización, gestionada por, agente asignado, respuesta efectiva, método, estado vigente, cambios, importe y Ver.
- PO y Lost son respuesta positiva. Pending conserva respuesta positiva si existe una gestión histórica con respuesta yes.

API PROPUESTA
Implementa `/api/manager/v1` en el sistema nuevo con calendar, workspaces, agents, dashboard, quotes, quote detail, monthly-report y report-users. Si se autoriza escritura, agrega PATCH de quote y Preview/Confirm para imports. Define contratos tipados, validación, paginación, errores consistentes y pruebas de autorización. Ningún endpoint debe depender de la URL o sesión de la aplicación anterior.

CALIDAD Y SEGURIDAD
- Responsive, tabla con scroll controlado y estilos integrados al diseño del portal.
- Fechas visibles numéricas, persistencia ISO, zona America/Mexico_City.
- HTTPS, CSRF para cookies o validación OIDC completa, rate limits, request IDs y logs sin secretos.
- No exponer users, sessions, audit_log, hashes, IP o comentarios privados fuera de endpoints autorizados.
- Auditoría privada continúa disponible solo para Secretadmin.

PRUEBAS DE ACEPTACIÓN
- Compara el nuevo módulo y la aplicación actual con los mismos filtros y demuestra igualdad de conteos y totales.
- Prueba USD y JPY, todos los periodos, estados, filtros y colores.
- Prueba permisos read-only/write/import y acceso manual a rutas ocultas.
- Durante la validación previa al corte, compara ambos sistemas sin permitir escrituras concurrentes. Después del corte, demuestra que todas las escrituras y lecturas funcionan exclusivamente en el portal nuevo.
- Prueba español e inglés, y japonés si se conserva.
- Ejecuta las pruebas del portal y entrega resultados, archivos modificados, variables de entorno requeridas y pasos de despliegue.

REGLAS DE TRABAJO
1. Primero presenta un mapa del stack actual y un plan de integración; no programes a ciegas.
2. No borres ni reemplaces funciones existentes del portal.
3. Reutiliza componentes, estilos y autenticación existentes.
4. Documenta cualquier supuesto o diferencia con la especificación.
5. No declares terminado el trabajo sin pruebas de integración contra un entorno seguro.

ENTREGABLES
- Módulo visual integrado.
- Adaptador/API Manager y contratos.
- Configuración segura de entorno.
- Pruebas unitarias, integración y autorización.
- Documento de despliegue y rollback.
- Matriz de equivalencia entre la vista Manager original y la nueva.
- Plan de corte, respaldo final, rotación de secretos y apagado del servicio anterior.
```

## Decisiones que el equipo del jefe debe confirmar antes de programar

1. Tecnología y hosting del portal del jefe.
2. Hosting final y si admite un backend Python interno en caso de que el portal use otro stack.
3. Sistema actual de login/SSO.
4. Si Manager será solo lectura o conservará Gestionar e importaciones.
5. Si se incluirán USD y JPY o solamente USD.
6. Si conservará los tres idiomas o solo español/inglés.
7. Cómo trabajarán los demás integrantes del equipo después de retirar la aplicación completa: dentro de Gerencia con filtros/permisos o mediante otras pantallas del portal.
8. Dónde se administrarán usuarios, permisos, auditoría y respaldos aunque esas opciones no aparezcan en la navegación Manager.
9. Quién administrará el rol de Neon, sus secretos y su rotación.
10. Duración de la ventana de rollback antes de eliminar definitivamente el hosting anterior.

