# Minimum Requirements & Integration Guide: Digital Directory & AI Card Scanner

This document outlines the hardware, software, dependency, and environment requirements to run or integrate the standalone **Digital Business Card Directory & Multimodal AI Scanner** into any existing project or new repository.

---

## 1. System & Runtime Requirements

| Component | Minimum Requirement | Recommended | Notes |
| :--- | :--- | :--- | :--- |
| **Python** | Python 3.10+ | Python 3.11 or 3.12 | Uses type hints (`dict[str, Any]`, `tuple[...]`) |
| **Operating System** | Linux, macOS, or Windows | Linux (Ubuntu 22.04 LTS / Debian 12) | Fully compatible with cross-platform OS |
| **Memory (RAM)** | 512 MB RAM | 1 GB - 2 GB RAM | Minimal memory footprint (~60 MB idle) |
| **CPU** | 0.5 vCPU | 1+ vCPU | Image compression is offloaded to client browser |
| **Storage** | 100 MB free space | 1 GB+ | SQLite database or base64 storage |
| **Network** | Outbound HTTPS (Port 443) | Outbound HTTPS | Needed for AI API calls and Google Favicons |

---

## 2. Python Dependencies

Add these to your `requirements.txt`:

```text
# Core Excel Export
openpyxl>=3.1.2

# AI Vision SDKs (Choose based on your provider)
openai>=1.12.0          # If using OpenAI (gpt-4o, gpt-4o-mini)
google-genai>=1.0.0     # If using Google Gemini (gemini-2.0-flash, gemini-1.5-flash)
anthropic>=0.18.0       # If using Anthropic Claude (claude-3-5-sonnet)

# Optional Web Framework (If not using standard library http.server)
fastapi>=0.110.0
uvicorn>=0.28.0
# OR:
# flask>=3.0.0

# Optional Database Driver (If using PostgreSQL instead of SQLite)
psycopg2-binary>=2.9.9
```

> **Note:** The core directory code is lightweight and requires **zero external C-extensions**. Client-side image resizing keeps incoming request payloads under 200 KB per card.

---

## 3. Environment Variables Configuration

Create a `.env` file in the root directory (or configure them in your virtual environment / hosting provider settings such as Render, Heroku, or AWS):

```bash
# ==========================================
# 1. AI Vision Model Provider Credentials
# ==========================================
# Fill in AT LEAST ONE depending on the chosen model:
OPENAI_API_KEY="sk-proj-..."
GEMINI_API_KEY="AIzaSy..."
ANTHROPIC_API_KEY="sk-ant-..."

# Default AI Model override (optional, defaults to provider standard):
# AI_MODEL="gpt-4o"
# AI_MODEL="gemini-2.0-flash"

# ==========================================
# 2. Server Configuration
# ==========================================
PORT=8000
HOST="0.0.0.0"

# ==========================================
# 3. Database Connection (Optional)
# ==========================================
# Leave empty to use local SQLite (directorio.db)
# Or provide a PostgreSQL connection URL:
# DATABASE_URL="postgresql://user:password@host:5432/dbname"
```

---

## 4. Client-Side (Browser) Requirements

The frontend directory module is built with **Vanilla JavaScript (ES2020+)** and **Modern CSS3**. No heavy build tools (Webpack, Vite, npm) are required.

- **Supported Browsers:**
  - Google Chrome / Chromium >= 88
  - Mozilla Firefox >= 85
  - Apple Safari >= 14.1
  - Microsoft Edge >= 88
- **Browser APIs Used:**
  - Native `<dialog>` elements for modal dialogs and dossiers.
  - HTML5 Canvas `drawImage()` for client-side JPEG compression before upload.
  - Fetch API (`async/await`) with FormData / JSON payloads.
  - CSS Grid & Flexbox.

---

## 5. Network & Firewall Access

Ensure your deployment environment allows outbound HTTPS connections to:
1. **AI API Endpoints:**
   - OpenAI: `https://api.openai.com/v1/chat/completions`
   - Google Gemini: `https://generativelanguage.googleapis.com`
   - Anthropic: `https://api.anthropic.com/v1/messages`
2. **Company Logo / Favicon Proxy:**
   - `https://www.google.com/s2/favicons` (Safe public CDN proxy with automated fallback to initials).

---

## 6. Quick Start Guide (Testing Locally)

```bash
# 1. Create and activate a Python virtual environment
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# 2. Install minimal dependencies
pip install openpyxl google-genai openai

# 3. Set your API Key in your environment or .env
export GEMINI_API_KEY="your-api-key-here"
# On Windows PowerShell:
# $env:GEMINI_API_KEY="your-api-key-here"

# 4. Start your application
python app.py
```
