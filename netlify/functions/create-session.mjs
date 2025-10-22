// netlify/functions/create-session.mjs
// Crea una sesión de ChatKit (Hosted) via REST.
// Requisitos: header beta, workflow como objeto { id }, y user.

export async function handler(event) {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  // Preflight CORS
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers, body: "" };
  }

  try {
    const API_KEY = process.env.OPENAI_API_KEY;
    const WF_ID   = process.env.WORKFLOW_ID;

    if (!API_KEY) throw new Error("Missing OPENAI_API_KEY");
    if (!WF_ID)   throw new Error("Missing WORKFLOW_ID");

    // user opcional desde el body; si no llega, generamos uno
    let bodyUserId;
    try {
      const parsed = JSON.parse(event.body || "{}");
      bodyUserId = parsed.userId;
    } catch {}

    const userId = bodyUserId || `anon-${crypto.randomUUID()}`;

    // Llamada REST con headers necesarios
    const response = await fetch("https://api.openai.com/v1/chatkit/sessions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${API_KEY}`,
        "OpenAI-Beta": "chatkit_beta=v1",
      },
      body: JSON.stringify({
        // 👇 workflow debe ser un objeto con id
        workflow: { id: WF_ID },
        // no envíes "version" aquí
        user: { id: userId },
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data?.error?.message || JSON.stringify(data));
    }

    const secret = data?.client_secret?.value;
    if (!secret) throw new Error("No client_secret.value found in API response");

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ client_secret: secret }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err.message || String(err) }),
    };
  }
}