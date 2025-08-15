# DHS Automation — Full Restore (Styling + Remote Work + White Logo)

This build restores your complete site features:

- Sticky header with **logo only** (no text), larger, on a **white background chip** for visibility.
- Hero and gallery styling restored.
- Gallery images use your real files: `site-assets/plc-panel-1.jpg` and `site-assets/plc-panel-2.jpg`.
- Remote Work page (RustDesk public servers) with **Send to Technician** email button.
- Firebase auth modal (email/password).

## Deploy
1. Upload `index.html` to the repo **root** (replace existing).
2. Ensure these exist:
   - `site-assets/dhs-logo.png`  (your logo image)
   - `site-assets/plc-panel-1.jpg`
   - `site-assets/plc-panel-2.jpg`
3. Commit to `main` and hard refresh your site (Ctrl/Cmd+Shift+R).

If you use a Worker for roles (`/whoami`), set `WORKER_BASE` inside the `<script>` to your Worker domain.
