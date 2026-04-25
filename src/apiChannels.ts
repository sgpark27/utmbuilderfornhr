import type { ChannelGroup } from "./channels";
import { DEFAULT_CHANNEL_GROUPS } from "./channels";
import { getAdminCredsForApi } from "./adminAuth";

export function isCentralChannelMode(): boolean {
  const v = import.meta.env.VITE_CENTRAL_CHANNELS;
  return v === "1" || v === "true";
}

export async function fetchChannelGroupsFromServer(): Promise<{
  groups: ChannelGroup[];
  error: string | null;
}> {
  try {
    const res = await fetch("/api/channel-groups", {
      method: "GET",
      headers: { Accept: "application/json" },
    });
    if (!res.ok) {
      let err = `HTTP ${res.status}`;
      if (res.status === 404 && import.meta.env.DEV) {
        err =
          "API 404: Flask(127.0.0.1:5000)를 켜 두었는지 확인하세요. deploy/pythonanywhere → FLASK_APP=app.py && flask run -p 5000";
      }
      return { groups: DEFAULT_CHANNEL_GROUPS, error: err };
    }
    const data = (await res.json()) as { groups: ChannelGroup[] | null };
    if (data.groups == null) {
      return { groups: DEFAULT_CHANNEL_GROUPS, error: null };
    }
    if (!Array.isArray(data.groups) || !data.groups.length) {
      return { groups: DEFAULT_CHANNEL_GROUPS, error: null };
    }
    return { groups: data.groups, error: null };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "network error";
    const hint = import.meta.env.DEV
      ? " (개발: 터미널에 flask run -p 5000 을 켜 두세요)"
      : "";
    return { groups: DEFAULT_CHANNEL_GROUPS, error: msg + hint };
  }
}

export async function putChannelGroupsToServer(
  groups: ChannelGroup[]
): Promise<{ ok: boolean; error: string }> {
  const creds = getAdminCredsForApi();
  if (!creds) {
    return { ok: false, error: "no_credentials" };
  }
  try {
    const res = await fetch("/api/channel-groups", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        id: creds.id,
        password: creds.password,
        groups,
      }),
    });
    if (!res.ok) {
      const raw = await res.text();
      let err = raw || `HTTP ${res.status}`;
      try {
        const j = JSON.parse(raw) as { error?: string; hint?: string };
        if (j.hint) err = j.hint;
        else if (j.error) err = j.error;
      } catch {
        // raw body 그대로
      }
      return { ok: false, error: err };
    }
    return { ok: true, error: "" };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "network error",
    };
  }
}
