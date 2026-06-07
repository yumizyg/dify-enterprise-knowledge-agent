const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

export default async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  const apiKey = process.env.DIFY_API_KEY;
  if (!apiKey) {
    return json(
      {
        error: "Dify API 未配置",
        hint: "请在 Netlify 环境变量中设置 DIFY_API_KEY",
      },
      503
    );
  }

  const apiBase = (process.env.DIFY_API_BASE || "https://api.dify.ai/v1").replace(
    /\/$/,
    ""
  );

  let body;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  if (!body.query || typeof body.query !== "string") {
    return json({ error: "query is required" }, 400);
  }

  const payload = {
    inputs: body.inputs || {},
    query: body.query,
    response_mode: body.response_mode || "streaming",
    conversation_id: body.conversation_id || "",
    user: body.user || "netlify-demo-user",
    files: body.files || [],
  };

  try {
    const upstream = await fetch(`${apiBase}/chat-messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!upstream.ok) {
      const detail = await upstream.text();
      return json(
        {
          error: "Dify API 请求失败",
          status: upstream.status,
          detail: detail.slice(0, 500),
        },
        upstream.status
      );
    }

    const contentType =
      upstream.headers.get("content-type") || "text/event-stream";

    return new Response(upstream.body, {
      status: upstream.status,
      headers: {
        ...corsHeaders,
        "Content-Type": contentType,
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    return json(
      {
        error: "无法连接 Dify 服务",
        detail: error instanceof Error ? error.message : String(error),
      },
      502
    );
  }
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}
