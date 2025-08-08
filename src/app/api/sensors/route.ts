// src/app/api/sensors/route.ts
import { NextResponse } from "next/server";

const BASE = "https://api.sensorpush.com/api/v1";

// Simple in-memory cache (per server process)
type TokenCache = {
  accessToken?: string;
  accessTokenExpiresAt?: number; // epoch ms
  sensorsCache?: any;
  sensorsCacheAt?: number;
};

const CACHE: TokenCache = {};

async function getAccessToken(): Promise<string> {
  const now = Date.now();
  // Reuse token if still valid (SensorPush access token ~30 min; we'll refresh after 25 min)
  if (CACHE.accessToken && CACHE.accessTokenExpiresAt && CACHE.accessTokenExpiresAt > now + 30_000) {
    return CACHE.accessToken;
  }

  const email = process.env.SENSORPUSH_EMAIL;
  const password = process.env.SENSORPUSH_PASSWORD;
  if (!email || !password) {
    throw new Error("Missing SENSORPUSH_EMAIL or SENSORPUSH_PASSWORD in env");
  }

  // 1) authorize
  const authRes = await fetch(`${BASE}/oauth/authorize`, {
    method: "POST",
    headers: { "accept": "application/json", "content-type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!authRes.ok) {
    const t = await safeJson(authRes);
    throw new Error(`Authorize failed (${authRes.status}): ${JSON.stringify(t)}`);
  }
  const auth = await authRes.json();
  if (!auth.authorization) throw new Error("Authorize failed: no authorization code");

  // 2) access token
  const tokenRes = await fetch(`${BASE}/oauth/accesstoken`, {
    method: "POST",
    headers: { "accept": "application/json", "content-type": "application/json" },
    body: JSON.stringify({ authorization: auth.authorization }),
  });

  if (!tokenRes.ok) {
    const t = await safeJson(tokenRes);
    throw new Error(`Access token failed (${tokenRes.status}): ${JSON.stringify(t)}`);
  }
  const tokens = await tokenRes.json();
  const accessToken = tokens.accesstoken as string | undefined;
  const refreshToken = tokens.refreshtoken as string | undefined;
  if (!accessToken) throw new Error("Access token missing in response");

  // Cache access token; assume ~30 min lifetime, refresh at ~25 min
  CACHE.accessToken = accessToken;
  CACHE.accessTokenExpiresAt = Date.now() + 25 * 60 * 1000;

  // (Optional: you could store refreshToken to refresh without password; not used here)
  void refreshToken;

  return accessToken;
}

async function safeJson(res: Response) {
  try {
    return await res.json();
  } catch {
    return { text: await res.text() };
  }
}

export async function GET() {
  try {
    // Cache the sensor list for 55 seconds to respect 1 req/min rate limit
    const now = Date.now();
    if (CACHE.sensorsCache && CACHE.sensorsCacheAt && now - CACHE.sensorsCacheAt < 55_000) {
      return NextResponse.json(CACHE.sensorsCache);
    }

    const accessToken = await getAccessToken();

    const sensorsRes = await fetch(`${BASE}/devices/sensors`, {
      method: "POST", // SensorPush requires POST (even for list)
      headers: {
        "accept": "application/json",
        "content-type": "application/json",
        "authorization": accessToken,
      },
      body: JSON.stringify({}), // must send a JSON body, even if empty
    });

    if (sensorsRes.status === 429) {
      // Hit rate limit — return last good cache if available
      if (CACHE.sensorsCache) {
        return NextResponse.json(
          { ...CACHE.sensorsCache, note: "Returning cached sensors due to SensorPush rate limit (429)" },
          { status: 200 }
        );
      }
      return NextResponse.json({ error: "Rate limited by SensorPush (429)" }, { status: 429 });
    }

    if (!sensorsRes.ok) {
      const t = await safeJson(sensorsRes);
      return NextResponse.json({ error: "Sensor list failed", status: sensorsRes.status, details: t }, { status: 500 });
    }

    const sensors = await sensorsRes.json();

    // Cache result
    CACHE.sensorsCache = sensors;
    CACHE.sensorsCacheAt = now;

    return NextResponse.json(sensors);
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message || e) }, { status: 500 });
  }
}
