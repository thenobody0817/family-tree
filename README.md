# Family Tree Research

A self-hosted family-tree / genealogy tool with an interactive canvas, person directory,
relationship lookup, timeline, research overview, and local or MariaDB storage.

## Live demo

Static demo (no backend — runs entirely in the browser):
**https://thenobody0817.github.io/family-tree/**

Open it, then click **Explore sample** to populate it.


- `public/index.html` — core frontend and existing editor (vanilla JS, no build step)
- `public/workspace.js` and `public/workspace.css` — workspace navigation and visual design
- `public/gedcom.js` — GEDCOM 5.5.1 core import/export
- `public/api.php` — small REST API (PHP 8 + PDO)
- `db/schema.sql` — MariaDB 10.6+ schema + helper views

## Two modes (same code, one switch)

| Mode | Backend | Use for |
|------|---------|---------|
| **Server** | `api.php` + MariaDB | local dev, your web host, shared/synced data |
| **Local** | none (browser storage) | offline use, and the static **GitHub Pages demo** |

Switch in the app: **Settings → API Settings → Storage Mode**. **JSON export/import**
moves data between the two modes.

## Workspace

- **Tree:** drag people, drag the empty canvas to pan, scroll to zoom, fit the tree,
  and arrange people automatically. Manual positions can be adjusted afterward.
- **People:** browse everyone, including unplaced and incomplete records.
- **Timeline:** birth, death, and partnership events from the existing fields.
- **Research:** counts of missing dates and places, plus records to complete.
- **Inspector:** click a person for details, immediate relatives, editing, and
  relationship lookup against another person.
- **Settings:** storage mode, card density and field options, four appearance
  themes, and interchange. Detailed cards show whichever fields are enabled.
- **Demo portraits:** the bundled fictional family uses generated mock portraits.
  Other records retain initials; the portraits do not represent historical people.
- **Export:** JSON, GEDCOM, SVG, PNG, and PDF. JSON remains the lossless native
  format; SVG exports vector cards and lines. GEDCOM supports names, sex,
  birth/death, occupation, notes, spouses, parent/child links, marriages,
  divorce, and their dates/places. Other GEDCOM tags are skipped.

Local mode keeps a bounded in-session undo/redo history. Server mode disables
undo because the current API has no revision checks; a historical snapshot
could otherwise overwrite changes made directly in MariaDB or another browser.
The arrange action writes new positions in either mode. Keep a JSON backup
before bulk edits in server mode.

Keyboard: **F** search, **A** add person, **E** edit selection, **0** fit tree,
**Ctrl/Cmd+Z** undo and **Ctrl/Cmd+Shift+Z** redo in Local mode.

Relationship lines open their details when clicked. The previous floating date
boxes were removed to keep the tree readable; dates remain in the editor.

## Run locally

### Option A — full stack (PHP + MariaDB) with Docker

```bash
sudo docker compose up -d --build
# open http://localhost:8080
```

The schema in `db/schema.sql` is imported automatically on first start, and the
demo family (`db/seed.sql`) is loaded on a fresh volume too.
DB credentials are in `docker-compose.yml` (dev only).

To reset the database: `sudo docker compose down -v && sudo docker compose up -d`.

### Demo / seed data

A fictional 5-generation Latvian family (22 people, 7 couples, 13 parent-child
links, including a divorce, a widowed spouse and a solo parent) is included.

- **SQL route:** `./scripts/seed.sh` (or `sudo ./scripts/seed.sh`) loads
  `db/seed.sql` into the running container.
- **JSON route:** in the app, `Export/Import → Import → seed/family-tree-demo.json`
  (works in Server *and* Local mode).
- **Regenerate:** `python3 scripts/gen-seed.py` rewrites both files.
- The unassigned person (Voldemārs Bērziņš) has no canvas position, so he shows
  up in the sidebar's "Unassigned" panel.

### Option B — frontend only, no backend

Open the app, choose **Local** storage mode, and it works with zero setup:

```bash
cd public && python3 -m http.server 8080
# open http://localhost:8080 → Settings → API Settings → Storage Mode: Local
```

(Opening `public/index.html` directly also works in most browsers.)

## Deploy to your web host (MariaDB)

1. Create the DB and run `db/schema.sql` (phpMyAdmin → SQL, or
   `mysql -u user -p dbname < db/schema.sql`).
2. Upload `public/index.html` and `public/api.php` to the same folder.
3. Upload `public/workspace.js`, `public/workspace.css`, and `public/gedcom.js`
   alongside `index.html`; then create `public/config.php` from `config.sample.php` and fill in the DB
   credentials. **Do not commit it** (it is git-ignored).
4. If you set `api_key`, enter the same key in the app's API Settings.

`api.php` reads credentials from `config.php` first, then environment
variables (`FT_DB_HOST`, `FT_DB_NAME`, `FT_DB_USER`, `FT_DB_PASS`,
`FT_API_KEY`, `FT_ALLOW_ORIGIN`).

## GitHub Pages demo

Because Local mode needs no server, you can publish the demo statically:
put `index.html` on GitHub Pages, open it, and set Storage Mode to **Local**.
No database, no PHP.

This repo deploys Pages from the **`gh-pages` branch** (the `public/` folder),
so no Actions workflow is required. To update the deployed demo:

```bash
git subtree split --prefix public -b gh-pages
git push -f origin gh-pages
git branch -D gh-pages
```

## Editing from the database side

The frontend polls every few seconds, so changes made directly in MariaDB
(phpMyAdmin, SQL, imports) appear automatically. Each person/relationship can
equally be edited from the UI.

## JSON format

```json
{
  "format": "family-tree",
  "version": 1,
  "exported_at": "2026-…",
  "persons": [ { "id": "…", "first_name": "…", "canvas_x": 100, "canvas_y": 200 } ],
  "couples": [ { "person1_id": "…", "person2_id": "…", "rel_type": "married" } ],
  "parent_child": [ { "parent_id": "…", "child_id": "…", "couple_id": "…" } ]
}
```

Import **replaces** all current data, so exporting a backup first is wise.

## Security notes

- Never commit `config.php` or `_source/` (both git-ignored). They contain
  real credentials.
- **Rotate the database password that was previously hard-coded in `api.php`**,
  since it may have been shared or committed.
- `allow_origin` defaults to `*`; set it to your exact site origin in
  production, and set `api_key` if the API is public.
