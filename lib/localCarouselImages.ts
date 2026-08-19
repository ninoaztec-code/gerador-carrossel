import { createHash } from "node:crypto";
import { lookup } from "node:dns/promises";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { isIP } from "node:net";
import { join } from "node:path";

const PHOTO_ID_RE = /^[A-Z0-9][A-Z0-9._-]{0,127}$/i;
const MAX_BYTES = 8 * 1024 * 1024;
const MAX_REDIRECTS = 4;
const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
]);

type ImageMeta = {
  photo_id: string;
  content_type: string;
  bytes: number;
  source_url: string;
  created_at: string;
};

export type ImportedImage = ImageMeta & {
  local_path: string;
};

function imagesDir() {
  return process.env.CAROUSEL_IMAGES_DIR?.trim() || "";
}

function imagePath(photoId: string) {
  if (!PHOTO_ID_RE.test(photoId) || photoId.includes("..")) throw new Error("invalid_photo_id");
  return join(imagesDir(), `${photoId}.bin`);
}

function metaPath(photoId: string) {
  if (!PHOTO_ID_RE.test(photoId) || photoId.includes("..")) throw new Error("invalid_photo_id");
  return join(imagesDir(), `${photoId}.json`);
}

async function ensureImagesDir() {
  const dir = imagesDir();
  if (!dir) throw new Error("CAROUSEL_IMAGES_DIR_missing");
  await mkdir(dir, { recursive: true });
}

function isPrivateIpv4(ip: string) {
  const parts = ip.split(".").map(Number);
  if (parts.length !== 4 || parts.some((n) => Number.isNaN(n))) return false;
  const [a, b] = parts;
  return a === 10 || a === 127 || a === 0 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || a >= 224;
}

function isPrivateIpv6(ip: string) {
  const value = ip.toLowerCase();
  return value === "::1" || value === "::" || value.startsWith("fc") || value.startsWith("fd") || value.startsWith("fe8") || value.startsWith("fe9") || value.startsWith("fea") || value.startsWith("feb");
}

function isPrivateAddress(address: string) {
  const family = isIP(address);
  if (family === 4) return isPrivateIpv4(address);
  if (family === 6) return isPrivateIpv6(address);
  return true;
}

async function assertPublicUrl(raw: string) {
  const url = new URL(raw);
  if (url.protocol !== "http:" && url.protocol !== "https:") throw new Error("image_url_protocol_not_allowed");
  if (url.username || url.password) throw new Error("image_url_credentials_not_allowed");
  const hostname = url.hostname.toLowerCase();
  if (hostname === "localhost" || hostname.endsWith(".local")) throw new Error("image_url_private_host");

  if (isIP(hostname)) {
    if (isPrivateAddress(hostname)) throw new Error("image_url_private_host");
  } else {
    const addresses = await lookup(hostname, { all: true, verbatim: true });
    if (!addresses.length || addresses.some((item) => isPrivateAddress(item.address))) throw new Error("image_url_private_host");
  }
  return url;
}

async function fetchPublicImage(rawUrl: string, redirects = 0): Promise<{ response: Response; finalUrl: string }> {
  if (redirects > MAX_REDIRECTS) throw new Error("image_redirect_limit");
  const url = await assertPublicUrl(rawUrl);
  const response = await fetch(url, {
    redirect: "manual",
    cache: "no-store",
    headers: {
      Accept: "image/avif,image/webp,image/png,image/jpeg,image/gif;q=0.8,*/*;q=0.1",
      "User-Agent": "MagoCarouselImageImporter/1.0",
    },
  });

  if (response.status >= 300 && response.status < 400) {
    const location = response.headers.get("location");
    if (!location) throw new Error("image_redirect_without_location");
    return fetchPublicImage(new URL(location, url).toString(), redirects + 1);
  }
  return { response, finalUrl: url.toString() };
}

export async function importExternalImage(sourceUrl: string): Promise<ImportedImage> {
  await ensureImagesDir();
  const { response, finalUrl } = await fetchPublicImage(sourceUrl);
  if (!response.ok) throw new Error(`image_fetch_http_${response.status}`);

  const contentType = (response.headers.get("content-type") || "").split(";", 1)[0].trim().toLowerCase();
  if (!ALLOWED_TYPES.has(contentType)) throw new Error(`image_content_type_not_allowed:${contentType || "unknown"}`);

  const declaredLength = Number(response.headers.get("content-length") || 0);
  if (declaredLength > MAX_BYTES) throw new Error("image_too_large");

  const buffer = Buffer.from(await response.arrayBuffer());
  if (!buffer.length) throw new Error("image_empty");
  if (buffer.length > MAX_BYTES) throw new Error("image_too_large");

  const digest = createHash("sha256").update(buffer).digest("hex").slice(0, 20).toUpperCase();
  const photoId = `MAGO-IMG-${digest}`;
  const meta: ImageMeta = {
    photo_id: photoId,
    content_type: contentType,
    bytes: buffer.length,
    source_url: finalUrl,
    created_at: new Date().toISOString(),
  };

  await writeFile(imagePath(photoId), buffer);
  await writeFile(metaPath(photoId), `${JSON.stringify(meta, null, 2)}\n`, "utf-8");
  return { ...meta, local_path: imagePath(photoId) };
}

export async function readLocalImage(photoId: string): Promise<{ body: Buffer; meta: ImageMeta } | null> {
  if (!imagesDir()) return null;
  try {
    const [body, rawMeta] = await Promise.all([
      readFile(imagePath(photoId)),
      readFile(metaPath(photoId), "utf-8"),
    ]);
    return { body, meta: JSON.parse(rawMeta) as ImageMeta };
  } catch (error) {
    const code = (error as NodeJS.ErrnoException)?.code;
    if (code === "ENOENT") return null;
    throw error;
  }
}
