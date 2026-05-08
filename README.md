# Friends of Brookside Park (Static Site + Admin Editing)

This project is a multipage static site powered by Decap CMS for non-technical content editing.

## Pages

- `index.html` (Home)
- `about.html`
- `history.html`
- `events.html`
- `resources.html`
- `get-involved.html`
- `page.html?slug=your-page-slug` (custom editor-created pages)

## Local Preview

1. Run a static server from project root:
   - `python3 -m http.server 4173`
2. Open:
   - `http://localhost:4173`

## Local Admin Testing

1. In a second terminal, start the Decap local backend proxy:
   - `npx decap-server`
2. Open admin:
   - `http://localhost:4173/admin/`
3. Edit and publish content in CMS UI.
4. Refresh website pages to confirm updates.

## What Editors Can Change (No Code Needed)

- Site settings (title, subtitle, CTA, footer, nav items)
- Home hero and headings
- About and History page text
- Events (date/time/location/summary/link)
- Initiatives and Resources
- Get Involved options
- Create and edit Custom Pages using block types:
  - Text sections
  - Cards sections
  - CTA sections
- Add custom pages to nav with `Show In Navigation` toggle

## Event Archiving Behavior

- Events automatically move into the Past Events Archive based on `endsAt`.
- If `endsAt` is empty, `startsAt` is used.
- No manual status toggle is needed.

## Backups and Undo

All edits are committed to Git through Decap CMS, which provides revision history and rollback capability via repository history.

## Netlify Notes

- Admin config uses `git-gateway` backend in `admin/config.yml`.
- For production editing with a small trusted group, enable:
  - Netlify Identity
  - Git Gateway
  - Invite only trusted editors
