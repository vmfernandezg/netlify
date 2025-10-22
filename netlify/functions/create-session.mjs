// netlify/functions/create-session.mjs
// Crea sesión Hosted de ChatKit vía REST (con diagnóstico ampliado).

export async function handler(event) {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers, body: "" };
  }

  try {
    const API_KEY = process.env.OPENAI_API_KEY;
    const WF_ID   = process.env.WORKFLOW_ID;

    if (!API_KEY) throw new Error("Missing OPENAI_API_KEY");
    if (!WF_ID)   throw new Error("Missing WORKFLOW_ID");

    // user opcional desde body; si no, generamos uno
    let bodyUserId;
    try {
      const parsed = JSON.parse(event.body || "{}");
      bodyUserId = parsed.userId;
    } catch {}
    const userId = bodyUserId || `anon-${crypto.randomUUID()}`;

    const resp = await fetch("https://api.openai.com/v1/chatkit/sessions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${API_KEY}`,
        "OpenAI-Beta": "chatkit_beta=v1",
      },
      body: JSON.stringify({
        workflow: { id: WF_ID }, // <- objeto { id }
        user: userId,            // <- string
      }),
    });

    const data = await resp.json();

    if (!resp.ok) {
      // Propaga error crudo de la API para verlo en Network → Response
      return {
        statusCode: resp.status,
        headers,
        body: JSON.stringify({
          upstream_status: resp.status,
          upstream_error: data?.error || data,
        }),
      };
    }

    // Acepta ambos formatos por si la API cambia:
    const secret =
      (data && data.client_secret && data.client_secret.value) ||
      (typeof data?.client_secret === "string" ? data.client_secret : undefined);

    if (!secret) {
      // Devuelve el payload completo para inspección
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          error: "No client_secret found in API response",
          raw_response: data,
        }),
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ client_secret: secret }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err?.message || String(err) }),
    };
  }
}