// netlify/functions/create-session.mjs
// Hosted ChatKit session via REST (requires OpenAI-Beta header).
// workflow: { id: "wf_..." }   ✅
// user: "some-user-id"         ✅ (string, no objeto)

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

    // Lee userId opcional del body; si no, genera uno
    let bodyUserId;
    try {
      const parsed = JSON.parse(event.body || "{}");
      bodyUserId = parsed.userId;
    } catch {}
    const userId = bodyUserId || `anon-${crypto.randomUUID()}`; // 👈 string

    const response = await fetch("https://api.openai.com/v1/chatkit/sessions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${API_KEY}`,
        "OpenAI-Beta": "chatkit_beta=v1",
      },
      body: JSON.stringify({
        workflow: { id: WF_ID }, // 👈 objeto con id
        user: userId,            // 👈 string (no { id: ... })
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