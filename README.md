# DHS Automation – Image/Logo Fixes

This package:
- Makes the header logo bigger and visible on the dark header.
- Uses your actual gallery filenames: `plc-panel-1.jpg` and `plc-panel-2.jpg`.
- Adds `object-fit: cover` to ensure images fill their boxes cleanly.
- Adds a small cache-buster (`?v=2`) to defeat old CDN cache.

## How to deploy
1. Upload `index.html` to your repo **root** (replace existing file).
2. Ensure these files exist exactly:
   - `site-assets/dhs-logo.png`
   - `site-assets/plc-panel-1.jpg`
   - `site-assets/plc-panel-2.jpg`
3. Commit to `main` and hard refresh your site.
