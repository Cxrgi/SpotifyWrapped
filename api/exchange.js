export default async function handler(req, res) {
  // --- CORS FIX ---
  res.setHeader("Access-Control-Allow-Origin", "https://cxrgi.github.io");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { code, refresh_token, redirect_uri, code_verifier } = req.body;
  const params = new URLSearchParams();
  
  if (refresh_token) {
    params.append("grant_type", "refresh_token");
    params.append("refresh_token", refresh_token);
  } else {
    params.append("grant_type", "authorization_code");
    params.append("code", code);
    params.append("redirect_uri", redirect_uri);
    
    if (code_verifier) {
      params.append("code_verifier", code_verifier);
    }
  }

  // Diese Umgebungsvariablen müssen in Vercel gesetzt sein!
  params.append("client_id", process.env.CLIENT_ID);
  params.append("client_secret", process.env.CLIENT_SECRET);

  try {
    // FIX: Die korrekte Spotify Token URL nutzen
    // KORREKTUR: Echte Spotify Accounts URL
    const response = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    });

    const data = await response.json();

    if (data.error) {
      console.error("Spotify API Error:", data); 
      return res.status(400).json({ error: data.error_description || data.error });
    }

    return res.status(200).json(data);
  } catch (error) {
    console.error("Server Error:", error);
    return res.status(500).json({
      error: "Internal server error",
      details: error.message,
    });
  }
}
