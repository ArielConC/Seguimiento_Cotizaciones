# Directory Migration Package (Directorio Digital e IA)

Este paquete contiene la documentación, el prompt estructurado para agentes de IA (como OpenAI Codex, ChatGPT o Claude) y los requerimientos mínimos del sistema para migrar o implementar de forma independiente el **Directorio Digital con Escáner de Tarjetas por IA**.

---

## Contenido de la Carpeta

1. **[`PROMPT_CODEX.md`](./PROMPT_CODEX.md):**
   - Prompt completo en inglés diseñado para Codex o cualquier asistente de IA.
   - Incluye el cuestionario inicial interactivo (pregunta qué IA utilizará: OpenAI, Gemini, Claude, o Multi-proveedor, y dónde colocar la API Key en `.env` o `.venv`).
   - Especificaciones completas de arquitectura: Base de datos, escáner multimodal frente y reverso en una sola llamada de API, procesamiento por lotes, normalización de empresas y ubicaciones, depuración automática de huérfanos, logos por favicon, modal de ficha en solo lectura, modal de confirmación en pantalla y exportaciones a vCard y Excel.

2. **[`MINIMUM_REQUIREMENTS.md`](./MINIMUM_REQUIREMENTS.md):**
   - Requerimientos mínimos de sistema operativo, hardware, versiones de Python (3.10+).
   - Dependencias de Python necesarias (`openpyxl`, SDKs de OpenAI / Gemini / Anthropic).
   - Variables de entorno (`.env`) requeridas.
   - Requerimientos del navegador y de red (puerto 443 HTTPS).
   - Guía de inicio rápido para ejecutar en local o servidor.

---

## Cómo usarlo con tu jefe o equipo de desarrollo

1. **Si van a usar Codex o un Asistente de IA:**
   - Copia todo el contenido de [`PROMPT_CODEX.md`](./PROMPT_CODEX.md) y pégalo como primer prompt en el editor / chat de Codex.
   - El modelo responderá primero con las 3 preguntas de configuración antes de escribir código.
2. **Si van a configurar el entorno de ejecución:**
   - Consulta [`MINIMUM_REQUIREMENTS.md`](./MINIMUM_REQUIREMENTS.md) para instalar los paquetes necesarios y configurar las variables de entorno.
