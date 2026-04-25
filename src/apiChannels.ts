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
      return { groups: DEFAULT_CHANNEL_GROUPS, error: `HTTP ${res.status}` };
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
    return { groups: DEFAULT_CHANNEL_GROUPS, error: msg };
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
      const t = await res.text();
      return { ok: false, error: t || `HTTP ${res.status}` };
    }
    return { ok: true, error: "" };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "network error",
    };
  }
}
