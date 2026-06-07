export default async () => {
  const embedUrl = process.env.DIFY_EMBED_URL || "";
  const appName = process.env.DIFY_APP_NAME || "企业内部知识库 Agent";
  const configured = Boolean(process.env.DIFY_API_KEY || embedUrl);

  return new Response(
    JSON.stringify({
      configured,
      embedUrl,
      appName,
      mode: embedUrl ? "embed" : "api",
    }),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
        "Access-Control-Allow-Origin": "*",
      },
    }
  );
};
