# DHS Automation – RustDesk (Public Servers) Integration

This build adjusts your **Remote Work** page for **public RustDesk servers**:

## Flow
- **Customers**: Download portable RustDesk from the official site, run it, send you their **ID** & **Password**.
- **Admins (you)**: Use the **RustDesk desktop app** to connect. Public servers do not provide a web client.

## What you need to do
1. Put `index.html` at your repo **root**.
2. Ensure images exist at:
   - `site-assets/plc-panel-1.png`
   - `site-assets/plc-panel-2.png`
3. (Optional) If you use your Worker `/whoami` for roles, set this in `index.html`:
   ```js
   const WORKER_BASE = "https://YOUR_WORKER_SUBDOMAIN.workers.dev";
   ```
4. In Firebase Auth → Settings → **Authorized domains**: add `dunclin.github.io`.

## Later: self-hosted RustDesk
If you self-host `rustdesk-server` and enable its **web** component, we can add an **admin web control** button that opens your web client instead of the desktop app.

## Notes
- The download buttons link to the official RustDesk website so users grab the correct portable build for Windows/macOS.
- For unattended access with customers you trust, ask them to **Install** RustDesk and set a **permanent password** (not just the one-time code).
