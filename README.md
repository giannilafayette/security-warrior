# Security Warrior

Professional security services website and internal CRM system for a Jamaican security company. Handles public-facing marketing, customer quote intake, and backend management of customers, jobs, and technicians.

**Live site:** https://giannilafayette.github.io/security-warrior/
**Admin portal:** https://giannilafayette.github.io/security-warrior/admin.html

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Plain HTML, CSS, JavaScript — no framework |
| Backend / Database | Supabase (PostgreSQL + Auth) |
| Hosting | GitHub Pages |
| Version Control | Git (GitHub) |

No build process, no bundler, no server. Every page is a self-contained `.html` file with embedded CSS and JavaScript.

---

## Hosting & Deployment

Hosted on **GitHub Pages**. Two branches:

- **`development`** — the live branch. Every push deploys publicly within ~1 minute.
- **`main`** — production/stable. Nothing goes here unless explicitly requested.

The Supabase config (URL + anon key) is inlined directly in each HTML file since GitHub Pages serves static files only — there is no server to inject environment variables.

---

## Pages

### `index.html` — Landing Page
Public-facing marketing site. Sections: Hero, Services, About, How It Works, Testimonials, Contact.

Contact form features:
- Live blur validation on all fields with inline error messages
- Character counter on message field (max 500 chars)
- 3-layer anti-spam: CSS honeypot field, 4-second time-on-page check, 5-minute localStorage rate limit

### `quote.html` — Quote Request Form
Customers fill this out to request a service quote.

Fields: first name, last name, email, phone, property address, town/city, parish (required — all 14 Jamaican parishes), services needed (dynamic multi-select rows), gate service sub-options, job description, file upload (optional).

On submit, writes a record to the `quote_requests` Supabase table with `status: 'new'`.

### `admin.html` — CRM Admin Portal
Password-protected internal tool for staff. Login security:
- Supabase Auth (email + password)
- 3-hour session timeout stored in localStorage
- 5-attempt login lockout — locks for 30 minutes after 5 consecutive failures
- Password reveal toggle on login screen

**Four tabs:**

| Tab | Description |
|---|---|
| Customers | Full customer list with search, parish filter, status filter, warranty filter. Stat cards (Total, Active, Warranty, No Warranty) are clickable filters. Add/edit customers with all fields including town/city and parish. Customer status: Active, Pending, Inactive. |
| Jobs / Schedule | Job assignments linking customers to technicians. Filterable by status and technician. |
| Technicians | Technician records with contact info, region, and availability status. |
| Requests | Incoming quote submissions from the website. Red notification badge shows count of unreviewed requests. Click any row to open a detail modal with all submitted info and action buttons: Mark Reviewed, Convert to Customer, Reject. |

### `terms.html` — Terms & Conditions
Static page with the company's full Terms & Conditions (22 sections, governed by Jamaican law).

---

## Database (Supabase)

### Tables

**`customers`**
`id, first_name, last_name, company_name, contact_person, client_type, phone, phone2, email, address, town, parish, account_no, services (text[]), warranty, status, description, created_at`

**`jobs`**
`id, customer_id, technician_id, service, scheduled_date, status, notes, created_at`

**`technicians`**
`id, name, phone, email, region, status, created_at`

**`quote_requests`**
`id, first_name, last_name, email, phone, address, town, parish, services (text[]), gate_types (text[]), description, status, submitted_at`

### Row Level Security (RLS)

All tables have RLS enabled. Run this in the Supabase SQL Editor to set up policies:

```sql
-- CUSTOMERS
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth can manage" ON customers FOR ALL TO authenticated USING (true);

-- JOBS
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth can manage" ON jobs FOR ALL TO authenticated USING (true);

-- TECHNICIANS
ALTER TABLE technicians ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth can manage" ON technicians FOR ALL TO authenticated USING (true);

-- QUOTE REQUESTS
ALTER TABLE quote_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anon can insert" ON quote_requests FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Auth can manage" ON quote_requests FOR ALL TO authenticated USING (true);
```

> **Why this matters:** Without RLS, anyone who finds your Supabase anon key can read, edit, or delete all records. The anon key is intentionally public (embedded in the HTML) — RLS is what keeps the data safe.

---

## Project Structure

```
Security Warrior/
├── index.html          ← Public landing page
├── quote.html          ← Customer quote request form
├── admin.html          ← Staff CRM portal
├── terms.html          ← Terms & Conditions
├── config.js           ← Supabase keys (gitignored — never commit)
├── config.example.js   ← Placeholder showing config structure
└── .gitignore          ← Excludes config.js, .env, node_modules
```

---

## Local Setup

1. Clone the repo
2. Copy `config.example.js` to `config.js`
3. Fill in your Supabase URL and anon key in `config.js`
4. Open any `.html` file directly in a browser — no server needed

> `config.js` is gitignored. The real keys are inlined directly in the HTML files for the live GitHub Pages deployment.

---

## Keep-alive (preventing inactivity pause)

Supabase free-tier projects pause after 7 days with no database activity. A GitHub Actions workflow runs daily at 12:00 UTC and issues a lightweight `SELECT` against a `keepalive` table to reset the inactivity timer.

**Files:**
- `.github/workflows/keepalive.yml` — the scheduled workflow
- `supabase/keepalive.sql` — creates and secures the `keepalive` table

### One-time setup (two manual steps)

**Step 1 — Create the table in Supabase.**
Open the Supabase SQL Editor for project `saewxgsplkjkbhestvhu` and run the contents of `supabase/keepalive.sql`. This creates a single-row `keepalive` table with RLS enabled and an anon-read policy so the workflow can query it without authentication.

**Step 2 — Add two GitHub repository secrets.**
Go to the repository on GitHub → **Settings → Secrets and variables → Actions → New repository secret** and add:

| Secret name | Value |
|---|---|
| `SUPABASE_URL` | `https://saewxgsplkjkbhestvhu.supabase.co` |
| `SUPABASE_ANON_KEY` | Your project's anon/public key — found in Supabase Dashboard → **Project Settings → API** |

The anon key is never hardcoded in any committed file; the workflow reads it exclusively from GitHub Actions secrets.

### Testing

After both steps are complete, go to **Actions → Supabase Keep-Alive → Run workflow** and trigger a manual run. A green checkmark confirms the ping reached the database. The workflow also runs automatically every day at 12:00 UTC.

---

## Security Notes

### config.js is gitignored
`config.js` must never be committed. Only `config.example.js` (with placeholder values) belongs in the repo. The live site has the Supabase anon key inlined in each HTML file — this is safe because the anon key is a public publishable key, and RLS policies protect the actual data.

### If credentials are ever exposed
1. Immediately rotate the Supabase anon key: Dashboard → Settings → API → regenerate
2. Remove from git history using `git filter-branch` or BFG Repo Cleaner
3. Force-push the cleaned history to all branches
4. Treat the old key as fully compromised — do not reuse it

### Admin accounts
Admin user accounts are managed in Supabase: Dashboard → Authentication → Users. To add a new staff member, invite them from there. To reset a password, use the three-dot menu next to their account → Send password reset email.
