// netlify/functions/create-session.js
const OpenAI = require('openai');

exports.handler = async (event) => {
  try {
    const { workflowId, version } = JSON.parse(event.body || '{}');

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    // Crea sesión de ChatKit para tu workflow (hosted)
    const session = await client.chatkit.sessions.create({
      workflow: workflowId,           // ej. "wf_68e4..."
      version: version || undefined   // omite para usar la publicada
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ client_secret: session.client_secret })
    };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};