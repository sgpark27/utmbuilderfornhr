import type { ChannelGroup, ChannelLeaf } from "./channels";
import { DEFAULT_CHANNEL_GROUPS } from "./channels";

/** 기본 채널 목록(TSV)을 크게 바꾼 뒤 배포할 때마다 버전을 올리면, 예전 localStorage 캐시 없이 새 기본값이 적용됩니다. */
const STORAGE_KEY = "careerlink-utm-channel-groups-v4";

function cloneDefault(): ChannelGroup[] {
  return JSON.parse(JSON.stringify(DEFAULT_CHANNEL_GROUPS)) as ChannelGroup[];
}

function isValidLeaf(o: unknown): o is ChannelLeaf {
  if (!o || typeof o !== "object") return false;
  const x = o as Record<string, unknown>;
  return (
    typeof x.id === "string" &&
    x.id.length > 0 &&
    typeof x.label === "string" &&
    typeof x.utm_source === "string" &&
    typeof x.utm_medium === "string" &&
    (x.utm_content === undefined || typeof x.utm_content === "string")
  );
}

function isValidGroup(o: unknown): o is ChannelGroup {
  if (!o || typeof o !== "object") return false;
  const g = o as Record<string, unknown>;
  if (typeof g.id !== "string" || !g.id) return false;
  if (typeof g.label !== "string") return false;
  if (!Array.isArray(g.children) || !g.children.every(isValidLeaf)) return false;
  if (
    g.faviconFallback !== undefined &&
    g.faviconFallback !== "mail" &&
    g.faviconFallback !== "initial"
  ) {
    return false;
  }
  if (g.faviconDomain !== undefined && typeof g.faviconDomain !== "string") {
    return false;
  }
  return true;
}

export function loadChannelGroups(): ChannelGroup[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return cloneDefault();
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed) || !parsed.every(isValidGroup)) {
      return cloneDefault();
    }
    return parsed;
  } catch {
    return cloneDefault();
  }
}

export function saveChannelGroups(groups: ChannelGroup[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(groups));
}
