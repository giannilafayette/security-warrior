# Security Warrior

Professional security solutions website.

## Setup

1. Clone the repo
2. Copy `config.example.js` to `config.js`
3. Fill in your real credentials in `config.js`
4. Open `index.html` in a browser or deploy to GitHub Pages

## Security

### Never commit `config.js`

`config.js` is listed in `.gitignore` and must never be committed to version control.
It contains live API keys and credentials. Only `config.example.js` (with placeholder
values) belongs in the repo.

If you accidentally commit `config.js`:
1. Immediately rotate all exposed keys (Supabase, EmailJS, etc.)
2. Remove the file from git history: `git filter-branch` or use BFG Repo Cleaner
3. Force-push the cleaned history
4. Treat the old keys as fully compromised — do not reuse them

### Rotating keys

- **Supabase**: Dashboard → Settings → API → regenerate `anon` key
- **EmailJS**: Dashboard → Account → API Keys → create new key, delete old
- **Admin password**: Change directly in `config.js` and redeploy

### Supabase Row Level Security (RLS)

Run the following in the Supabase SQL editor (Dashboard → SQL Editor):

```sql
-- Enable RLS on the customers table
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- Allow anyone to submit a quote (INSERT only)
CREATE POLICY "Public can insert"
  ON customers
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Only authenticated users (admins) can read, update, or delete
CREATE POLICY "Authenticated users can select"
  ON customers
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can update"
  ON customers
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete"
  ON customers
  FOR DELETE
  TO authenticated
  USING (true);
```

**Why this matters:** Without RLS, anyone who finds your Supabase anon key can read,
edit, or delete all customer records. These policies ensure the anon key can only be
used to submit new records — not access existing ones.

### Moving to production

When ready to go fully production:

- **Netlify**: Move all `CONFIG` values to Netlify environment variables
  (Site Settings → Environment Variables) and use a build step to inject them.
  This removes the need for `config.js` entirely.
- **Supabase Auth**: Replace the admin password check with proper Supabase Auth
  so admin sessions are JWT-based and auditable.
