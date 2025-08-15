export default {
  async fetch(request, env, ctx) {
    // CORS
    const origin = request.headers.get("Origin") || "";
    const allowedOrigin = env.CORS_ALLOW_ORIGIN || origin;
    const corsHeaders = {
      "Access-Control-Allow-Origin": allowedOrigin,
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    };
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }
    if (request.method !== "POST") {
      return new Response(JSON.stringify({ error: "POST only" }), { status: 405, headers: { "Content-Type": "application/json", ...corsHeaders } });
    }

    // 1) Verify Firebase ID token from Authorization header
    const authz = request.headers.get("Authorization") || "";
    const token = authz.startsWith("Bearer ") ? authz.slice(7) : null;
    if (!token) {
      return new Response(JSON.stringify({ error: "Missing Firebase ID token" }), { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } });
    }
    // Verify token via Firebase Identity Toolkit
    const verifyUrl = "https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=" + encodeURIComponent(env.FIREBASE_WEB_API_KEY);
    const verifyResp = await fetch(verifyUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken: token })
    });
    if (!verifyResp.ok) {
      const t = await verifyResp.text();
      return new Response(JSON.stringify({ error: "Firebase verification failed", details: t }), { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } });
    }
    const verifyData = await verifyResp.json();
    const user = verifyData.users && verifyData.users[0];
    if (!user || !user.email) {
      return new Response(JSON.stringify({ error: "No email in Firebase token" }), { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } });
    }
    const email = user.email;

    // 2) Get Zoom Server-to-Server OAuth access token
    // https://zoom.us/oauth/token?grant_type=account_credentials&account_id=...  (Basic auth with client_id:client_secret)
    const tokenUrl = "https://zoom.us/oauth/token?grant_type=account_credentials&account_id=" + encodeURIComponent(env.ZOOM_ACCOUNT_ID);
    const basic = btoa(env.ZOOM_CLIENT_ID + ":" + env.ZOOM_CLIENT_SECRET);
    const zoomTokenResp = await fetch(tokenUrl, {
      method: "POST",
      headers: { "Authorization": "Basic " + basic }
    });
    if (!zoomTokenResp.ok) {
      const t = await zoomTokenResp.text();
      return new Response(JSON.stringify({ error: "Zoom token error", details: t }), { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } });
    }
    const zoomToken = await zoomTokenResp.json();
    const accessToken = zoomToken.access_token;

    // 3) Create an instant meeting (or you can schedule)
    const createMeetingResp = await fetch("https://api.zoom.us/v2/users/me/meetings", {
      method: "POST",
      headers: { "Authorization": "Bearer " + accessToken, "Content-Type": "application/json" },
      body: JSON.stringify({
        type: 1, // instant
        topic: "DHS Automation Remote Session",
        settings: {
          approval_type: 1, // require registration (each registrant gets unique link)
          registration_type: 1,
          waiting_room: false,
          join_before_host: true,
          participant_video: true,
          host_video: true
        }
      })
    });
    if (!createMeetingResp.ok) {
      const t = await createMeetingResp.text();
      return new Response(JSON.stringify({ error: "Zoom create meeting error", details: t }), { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } });
    }
    const meeting = await createMeetingResp.json();

    // 4) Add the signed-in user as a registrant to get a unique join_url
    const regResp = await fetch(`https://api.zoom.us/v2/meetings/${meeting.id}/registrants`, {
      method: "POST",
      headers: { "Authorization": "Bearer " + accessToken, "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        first_name: email.split("@")[0],
        last_name: "",
        auto_approve: true
      })
    });
    if (!regResp.ok) {
      const t = await regResp.text();
      return new Response(JSON.stringify({ error: "Zoom registrant error", details: t }), { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } });
    }
    const reg = await regResp.json();

    // 5) Return individualized info
    return new Response(JSON.stringify({
      join_url: reg.join_url,
      meeting_id: meeting.id,
      passcode: meeting.password || null
    }), { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } });
  }
};
