const requestWindows = new Map<string, { count: number; expiresAt: number }>();

export async function readJsonBody(
  request: Request,
  maxBytes: number,
): Promise<{ ok: true; value: unknown } | { ok: false; error: string }> {
  const contentLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > maxBytes) {
    return { ok: false, error: "Request body is too large." };
  }

  if (!request.body) {
    return { ok: false, error: "Request body is required." };
  }

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      totalBytes += value.byteLength;
      if (totalBytes > maxBytes) {
        await reader.cancel();
        return { ok: false, error: "Request body is too large." };
      }
      chunks.push(value);
    }

    const body = new Uint8Array(totalBytes);
    let offset = 0;
    for (const chunk of chunks) {
      body.set(chunk, offset);
      offset += chunk.byteLength;
    }

    return { ok: true, value: JSON.parse(new TextDecoder().decode(body)) as unknown };
  } catch {
    return { ok: false, error: "Request body must be valid JSON." };
  } finally {
    reader.releaseLock();
  }
}

export function consumeRateLimit(
  request: Request,
  action: string,
  limit: number,
  windowMs: number,
): { allowed: boolean; retryAfterSeconds: number } {
  const address =
    request.headers.get("x-real-ip")?.trim() ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown";
  const key = `${action}:${address}`;
  const now = Date.now();
  if (requestWindows.size > 500) clearExpiredRateLimits(now);
  if (requestWindows.size >= 10_000) {
    const oldestKey = requestWindows.keys().next().value;
    if (oldestKey) requestWindows.delete(oldestKey);
  }
  const current = requestWindows.get(key);

  if (!current || current.expiresAt <= now) {
    requestWindows.set(key, { count: 1, expiresAt: now + windowMs });
    return { allowed: true, retryAfterSeconds: 0 };
  }

  if (current.count >= limit) {
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil((current.expiresAt - now) / 1000)),
    };
  }

  current.count += 1;
  return { allowed: true, retryAfterSeconds: 0 };
}

export function clearExpiredRateLimits(now = Date.now()): void {
  for (const [key, window] of requestWindows) {
    if (window.expiresAt <= now) requestWindows.delete(key);
  }
}
