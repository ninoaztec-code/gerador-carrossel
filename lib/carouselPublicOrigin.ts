import type { NextRequest } from "next/server";

const DEFAULT_PUBLIC_ORIGIN = "https://carrossel.magodastesouras.com.br";

function cleanOrigin(value?: string | null) {
  const raw = value?.trim().replace(/\/+$/, "");
  if (!raw) return "";
  try {
    const url = new URL(raw);
    const host = url.hostname.toLowerCase();
    if (host === "0.0.0.0" || host === "127.0.0.1" || host === "localhost" || host === "::") return "";
    return url.origin;
  } catch {
    return "";
  }
}

export function carouselPublicOrigin(req?: NextRequest) {
  const configured = cleanOrigin(process.env.CAROUSEL_PUBLIC_ORIGIN);
  if (configured) return configured;

  if (req) {
    const forwardedHost = req.headers.get("x-forwarded-host")?.split(",")[0]?.trim();
    const host = forwardedHost || req.headers.get("host")?.trim();
    const forwardedProto = req.headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
    const proto = forwardedProto || req.nextUrl.protocol.replace(":", "") || "https";
    const forwarded = cleanOrigin(host ? `${proto}://${host}` : "");
    if (forwarded) return forwarded;

    const requestOrigin = cleanOrigin(req.nextUrl.origin);
    if (requestOrigin) return requestOrigin;
  }

  return DEFAULT_PUBLIC_ORIGIN;
}
