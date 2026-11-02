# Production Prompt for OpenAI Codex / AI Assistant: Digital Business Card Directory & Multimodal AI Scanner

> **Instructions for the AI Assistant / Codex:**
> Before scaffolding or generating any code, first present the developer with the **Initial Setup Questionnaire** in Section 1. Once the developer provides their preferred AI provider, model, and framework choices, implement the complete standalone **Digital Business Card Directory & AI Scanner** according to the technical specifications in Section 2.

---

## 1. Initial Interactive Questionnaire (Ask the Developer First)

```text
Hello! Before we build and integrate your Digital Business Card Directory & AI Scanner, please answer the following setup questions:

1. Which AI Vision Provider and Model do you want to use for scanning business cards?
   - [Option A] OpenAI: `gpt-4o` (recommended for highest precision) or `gpt-4o-mini` (faster & cost-effective)
   - [Option B] Google Gemini: `gemini-2.0-flash` (recommended for speed) or `gemini-1.5-flash`
   - [Option C] Anthropic Claude: `claude-3-5-sonnet-20241022`
   - [Option D] Multi-provider failover (OpenAI primary with Gemini / Claude automatic fallback)

2. Which backend framework and database do you prefer?
   - Framework: Python FastAPI, Flask, or lightweight HTTP server
   - Database: SQLite (local file) or PostgreSQL (Render, Neon, Supabase)

3. API Key & Environment Setup:
   Please make sure your API key is defined in your project root `.env` file or virtual environment (`.venv`):
   - For OpenAI: OPENAI_API_KEY="sk-..."
   - For Google Gemini: GEMINI_API_KEY="..."
   - For Anthropic: ANTHROPIC_API_KEY="sk-ant-..."
   (Optionally set AI_MODEL="your-model-name")

Please reply with your selections so we can proceed with code generation!
```

---

## 2. Technical System Specifications

### A. Database Schema
Create tables for contacts and normalized catalogs:

1. **`directory_contacts` Table:**
   - `id`: integer primary key autoincrement.
   - `full_name`: string (required).
   - `job_title`: string.
   - `company_name`: string.
   - `company_id`: foreign key to `directory_companies` (nullable).
   - `phone_1`: primary phone (mobile / WhatsApp).
   - `phone_2`: secondary phone (office / landline with extension).
   - `email`: email address.
   - `website`: website URL (always enforce `https://` prefix to avoid relative URL routing issues).
   - `location_type`: string enum `('National', 'International')` with explicit user toggle.
   - `location_text`: raw location string (city, state, country).
   - `location_id`: foreign key to `directory_locations` (nullable).
   - `physical_address`: street, neighborhood, postal code.
   - `notes`: extra observations, specialty, services.
   - `card_photo_front`: base64 string or stored URL of front card photo.
   - `card_photo_back`: base64 string or stored URL of reverse/back card photo.
   - `source`: `'ai_scan'`, `'manual'`, or `'batch'`.
   - `created_at`, `updated_at`: ISO 8601 timestamps.

2. **`directory_companies` Catalog:**
   - `id`: integer primary key.
   - `name`: string unique (canonical corporate name).
   - `created_at`: timestamp.

3. **`directory_locations` Catalog:**
   - `id`: integer primary key.
   - `type`: `('National', 'International')`.
   - `country`: string.
   - `state`: string.
   - `created_at`: timestamp.

---

### B. Multimodal AI Card Scanner (Front + Back Support in 1 Call)
1. **Single Multimodal API Request:**
   - Accepts both `front_image` and optional `back_image` in base64.
   - Client compresses images to max 1200–1600px JPEG before upload to reduce payload to ~100–150 KB.
   - Sends **both** front and back images in a single multimodal request payload to the AI provider. This avoids making 2 separate API calls, drastically cutting token cost and latency.
   - Extraction prompt:
     ```text
     You are an expert executive business card digitizer.
     Examine the provided card image(s) (Front and optional Back) and consolidate all contact information into a single clean JSON object with keys:
     "full_name", "job_title", "company", "phone_1", "phone_2", "email", "website", "address", "notes".
     Do not invent information. If a field is missing, return an empty string. Output valid JSON only.
     ```
2. **Resilience & Zero-500 Failover:**
   - Implement a per-request network timeout (e.g. 20s).
   - If the AI request times out or errors, return `{ "ok": false, "extracted": {}, "message": "..." }` with HTTP 200 so the frontend opens the manual form pre-filled with the photos instead of throwing an unhandled 500 error.

---

### C. Bulk Batch Processing with Auto-Pairing
1. User can drag-and-drop or select multiple card photos (e.g., 20, 50, 200 photos).
2. **Smart Pair Detection:**
   - If exactly **2 photos** are uploaded, automatically assign Photo 1 to **Front** and Photo 2 to **Back** in a side-by-side preview grid with buttons to change either side.
   - If **3+ photos** are uploaded, display batch queue with thumbnail grid and a toggle:
     `[✓] Photos are in pairs (Front + Back alternate)`
   - When checked: loops with step `i += 2`, bundling `photo[i]` and `photo[i+1]` into 1 API call per contact, saving both photos per card.
   - Progress bar with percentage and real-time status label (`Processing card 5 of 25 (Front + Back)...`).
   - Rate limit pacing: 1.8s delay between card iterations to respect API rate limits.

---

### D. Corporate Entity Normalization & Auto-Pruning
1. **Company Name Normalizer:**
   - Strips legal forms and noise words: `S.A. DE C.V.`, `SA DE CV`, `S.A.P.I. DE C.V.`, `INC.`, `LLC`, `LTD.`, `CORP.`, `GMBH`, etc.
   - Normalizes diacritics and matches variations (e.g., `"NT TOOL DE MEXICO S.A. DE C.V."` and `"NT Tool"` map to the same canonical company).
2. **Auto-Prune Orphaned Catalogs:**
   - Whenever contacts are deleted or edited, automatically delete any company or location that no longer has any linked contacts. Filter dropdowns will only show companies and locations that actually exist.
3. **One-Click Unification:**
   - Endpoint/button to scan all records, group similar company variations, unify all contacts to the cleanest title-cased canonical name, and remove duplicates.

---

### E. Frontend UI & UX (Vanilla JS / Modern CSS)
1. **Toolbar & Live Filters:**
   - Search bar with live debounce query (matches name, company, title, email, phone, location).
   - Company filter dropdown (populated with active companies only).
   - Coverage filter dropdown (`All`, `National`, `International`).
   - **Dependent Regional Filter:** When `National` is selected, an adjacent dropdown appears: `[ 📍 All States / Cities (National) ]` populated with registered states/cities.
   - Quick action buttons: `[ 🗂️ Grid View ]`, `[ 📋 Table View ]`, `[ 📊 Export Excel ]`, `[ 📸 Scan Card (AI) ]`, `[ ➕ New Contact ]`.
2. **Corporate Logos with Favicon Proxy:**
   - Detects domain from `website` or non-generic corporate `email` (`@company.com`).
   - Renders the company's official logo via `https://www.google.com/s2/favicons?domain=${domain}&sz=128`.
   - Clean `onerror` fallback that gracefully reverts to an initials badge with a modern color gradient.
3. **Read-Only Contact Dossier Modal:**
   - Clicking on a contact's name opens a centered, read-only dossier modal dialog (no editable input fields).
   - Displays company logo, full name, title, badges, direct click-to-call link, WhatsApp link, mailto link, website link, full address, notes, and interactive front & back card photo thumbnails (click to enlarge).
   - Action buttons: `[ ✏️ Edit Contact ]`, `[ 📇 Download vCard ]`, `[ Close ]`.
4. **Custom Centered In-App Confirmation Modal:**
   - Replaces native browser `window.confirm()` with an in-page modal dialog centered on screen with backdrop blur, alert icon `⚠️`, custom message, and styled buttons (`[ Cancel ]` and `[ 🗑️ Yes, Delete ]`).
5. **Exports:**
   - **Single-contact vCard (.vcf):** Generates RFC-compliant vCard 3.0 file containing FN, N, ORG, TITLE, TEL, EMAIL, URL, ADR, and NOTE.
   - **Full Database Excel (.xlsx):** Generates styled `.xlsx` with dark navy headers, thin borders, auto-adjusted column widths, and complete contact data.
