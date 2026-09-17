# NT Tool Quotation Follow-up

Internal web application for quotation follow-up. The application has two separate workspaces:

- **Follow Up Quotations**: daily Excel import, amounts and PO totals in USD.
- **Follow Up Special Quotations**: daily Excel import, amounts and PO totals in JPY without currency conversion.

## First local start

1. Double-click `iniciar.bat`.
2. Open `http://127.0.0.1:8765` if the browser does not open automatically.
3. The first screen asks for the initial Superadmin. Use either `takujiyamada` or `ignacioillescas` and create a password with at least 10 characters.
4. Use the Users page to set temporary passwords for the remaining initial accounts.

Initial usernames:

| Username | Display name | Role |
| --- | --- | --- |
| `takujiyamada` | TAKUJI YAMADA | Superadmin |
| `ignacioillescas` | IGNACIO ILLESCAS | Superadmin |
| `eleonorbarragan` | ELEONOR BARRAGAN | User |
| `arielcontreras` | ARIEL CONTRERAS | Secretadmin |

Passwords are stored as salted PBKDF2 hashes. Five unsuccessful attempts lock an account for 15 minutes. Sessions expire after eight hours.

## Daily Excel import

Every import has two steps: **Preview** and **Confirm import**. Preview reports new, updated, duplicated, excluded, and invalid rows. Confirming archives the original workbook under `data\imports` and updates the database without deleting follow-up history.

### Follow Up Quotations

The importer reads:

- A: quotation date
- B: series
- C: folio
- D: distributor legal name
- E: total with taxes, used as the primary USD amount and for SABC priority
- F: End User
- G: distributor agent
- I: customer order/OP
- J: NT Tool agent
- K: internal net total, visible in details and reports

An OP without a manually entered PO date remains Pending and appears in **PO Date Missing**. A completed PO requires both the final PO amount and PO date.

Legacy PDF records matching series + folio are consolidated into the Excel record. Unmatched PDF records remain in the read-only Historical view.

### Follow Up Special Quotations

The importer reads:

- A: source quotation number
- B: date
- E: company/End User
- F: Rank
- G: item code
- H: model
- I: quantity
- J: unit price in JPY
- AA: NT Tool agent

Priority uses unit price: S top 10%, A 11–30%, B 31–60%, C the remainder. For repeated models, different dates remain separate when quantity is 1. On the same date, the quantity-1 row with the highest unit price remains visible. Excluded rows are retained in the Archive and can be restored by an administrator.

Column A is the stable quotation identity for incremental imports. Uploading the daily workbook again leaves unchanged quotations exactly as they are, including their follow-up history. If source fields changed, the same quotation record is updated without resetting its status, comments, review history, PO amount, or PO date. Legacy rows created before column A was available are automatically matched by date, item code, and model; the duplicate is archived while its follow-up history is moved to the numbered quotation.

## Follow-up and reports

Manage requires E-mail, Call, or Visit. Lost requires one of the configured loss reasons. Comments are append-only and retain user and timestamp. Historical records are read-only.

Reports support current day, current week, current month, and custom date ranges. They can be exported to PDF or Excel in English or Spanish. My activity filters saved changes by the logged-in user. Administrators can also generate All team reports.

## User administration

The Users page does not expose roles. New accounts are created as regular users. A Superadmin can edit the user's name, agent assignment, activation state, and create or reset a temporary password with the **Generate temporary password** button. The user must replace a temporary password after signing in.

Audit data continues to record logins and application changes, but its API and visual history are private to the Secretadmin account. Superadmins can administer users without access to the audit history.

## Backups

The app creates a verified SQLite backup when the latest successful backup is more than 26 hours old. Local backups are stored in `data\backups`, with the 30 newest files retained. Set `NT_QUOTE_BACKUP_DIR` to an additional local Dropbox-synchronized folder to create a second copy.

The Dashboard shows the last backup result. Superadmin and Secretadmin can run a backup manually. Every backup is checked with SQLite `integrity_check` before it is marked successful.

To restore, stop the application, preserve the current database, copy a verified backup to `data\cotizaciones.db`, and start the application. Test this procedure periodically on a separate copy.

## Windows Server installation

1. Copy the application to a local server folder such as `C:\Apps\QuotationFollowUp`.
2. Run `iniciar.bat` once to install Python components and complete initial Superadmin setup.
3. Run `instalar_servidor.ps1` as Windows Administrator.

The installer registers a startup scheduled task, opens TCP port 8765 only for Domain and Private network profiles, starts the application without a browser, and creates a public desktop shortcut. Team members can use:

```text
http://SERVER-NAME:8765
```

Do not place the live SQLite database in Dropbox. Keep the database on the server's local disk and use Dropbox only for backup copies and archived source files.

## Railway cloud deployment

The application is cloud-ready for a single Railway service backed by one persistent volume. It reads Railway's `PORT`, stores all durable data under `RAILWAY_VOLUME_MOUNT_PATH` or `NT_QUOTE_DATA_DIR`, enables secure cookies and trusted proxy IP handling in Railway, and exposes `/health` for deployment checks. Railway startup is intentionally refused when no persistent volume is configured, preventing accidental use of an ephemeral database.

POs support one or more invoices in both workspaces. Each invoice stores its date, series/folio, invoice number and amount; the PO total is their sum and the PO date is the latest invoice date. Existing PO totals are migrated automatically to a single `LEGACY` invoice when the application starts. Always upload a verified database backup to Railway and keep the service at one replica.

See [DEPLOY_RAILWAY.md](DEPLOY_RAILWAY.md) for the complete setup, database migration, backup, and cutover procedure. Keep the service at one replica while SQLite is in use.
