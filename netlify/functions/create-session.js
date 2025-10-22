// netlify/functions/create-session.mjs
import OpenAI from "openai";

export async function handler(event) {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
  };
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers, body: "" };
  }

  try {
    // 1) Lee env vars (recomendado)…
    const API_KEY = process.env.OPENAI_API_KEY;
    const WF_ID   = process.env.WORKFLOW_ID;
    const WF_VER  = process.env.WORKFLOW_VERSION || undefined;

    // 2) …o permite que vengan en el body (tu HTML actual las envía)
    if (!WF_ID) {
      try {
        const { workflowId, version } = JSON.parse(event.body || "{}");
        if (workflowId) {
          // si llega por body, úsalo (tiene prioridad)
          const openai = new OpenAI({ apiKey: API_KEY });
          const session = await openai.chatkit.sessions.create({
            workflow: workflowId,
            version: version || undefined,
          });
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ client_secret: session.client_secret }),
          };
        }
      } catch {}
    }

    if (!API_KEY) throw new Error("OPENAI_API_KEY is missing");
    if (!WF_ID) throw new Error("WORKFLOW_ID is missing (env) and not provided in request body");

    const openai = new OpenAI({ apiKey: API_KEY });

    // 👇 Llamada correcta a la Hosted Sessions API
    const session = await openai.chatkit.sessions.create({
      workflow: WF_ID,
      version: WF_VER,
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ client_secret: session.client_secret }),
    };
  } catch (err) {
    // Devuelve el mensaje exacto para verlo en Network → Response
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: err?.message || String(err),
      }),
    };
  }
}