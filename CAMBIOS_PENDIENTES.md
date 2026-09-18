# Seguimiento de cambios

Actualizado el 18 de septiembre de 2026. La fase de facturas múltiples quedó implementada, migrada y validada antes de publicar la versión en la nube. Los requisitos siguientes están autorizados para una futura implementación, pero todavía no se han aplicado a la aplicación.

## Cambios pendientes autorizados: periodos, vista Gerencia y seguimiento visual

### Filtros de periodo en Resumen

- [ ] Agregar un selector de periodo que permita elegir **Todo el historial**, **Hoy**, **Mes actual**, **Año fiscal** y **Rango personalizado**.
- [ ] Definir el año fiscal como el periodo comprendido entre el 1 de abril y la fecha actual. Entre enero y marzo, el inicio debe ser el 1 de abril del año calendario anterior.
- [ ] En Rango personalizado, solicitar fecha inicial y fecha final, incluir ambos extremos y validar que la fecha final no sea anterior a la inicial.
- [ ] Mostrar de forma visible el periodo activo y mantener la selección mientras dure la sesión del usuario.
- [ ] Aplicar el periodo a la cantidad y al importe total de cotizaciones Pending usando la **fecha de la cotización**.
- [ ] Aplicar el periodo a la cantidad y al importe total de PO usando la **fecha de PO**, calculada actualmente a partir de las facturas asociadas.
- [ ] Aplicar el periodo a Priority Distribution usando la **fecha de la cotización**.
- [ ] Actualizar al mismo tiempo las cantidades y los importes de las cuatro prioridades para evitar que los cuadros muestren periodos diferentes.
- [ ] Mantener las monedas separadas: Follow Up Quotations en USD y Special Quotations en JPY, sin conversión.
- [ ] Mantener **Todo el historial** como opción explícita para reproducir los totales acumulados actuales.

### Vista exclusiva Gerencia para TAKUJI YAMADA

- [ ] Mantener a TAKUJI YAMADA como Superadmin y conservar su acceso a la administración de Usuarios.
- [ ] Reemplazar para este perfil las vistas Gestionadas, Seguras, PO sin fecha, PO y Perdidas por una sola vista llamada **Gerencia**.
- [ ] Eliminar para este perfil la vista Historical/Históricas.
- [ ] Dejar en su navegación únicamente **Gerencia**, **Reportes** y **Usuarios**, además de los controles generales de espacio, idioma, contraseña y cierre de sesión.
- [ ] Hacer que Gerencia sea su vista principal al entrar y que reúna, en una sola tabla y sin duplicar filas, todos los registros operativos del espacio seleccionado: Pending, Safe, PO Date Missing, PO y Lost. Los registros Historical/Históricos no deben aparecer.
- [ ] Permitir en Gerencia búsqueda y filtros por estado, prioridad, agente NT Tool, distribuidor, End User y periodo, además de los ordenamientos útiles de fecha, folio, importe y última actividad.
- [ ] Mostrar en Gerencia una fila por cotización con estas columnas: prioridad, fecha de cotización, número de cotización, código de distribuidor de tres letras, End User, Orden del cliente, estado, días desde la cotización y última actividad.
- [ ] Calcular **Días desde la cotización** como días calendario completos entre la fecha de cotización y la fecha actual de la aplicación.
- [ ] Para Pending, mostrar como Última actividad la fecha y hora de la última revisión guardada. Cuando nunca se haya guardado una revisión, mostrar la fecha de incorporación al sistema e identificarla como alta inicial.
- [ ] Para PO y Lost, mostrar como Última actividad la fecha y hora del cambio de estado más reciente.
- [ ] Ocultar únicamente en las listas de TAKUJI YAMADA la columna Agente distribuidor. Mantener ese dato completo dentro de View/Details.
- [ ] Conservar View/Details para consultar la razón social completa, Agente distribuidor, serie, total neto interno, comentarios, facturas e historial funcional permitido.
- [ ] Aplicar en Gerencia los indicadores visuales de estado y antigüedad definidos en las secciones siguientes para que pueda identificarse de un vistazo qué cambió y desde cuándo.

### Catálogo de distribuidores por código de tres letras

- [ ] Usar como catálogo inicial el archivo `Listado y directorio de clientes.xls`, hoja `Reporte de Compac`.
- [ ] Leer únicamente la columna A **Código** y la columna B **Nombre (Cliente)**. En el archivo recibido los encabezados se encuentran en la fila 4 y los datos comienzan en la fila 6.
- [ ] Importar los 59 pares código–razón social utilizables detectados en el archivo recibido. No se detectaron códigos duplicados en esta versión.
- [ ] Guardar el catálogo en la base de datos para no depender del archivo de Dropbox durante cada consulta.
- [ ] Relacionar la razón social del distribuidor recibida en los Excel diarios con el catálogo mediante una comparación normalizada: recortar espacios, comparar sin distinguir mayúsculas/minúsculas y normalizar espacios repetidos. No crear códigos mediante abreviaturas automáticas.
- [ ] Mostrar en las listas de todos los usuarios únicamente el código de tres letras del distribuidor.
- [ ] Mantener la razón social completa y el código dentro de View/Details.
- [ ] Si una razón social no tiene coincidencia inequívoca, mostrar **Sin código** en la lista, conservar la razón social original en View/Details y registrar el caso para corrección del catálogo. No asignar la primera coincidencia aproximada.
- [ ] Conservar el código ya relacionado en cada cotización aunque se vuelva a cargar un Excel sin cambios, y actualizarlo si el catálogo recibe una correspondencia corregida.

### Organización de Gestionadas para los demás usuarios

- [ ] En la vista Gestionadas, sustituir prioridad y los demás criterios como organización principal por un selector de estado con **Todos**, **Pending**, **Lost** y **PO**.
- [ ] Cuando se elija un estado, ordenar automáticamente de la última modificación guardada a la más antigua.
- [ ] En **Todos**, agrupar en el orden Pending, Lost y PO, y dentro de cada grupo ordenar de la última modificación a la más antigua.
- [ ] Recalcular la posición de una fila inmediatamente después de guardar una revisión o un cambio de estado.
- [ ] Mantener la búsqueda por texto únicamente como apoyo para localizar un registro concreto; la clasificación funcional de esta vista debe depender del estado y de la última modificación.

### Colores por estado y tiempo sin seguimiento

- [ ] Aplicar esta señalización a las cotizaciones ya gestionadas en Gestionadas y a las mismas filas dentro de Gerencia.
- [ ] Mostrar en blanco las filas Pending con entre 0 y 8 días calendario desde la última revisión guardada.
- [ ] Mostrar en naranja las filas Pending con entre 9 y 14 días calendario desde la última revisión guardada.
- [ ] Mostrar en rojo las filas Pending con 15 días calendario o más desde la última revisión guardada.
- [ ] Mostrar en verde las filas cuyo estado vigente sea PO.
- [ ] Mostrar en morado las filas cuyo estado vigente sea Lost.
- [ ] Considerar como revisión cualquier acción de Manage que se guarde correctamente, aunque el estado continúe en Pending y no cambien otros campos.
- [ ] Al guardar una revisión Pending, reiniciar a cero el contador de tiempo sin seguimiento y devolver la fila a blanco.
- [ ] Abrir View/Details sin guardar no debe reiniciar el contador ni alterar los colores.
- [ ] Mantener suficiente contraste de texto y agregar una etiqueta textual o ayuda accesible para que el significado no dependa únicamente del color.

### Antigüedad total y Stale Quote

- [ ] Mantener separado el contador **Días desde la cotización** del contador **Días sin seguimiento**. El primero parte de la fecha de cotización; el segundo parte de la última revisión guardada.
- [ ] Cuando una cotización tenga más de 90 días calendario desde su fecha, destacar la celda del número de días con una etiqueta visible `90+ days` o equivalente, sin reemplazar el color de estado de toda la fila.
- [ ] Al abrir Manage para una cotización de más de 90 días que todavía esté Pending, mostrar una pregunta explícita para confirmar si la operación se perdió.
- [ ] Si el usuario responde que sí, preseleccionar estado Lost y el nuevo motivo **Stale Quote**, permitiendo que revise la información antes de guardar.
- [ ] Si responde que no, permitir continuar con la gestión normal sin cambiar automáticamente el estado.
- [ ] Agregar **Stale Quote** a la lista de motivos de pérdida y mostrarlo en View/Details, listas Lost y reportes igual que los motivos existentes.
- [ ] No generar una pérdida ni un comentario de pérdida hasta que el usuario guarde Manage.

### Fechas, zona horaria y validación

- [ ] Calcular Hoy, Mes actual, año fiscal, días desde la cotización y días sin seguimiento usando la zona horaria configurada para la operación en México, evitando que Railway/UTC cambie el día cerca de la medianoche.
- [ ] Agregar pruebas de límites para 8, 9, 14, 15, 90 y 91 días; cambio de año fiscal; rangos inclusivos; PO filtradas por fecha de PO; y reinicio del contador al guardar una revisión.
- [ ] Probar los filtros y totales por separado en USD y JPY.
- [ ] Verificar que el catálogo de distribuidores no genere coincidencias ambiguas, que los registros sin código permanezcan accesibles y que la razón social completa siga disponible en View/Details.
- [ ] Verificar los permisos y la navegación especial de TAKUJI YAMADA sin modificar la experiencia ni los permisos de los demás Superadmin, User y Secretadmin.

## Cambios implementados: interfaz y registro de PO con múltiples facturas

### Interfaz adaptable

- [x] Agregar un control visible para ocultar y volver a mostrar el panel lateral izquierdo.
- [x] Al ocultar el panel, la tabla debe aprovechar todo el ancho disponible para mostrar mejor las columnas.
- [x] Revisar el comportamiento al mover la aplicación entre monitores con diferentes resoluciones o escalas de Windows, evitando que botones o columnas importantes queden fuera del área visible.
- [x] Mantener desplazamiento horizontal como respaldo cuando el ancho disponible todavía no sea suficiente.
- [x] Recordar la preferencia del panel abierto o cerrado durante la sesión del usuario.

### Motivo de pérdida condicional

- [x] Mostrar el motivo de pérdida únicamente cuando la cotización tenga estado **Lost / Perdida**.
- [x] Ocultar la columna de motivo de pérdida en las listas generales, Pending, Safe, Managed y PO; mostrarla en la vista Lost.
- [x] En View/Details y en los reportes, omitir el campo de motivo de pérdida cuando la cotización no esté perdida.
- [x] Al sacar una cotización de Lost, limpiar el motivo activo sin eliminar del historial el evento anterior.

### PO formada por una o varias facturas

- [x] Sustituir la captura manual de un único total de PO por un listado de facturas asociadas a la cotización.
- [x] Al seleccionar estado PO, seguir exigiendo el método de seguimiento: **E-Mail**, **Call** o **Visit**.
- [x] Cada factura debe solicitar estos campos: fecha de factura, folio o serie de factura —por ejemplo `IV`—, código o número de factura —por ejemplo `8,772`— e importe de la factura.
- [x] Incluir un botón **+ Agregar factura** para registrar todas las facturas que compongan la misma PO y permitir eliminar una línea antes de guardar.
- [x] Validar que cada línea tenga fecha, folio/serie, código/número e importe positivo antes de guardar.
- [x] Calcular automáticamente el total final de PO como la suma de los importes de todas las facturas capturadas; el usuario no escribirá directamente el total.
- [x] Tomar como fecha de PO la fecha más reciente entre las facturas registradas.
- [x] Permitir consultar en View/Details el desglose completo de facturas, además del total acumulado.
- [x] Conservar el desglose de facturas en la base de datos y en el historial de auditoría, identificando al usuario y la hora de captura.
- [x] Aplicar esta estructura tanto a Follow Up Quotations en USD como a Special Quotations en JPY, conservando la moneda correspondiente y sin conversiones.

### Comentario automático al convertir a PO

- [x] Cuando se seleccione PO, no exigir un comentario escrito manualmente.
- [x] Crear automáticamente una entrada de historial con un texto equivalente a: `Se registró PO con X facturas por un total de [moneda] X. Fecha de PO: X`, usando el número de facturas, la suma calculada y la fecha de la factura más reciente.
- [x] El comentario automático debe ser inmutable y convivir con los comentarios anteriores de seguimiento.
- [x] Si posteriormente se agregan o corrigen facturas, registrar un nuevo evento descriptivo sin reescribir el historial anterior.

### Listas y resumen financiero

- [x] En las listas de PO, mostrar el total final de PO como columna visible sin necesidad de abrir View/Details.
- [x] Colocar los cuadros grandes **Total de cotizaciones pendientes** y **Total de PO** uno junto al otro para facilitar la comparación.
- [x] Mantener claramente diferenciados el total originalmente cotizado y el total final obtenido mediante la suma de facturas.

### Corrección de “PO de hoy”

- [x] El contador **PO de hoy** debe aumentar cuando el usuario cambie y guarde una cotización como PO durante el día actual.
- [x] El contador debe basarse en la fecha y hora del evento de conversión a PO (`status_changed_at`/auditoría), no en la fecha de la factura ni en la fecha calculada de PO.
- [x] Una PO registrada hoy con facturas de días anteriores debe contar en **PO de hoy**.
- [x] Una cotización que ya era PO no debe volver a contarse como una nueva PO de hoy únicamente por consultar sus datos; si se modifica su desglose, debe registrarse como actualización, no como otra conversión.
- [x] Añadir pruebas automatizadas para conversión de una y varias facturas, suma total, fecha más reciente, comentario automático y contador PO de hoy.

### Condición antes del despliegue en la nube

- [x] No realizar el cambio definitivo a Railway hasta completar estos cambios, migrar las PO existentes al nuevo formato y aprobar las pruebas locales.
- [x] Preparar una migración que convierta cada PO histórica con total y fecha en una factura heredada, conservando el importe, la fecha, los comentarios y la auditoría existentes.
- [x] Generar y verificar un respaldo de la base antes de ejecutar la migración de PO.

## Cambios implementados

Los requisitos de las etapas anteriores se encuentran implementados y verificados.

## Datos e importación

- [x] Follow Up Quotations usa carga manual de Excel, columnas A-K, total principal de E en USD y total neto K como dato interno.
- [x] End User / Final Customer se muestra en listas y detalles y forma parte de la búsqueda.
- [x] La importación tiene vista previa con filas nuevas, actualizadas, duplicadas, excluidas e inválidas.
- [x] Se archiva cada Excel confirmado con fecha, usuario, espacio y resultado.
- [x] La clave estable de Quotations es serie + folio.
- [x] Un OP sin fecha permanece Pending y aparece en PO Date Missing; la PO terminada requiere fecha y total final.
- [x] Los registros PDF coincidentes se consolidan con el registro Excel conservando historial; los no coincidentes pasan a Historical en modo de solo lectura.

## Special Quotations

- [x] El espacio Special usa JPY sin conversión y lee fecha B, compañía E, Rank F, código G, modelo H, cantidad I, precio unitario J y agente AA.
- [x] La prioridad relativa usa S para el 10 % superior, A para 11-30 %, B para 31-60 % y C para el resto.
- [x] Se puede filtrar por Rank, agente, prioridad, fecha, referencia e importe.
- [x] Los modelos únicos se conservan aunque su cantidad no sea 1.
- [x] En modelos repetidos se conservan las filas con cantidad 1 de fechas distintas; para la misma fecha queda visible la de mayor precio unitario.
- [x] Las filas excluidas permanecen accesibles en Archive y pueden restaurarse con autorización.
- [x] Las cargas diarias de Special Quotations son incrementales: la cotización de columna A identifica el registro, las filas sin cambios quedan intactas, los cambios actualizan el mismo registro conservando su seguimiento y los duplicados heredados se consolidan automáticamente sin borrar su historial.

## Seguimiento

- [x] Manage registra una revisión solo cuando se guarda y exige método E-Mail, Call o Visit.
- [x] Lost exige uno de los motivos definidos y lo muestra en listas, detalles e informes.
- [x] Pending, PO, Safe y Lost tienen sus vistas correspondientes.
- [x] PO solicita total final y fecha para completar la conversión.
- [x] Los comentarios son entradas inmutables, cronológicas, con usuario y fecha.
- [x] View permite consultar todos los detalles y el historial sin editar.
- [x] Las cotizaciones pendientes sin revisión por más de 15 días generan alerta y contador en Dashboard; Safe queda excluida de esa alerta.
- [x] El total monetario pendiente se muestra de forma destacada en todas las vistas relevantes.

## Dashboard e informes

- [x] Priority Distribution destaca el total monetario sobre la cantidad de registros.
- [x] El Dashboard muestra total Pending, total cotizado convertido a PO, total final de PO y comparativos.
- [x] Se eliminó la caja de texto Daily Log y se conservó el botón de reporte diario.
- [x] Existen reportes diario, semanal, mensual y por rango personalizado.
- [x] Los informes incluyen nuevas, revisadas, cambios de estado, conversiones, pérdidas y motivos, totales Pending/QT/PO, fechas de PO y comparación QT contra PO.
- [x] Los reportes se generan en PDF y Excel, en español o inglés, separados por USD y JPY.
- [x] El alcance predeterminado es My activity; All team está restringido por rol.

## Usuarios, seguridad y auditoría

- [x] La aplicación exige usuario y contraseña y permite elegir idioma al entrar y cambiarlo después.
- [x] Se elige entre Follow Up Quotations y Follow Up Special Quotations después del acceso.
- [x] Se registran accesos, importaciones, cambios, comentarios, PO, reportes y acciones administrativas con usuario y hora.
- [x] El historial y la API de auditoría son privados y únicamente el Secretadmin puede consultarlos; Superadmin conserva la administración de usuarios sin acceso a esos datos.
- [x] Existe administración de usuarios, cambio de contraseña propia y restablecimiento autorizado de contraseñas olvidadas.
- [x] Los niveles de acceso se conservan internamente para proteger la administración, pero los roles se eliminaron de la pantalla y no se pueden asignar ni modificar desde Usuarios.
- [x] Los usuarios nuevos se crean como usuarios normales; el Superadmin puede generar o restablecer contraseñas temporales desde un control visible.
- [x] Usuarios iniciales: TAKUJI YAMADA y IGNACIO ILLESCAS como Superadmin, ELEONOR BARRAGAN como User y ARIEL CONTRERAS como Secretadmin.
- [x] Las contraseñas usan PBKDF2 con sal, hay bloqueo temporal tras cinco intentos y las sesiones expiran a las ocho horas.
- [x] Las operaciones mutables están protegidas con token CSRF.

## Respaldo y servidor

- [x] Se generan respaldos SQLite automáticos, se comprueban con integrity_check y se muestra su estado en Dashboard.
- [x] Se conservan 30 respaldos locales y se admite una segunda copia en una carpeta sincronizada con Dropbox mediante NT_QUOTE_BACKUP_DIR.
- [x] Se documentó el procedimiento de recuperación.
- [x] Se incluyeron scripts para iniciar en Windows Server, registrar una tarea automática, limitar el firewall a redes Domain/Private y crear un acceso directo público de Edge.
- [x] La base activa permanece en el disco local del servidor; Dropbox se usa para copias y archivos importados, no para la base SQLite en uso.
- [x] La aplicación está preparada para Railway con puerto dinámico, volumen persistente obligatorio, HTTPS/cookies seguras, IP de auditoría detrás del proxy, healthcheck, contenedor y exclusión de información privada del repositorio.

## Verificación

- [x] Validación de sintaxis de JavaScript y Python.
- [x] Once pruebas automatizadas aprobadas, incluidas validaciones de configuración segura para Railway.
- [x] Validación de lectura contra los dos libros de ejemplo.
- [x] Prueba HTTP completa de acceso, importación de ambos espacios, gestión y exportación PDF/Excel.
