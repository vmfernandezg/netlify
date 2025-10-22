// netlify/functions/create-session.mjs
// Crea una sesión de ChatKit (Hosted) vía REST, incluyendo el parámetro `user`.

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
    const WF_VER  = process.env.WORKFLOW_VERSION || "published"; // o "draft"

    if (!API_KEY) throw new Error("Missing OPENAI_API_KEY");
    if (!WF_ID)   throw new Error("Missing WORKFLOW_ID");

    // 1) Permite pasar un userId desde el cliente (opcional)
    let bodyUserId;
    try {
      const parsed = JSON.parse(event.body || "{}");
      bodyUserId = parsed.userId;
    } catch {}

    // 2) Si no llega, genera uno anónimo estable por petición
    //    (Node 20+ tiene crypto.randomUUID() global)
    const userId = bodyUserId || `anon-${crypto.randomUUID()}`;

    // 3) Llamada REST a Hosted Sessions (con header beta requerido)
    const response = await fetch("https://api.openai.com/v1/chatkit/sessions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${API_KEY}`,
        "OpenAI-Beta": "chatkit_beta=v1",
      },
      body: JSON.stringify({
        workflow: WF_ID,
        version: WF_VER,
        // 👇 Campo requerido por la API
        user: { id: userId }, // también funciona como string: `user: userId`
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