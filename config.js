// ===== Zoom plugin configuration =====
// Zoom Web SDK join-in-browser (optional).
// If disabled, the Remote page will show just your Zoom link button.
window.ZOOM_SDK_ENABLED = false; // set to true to allow in-browser join

// Endpoint URL that returns a Zoom Meeting SDK signature.
// You must host this on your server or as a Cloud Function.
window.ZOOM_SIGNATURE_ENDPOINT = ""; // e.g., https://your-cloud-function/zoomSignature

// Zoom Web Meeting SDK Key (Client Key). Do NOT put the secret in the browser.
window.ZOOM_SDK_KEY = "";
