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
    const API_KEY = process.env.OPENAI_API_KEY;
    const WF_ID   = process.env.WORKFLOW_ID;
    const WF_VER  = process.env.WORKFLOW_VERSION || undefined;

    if (!API_KEY) throw new Error("OPENAI_API_KEY is missing");
    if (!WF_ID)   throw new Error("WORKFLOW_ID is missing");

    const openai = new OpenAI({ apiKey: API_KEY });

    // Hosted Sessions para ChatKit
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
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err?.message || String(err) }),
    };
  }
}