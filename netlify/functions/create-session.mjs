// netlify/functions/create-session.mjs

export async function handler(event) {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  // Permitir preflight de CORS
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers, body: "" };
  }

  try {
    // 🔹 Variables de entorno desde Netlify
    const API_KEY = process.env.OPENAI_API_KEY;
    const WF_ID = process.env.WORKFLOW_ID;
    const WF_VER = process.env.WORKFLOW_VERSION || "published";

    if (!API_KEY) throw new Error("Missing OPENAI_API_KEY");
    if (!WF_ID) throw new Error("Missing WORKFLOW_ID");

    // 🔹 Llamada directa a la API REST de ChatKit Hosted Sessions
    const response = await fetch("https://api.openai.com/v1/chatkit/sessions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        workflow: WF_ID,
        version: WF_VER,
      }),
    });

    const data = await response.json();

    // Manejo de errores de API
    if (!response.ok) {
      throw new Error(data?.error?.message || JSON.stringify(data));
    }

    // 🔹 Extrae el valor del client_secret
    const secret = data?.client_secret?.value;
    if (!secret) throw new Error("No client_secret.value found in API response");

    // Devuelve el secreto al frontend
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ client_secret: secret }),
    };
  } catch (err) {
    // 🔹 Retorna el mensaje exacto del error para depuración
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: err.message || String(err),
      }),
    };
  }
}