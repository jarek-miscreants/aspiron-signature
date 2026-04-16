interface Env {
  SIGNATURES: R2Bucket;
  UPLOAD_SECRET: string;
  R2_PUBLIC_BASE?: string;
}

const PUBLIC_BASE_FALLBACK = "https://pub-376c070665f24d80ac2828a67b43160a.r2.dev";

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  if (!env.UPLOAD_SECRET) {
    return json({ error: "Server missing UPLOAD_SECRET env var" }, 500);
  }
  if (request.headers.get("X-Upload-Secret") !== env.UPLOAD_SECRET) {
    return json({ error: "Unauthorized" }, 401);
  }

  const ct = request.headers.get("Content-Type") || "";
  if (!ct.startsWith("image/png")) {
    return json({ error: "Expected image/png" }, 400);
  }

  const buf = await request.arrayBuffer();
  if (buf.byteLength === 0 || buf.byteLength > 2_000_000) {
    return json({ error: "Invalid size" }, 400);
  }

  const hashBuf = await crypto.subtle.digest("SHA-256", buf);
  const hash = [...new Uint8Array(hashBuf)].map(b => b.toString(16).padStart(2, "0")).join("").slice(0, 16);

  const slug = (request.headers.get("X-Slug") || "signature").replace(/[^a-z0-9-]/gi, "").toLowerCase().slice(0, 40) || "signature";
  const key = `${slug}-${hash}.png`;

  await env.SIGNATURES.put(key, buf, {
    httpMetadata: {
      contentType: "image/png",
      cacheControl: "public, max-age=31536000, immutable",
    },
  });

  const base = env.R2_PUBLIC_BASE || PUBLIC_BASE_FALLBACK;
  return json({ url: `${base}/${key}`, key });
};

export const onRequestOptions: PagesFunction = async () => {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, X-Upload-Secret, X-Slug",
      "Access-Control-Max-Age": "86400",
    },
  });
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
  });
}
