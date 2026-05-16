// /api/chat.js  ← place this in your project root's /api folder
// Vercel Edge Function — runs on Vercel's servers, never in the browser

export const config = {
  runtime: "edge", // Use Vercel's Edge Runtime
};

export default async function handler(req) {
  // Only allow POST requests
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Optional: restrict to your own domain (CORS protection)
  const origin = req.headers.get("origin");
  const allowedOrigins = [
    "https://finly-hazel.vercel.app",
    "http://localhost:3000", // for local dev
  ];

  try {
    // Parse the request body from your frontend
    const body = await req.json();

    // Forward the request to Groq, injecting the secret key from env
    const groqResponse = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // ✅ Key is read from Vercel's environment — never sent to the browser
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        },
        body: JSON.stringify(body),
      }
    );

    // If Groq returned an error, forward it to your frontend
    if (!groqResponse.ok) {
      const errorData = await groqResponse.json();
      return new Response(JSON.stringify(errorData), {
        status: groqResponse.status,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": allowedOrigins.includes(origin)
            ? origin
            : "null",
        },
      });
    }

    // Forward the successful Groq response back to your frontend
    const data = await groqResponse.json();
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": allowedOrigins.includes(origin)
          ? origin
          : "null",
      },
    });
  } catch (err) {
    console.error("Proxy error:", err);
    return new Response(
      JSON.stringify({ error: "Internal proxy error", detail: err.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
