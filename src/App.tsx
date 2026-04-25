import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { Link } from "react-router-dom";
import { useChannelGroups } from "./channelContext";
import { countAllLeaves, type ChannelGroup, type ChannelLeaf } from "./channels";
import { FaviconBadge } from "./FaviconBadge";
import { SiteFooter } from "./SiteFooter";
import {
  buildExportBasename,
  downloadXlsx,
  type UtmExportRow,
} from "./exportDownload";

function ClipboardIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

function ChevronRightIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

function ResetIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
    </svg>
  );
}

function isValidLandingUrl(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return false;
  try {
    const u = new URL(trimmed);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

/** 생성 결과: 채널 · URL 열 비율 4:6, 복사 버튼 고정 */
const RESULT_GRID_STYLE: CSSProperties = {
  gridTemplateColumns: "minmax(0, 2fr) minmax(0, 3fr) auto",
};

function buildUtmUrl(
  landingUrl: string,
  campaign: string,
  leaf: ChannelLeaf
): string {
  const u = new URL(landingUrl.trim());
  const params = new URLSearchParams(u.search);
  params.set("utm_source", leaf.utm_source);
  params.set("utm_medium", leaf.utm_medium);
  params.set("utm_campaign", campaign.trim());
  if (leaf.utm_content) {
    params.set("utm_content", leaf.utm_content);
  } else {
    params.delete("utm_content");
  }
  u.search = params.toString();
  return u.toString();
}

export default function App() {
  const {
    groups: CHANNEL_GROUPS,
    channelsLoading,
    channelsLoadError,
  } = useChannelGroups();
  const [landingUrl, setLandingUrl] = useState("");
  const [campaign, setCampaign] = useState("");
  const [selectedLeafIds, setSelectedLeafIds] = useState<Set<string>>(
    () => new Set()
  );
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
  const [channelSearch, setChannelSearch] = useState("");
  const [showMediumDetails, setShowMediumDetails] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const selectAllRef = useRef<HTMLInputElement>(null);

  const filteredGroups = useMemo(() => {
    const q = channelSearch.trim().toLowerCase();
    if (!q) return CHANNEL_GROUPS;
    return CHANNEL_GROUPS.filter((g) => g.label.toLowerCase().includes(q));
  }, [CHANNEL_GROUPS, channelSearch]);

  useEffect(() => {
    if (CHANNEL_GROUPS.length === 0) {
      setActiveGroupId(null);
      return;
    }
    const q = channelSearch.trim();
    const pool = q ? filteredGroups : CHANNEL_GROUPS;
    if (pool.length === 0) return;
    if (
      activeGroupId === null ||
      !pool.some((g) => g.id === activeGroupId)
    ) {
      setActiveGroupId(pool[0].id);
    }
  }, [
    CHANNEL_GROUPS,
    activeGroupId,
    filteredGroups,
    channelSearch,
  ]);

  const showToast = useCallback((message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 2200);
  }, []);

  const urlOk = isValidLandingUrl(landingUrl);
  const campaignOk = campaign.trim().length > 0;

  const rows = useMemo(() => {
    if (!urlOk || !campaignOk) return [];
    const out: { group: ChannelGroup; leaf: ChannelLeaf; url: string }[] = [];
    for (const group of CHANNEL_GROUPS) {
      for (const leaf of group.children) {
        if (selectedLeafIds.has(leaf.id)) {
          out.push({
            group,
            leaf,
            url: buildUtmUrl(landingUrl, campaign, leaf),
          });
        }
      }
    }
    return out;
  }, [
    CHANNEL_GROUPS,
    landingUrl,
    campaign,
    selectedLeafIds,
    urlOk,
    campaignOk,
  ]);

  const exportRows = useMemo((): UtmExportRow[] => {
    return rows.map((r) => ({
      groupLabel: r.group.label,
      leafLabel: r.leaf.label,
      utm_source: r.leaf.utm_source,
      utm_medium: r.leaf.utm_medium,
      utm_content: r.leaf.utm_content ?? "",
      url: r.url,
    }));
  }, [rows]);

  const activeGroup = useMemo(
    () => CHANNEL_GROUPS.find((g) => g.id === activeGroupId) ?? null,
    [CHANNEL_GROUPS, activeGroupId]
  );

  const rightGroup =
    channelSearch.trim() && filteredGroups.length === 0
      ? null
      : activeGroup;

  const toggleLeaf = (leafId: string) => {
    setSelectedLeafIds((prev) => {
      const next = new Set(prev);
      if (next.has(leafId)) next.delete(leafId);
      else next.add(leafId);
      return next;
    });
  };

  const toggleSelectAllInActiveGroup = () => {
    if (!rightGroup || rightGroup.children.length === 0) return;
    const ids = rightGroup.children.map((c) => c.id);
    const allOn = ids.every((id) => selectedLeafIds.has(id));
    setSelectedLeafIds((prev) => {
      const next = new Set(prev);
      if (allOn) for (const id of ids) next.delete(id);
      else for (const id of ids) next.add(id);
      return next;
    });
  };

  const clearAllChannelSelection = () => setSelectedLeafIds(new Set());

  const selectedInActive = rightGroup
    ? rightGroup.children.filter((c) => selectedLeafIds.has(c.id)).length
    : 0;
  const allInActiveSelected =
    rightGroup &&
    rightGroup.children.length > 0 &&
    selectedInActive === rightGroup.children.length;
  const someInActiveSelected =
    selectedInActive > 0 &&
    rightGroup &&
    selectedInActive < rightGroup.children.length;

  useEffect(() => {
    const el = selectAllRef.current;
    if (!el) return;
    el.indeterminate = Boolean(someInActiveSelected);
  }, [someInActiveSelected]);

  const copyText = async (text: string, message = "복사 완료") => {
    try {
      await navigator.clipboard.writeText(text);
      showToast(message);
    } catch {
      showToast("복사에 실패했습니다. 브라우저 권한을 확인해 주세요.");
    }
  };

  const copyAll = () => {
    if (rows.length === 0) return;
    const text = rows.map((r) => r.url).join("\n");
    void copyText(text, `${rows.length}개 URL 복사 완료`);
  };

  const handleDownloadXlsx = () => {
    if (exportRows.length === 0) return;
    downloadXlsx(exportRows, `${buildExportBasename()}.xlsx`);
    showToast("Excel 파일을 저장했습니다");
  };

  const totalPresets = countAllLeaves(CHANNEL_GROUPS);

  if (channelsLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50">
        <p className="text-slate-600">채널 목록을 불러오는 중…</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 font-sans">
      {channelsLoadError && (
        <div
          className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-center text-sm text-amber-900"
          role="status"
        >
          서버에서 채널을 읽지 못해 앱에 포함된 기본 목록을 씁니다. ({channelsLoadError})
        </div>
      )}
      <header className="border-b border-zinc-800 bg-black shadow-sm">
        <div className="mx-auto flex max-w-6xl flex-wrap items-start justify-between gap-4 px-4 py-8 sm:px-6">
          <div>
          <h1 className="text-xl font-semibold tracking-tight text-white">
            CareerLink UTM Builder
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-400">
            랜딩페이지와 캠페인을 입력한 뒤 채널을 선택하면 UTM이 붙은 URL이
            생성됩니다.
          </p>
          </div>
          <Link
            to="/admin"
            className="shrink-0 text-sm text-zinc-400 underline-offset-4 hover:text-white hover:underline"
          >
            채널 관리
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
        <div className="space-y-8">
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold tracking-tight text-slate-900">
              입력
            </h2>
            <div className="mt-4 space-y-5">
              <div>
                <label
                  htmlFor="landing"
                  className="block text-sm font-medium text-slate-700"
                >
                  랜딩페이지 <span className="text-red-500">*</span>
                </label>
                <input
                  id="landing"
                  type="url"
                  placeholder="https://example.com/careers/123"
                  value={landingUrl}
                  onChange={(e) => setLandingUrl(e.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-slate-900 shadow-sm outline-none ring-slate-300 transition placeholder:text-slate-400 focus:border-slate-300 focus:ring-2"
                />
                {landingUrl.trim() !== "" && !urlOk && (
                  <p className="mt-1.5 text-sm text-amber-700">
                    http:// 또는 https:// 로 시작하는 유효한 URL을 입력해
                    주세요.
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="campaign"
                  className="block text-sm font-medium text-slate-700"
                >
                  캠페인명 (Campaign Name){" "}
                  <span className="text-red-500">*</span>
                </label>
                <input
                  id="campaign"
                  type="text"
                  placeholder="2026_spring_recruitment"
                  value={campaign}
                  onChange={(e) => setCampaign(e.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-slate-900 shadow-sm outline-none ring-slate-300 transition placeholder:text-slate-400 focus:border-slate-300 focus:ring-2"
                />
              </div>

              <div>
                <span className="block text-sm font-medium text-slate-700">
                  채널 선택
                </span>
                <p className="mt-0.5 text-xs text-slate-500">
                  왼쪽에서 채널(매체)를 고르면 오른쪽에 매체(광고 상품)가
                  나타납니다. 여러 채널에서 골라 담을 수 있습니다. (총{" "}
                  {totalPresets}개 매체)
                </p>

                <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                  <div className="flex flex-col md:flex-row md:min-h-[22rem]">
                    {/* 좌측: 채널명 */}
                    <div className="border-b border-slate-200 bg-slate-50/90 md:w-[min(100%,17.5rem)] md:shrink-0 md:border-b-0 md:border-r">
                      <div className="relative border-b border-slate-200 p-2.5">
                        <SearchIcon className="pointer-events-none absolute left-5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                          type="search"
                          value={channelSearch}
                          onChange={(e) => setChannelSearch(e.target.value)}
                          placeholder="채널명 입력"
                          autoComplete="off"
                          className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 outline-none ring-sky-500/30 placeholder:text-slate-400 focus:border-sky-400 focus:ring-2"
                        />
                      </div>
                      <div className="max-h-[14rem] overflow-y-auto p-2 md:max-h-[min(24rem,calc(100vh-16rem))]">
                        {filteredGroups.length === 0 ? (
                          <p className="px-2 py-6 text-center text-sm text-slate-500">
                            일치하는 채널이 없습니다.
                          </p>
                        ) : (
                          <ul className="grid grid-cols-2 gap-0.5 sm:grid-cols-2 md:grid-cols-1">
                            {filteredGroups.map((group) => {
                              const active = group.id === activeGroupId;
                              const n = group.children.length;
                              const picked = group.children.filter((c) =>
                                selectedLeafIds.has(c.id)
                              ).length;
                              const hasSelection = picked > 0;
                              return (
                                <li key={group.id}>
                                  <button
                                    type="button"
                                    onClick={() => setActiveGroupId(group.id)}
                                    aria-current={active ? "true" : undefined}
                                    aria-label={
                                      picked > 0
                                        ? `${group.label}, ${picked}개 선택됨`
                                        : group.label
                                    }
                                    className={`relative flex w-full items-center gap-1.5 rounded-lg px-2.5 py-2 text-left text-sm transition ${
                                      active
                                        ? "bg-sky-100 font-semibold text-sky-950 ring-1 ring-inset ring-sky-300/80"
                                        : hasSelection
                                          ? "bg-emerald-50/80 text-slate-800 hover:bg-emerald-50"
                                          : "text-slate-800 hover:bg-white"
                                    }`}
                                  >
                                    <span className="relative shrink-0">
                                      <FaviconBadge
                                        domain={group.faviconDomain}
                                        label={group.label}
                                        fallback={
                                          group.faviconFallback ?? "initial"
                                        }
                                      />
                                      {hasSelection && (
                                        <span
                                          className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full border border-white bg-emerald-500 shadow-sm"
                                          title={`${picked}개 매체 선택됨`}
                                          aria-hidden
                                        />
                                      )}
                                    </span>
                                    <span className="min-w-0 flex-1 truncate">
                                      {group.label}
                                    </span>
                                    <span
                                      className={`inline-flex h-6 shrink-0 items-center justify-center rounded-full font-semibold tabular-nums leading-none ring-1 ring-inset ${
                                        n < 10
                                          ? "w-6 px-0 text-[12px]"
                                          : n < 100
                                            ? "min-w-[1.5rem] px-1.5 text-[11px]"
                                            : "min-w-[1.625rem] px-1 text-[10px]"
                                      } ${
                                        active
                                          ? hasSelection
                                            ? "bg-emerald-100 text-emerald-950 ring-emerald-400/60"
                                            : "bg-sky-200/90 text-sky-950 ring-sky-400/50"
                                          : hasSelection
                                            ? "bg-emerald-100/90 text-emerald-900 ring-emerald-300/70"
                                            : "bg-slate-200/80 text-slate-700 ring-slate-300/60"
                                      }`}
                                      title={
                                        hasSelection
                                          ? `${picked}개 선택 · 전체 ${n.toLocaleString()}개 매체`
                                          : `매체 ${n.toLocaleString()}개`
                                      }
                                    >
                                      {n > 999 ? "999+" : n.toLocaleString()}
                                    </span>
                                    {active && (
                                      <ChevronRightIcon className="hidden h-4 w-4 shrink-0 text-sky-600 md:block" />
                                    )}
                                  </button>
                                </li>
                              );
                            })}
                          </ul>
                        )}
                      </div>
                    </div>

                    {/* 우측: 매체명 */}
                    <div className="min-w-0 flex-1 p-4">
                      {rightGroup ? (
                        <>
                          <div className="mb-4 flex flex-wrap items-center justify-end gap-2 border-b border-slate-100 pb-3 text-sm">
                            <button
                              type="button"
                              onClick={() =>
                                setShowMediumDetails((v) => !v)
                              }
                              className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
                            >
                              매체 {showMediumDetails ? "간단히" : "펼쳐보기"}
                              <span className="text-slate-400" aria-hidden>
                                ▾
                              </span>
                            </button>
                            <button
                              type="button"
                              onClick={clearAllChannelSelection}
                              className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
                            >
                              <ResetIcon className="h-4 w-4" />
                              선택 초기화
                            </button>
                          </div>

                          <div className="mb-3 rounded-lg border border-slate-100 bg-slate-50/80 px-3 py-2">
                            <label className="flex cursor-pointer items-center gap-3">
                              <input
                                ref={selectAllRef}
                                type="checkbox"
                                checked={Boolean(allInActiveSelected)}
                                onChange={toggleSelectAllInActiveGroup}
                                className="h-4 w-4 shrink-0 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                              />
                              <span className="text-sm font-bold text-slate-900">
                                {rightGroup.label} 전체
                              </span>
                              {selectedInActive > 0 && (
                                <span className="ml-auto text-xs font-medium text-slate-500">
                                  {selectedInActive}/{rightGroup.children.length}{" "}
                                  선택
                                </span>
                              )}
                            </label>
                          </div>

                          {rightGroup.children.length === 0 ? (
                            <p className="py-8 text-center text-sm text-slate-500">
                              등록된 매체가 없습니다. 채널 관리에서
                              추가해 주세요.
                            </p>
                          ) : (
                            <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                              {rightGroup.children.map((leaf) => (
                                <li key={leaf.id}>
                                  <label className="flex cursor-pointer items-start gap-2.5 rounded-lg border border-transparent px-2 py-2 transition hover:border-slate-100 hover:bg-slate-50/90">
                                    <input
                                      type="checkbox"
                                      checked={selectedLeafIds.has(leaf.id)}
                                      onChange={() => toggleLeaf(leaf.id)}
                                      className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                                    />
                                    <span className="min-w-0 flex-1">
                                      <span className="block text-sm font-medium leading-snug text-slate-800">
                                        {leaf.label}
                                      </span>
                                      {showMediumDetails && (
                                        <span className="mt-1 block text-[11px] text-slate-400">
                                          {leaf.utm_source} / {leaf.utm_medium}
                                          {leaf.utm_content
                                            ? ` / ${leaf.utm_content}`
                                            : ""}
                                        </span>
                                      )}
                                    </span>
                                  </label>
                                </li>
                              ))}
                            </ul>
                          )}
                        </>
                      ) : (
                        <p className="py-16 text-center text-sm text-slate-500">
                          검색어에 맞는 채널이 없습니다. 검색을 바꿔 보세요.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <h2 className="text-lg font-bold tracking-tight text-slate-900">
                생성 결과
              </h2>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={copyAll}
                  disabled={rows.length === 0}
                  className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-800 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  전체 복사
                </button>
                <button
                  type="button"
                  onClick={handleDownloadXlsx}
                  disabled={rows.length === 0}
                  className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-800 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Excel 다운로드
                </button>
              </div>
            </div>

            {!urlOk || !campaignOk ? (
              <p className="mt-6 text-center text-sm text-slate-500">
                랜딩페이지와 캠페인명을 올바르게 입력하면 결과가 표시됩니다.
              </p>
            ) : selectedLeafIds.size === 0 ? (
              <p className="mt-6 text-center text-sm text-slate-500">
                최소 한 개 이상의 채널(소분류)를 선택해 주세요.
              </p>
            ) : (
              <div className="mt-4 overflow-x-auto rounded-xl border border-slate-100">
                <div className="w-full min-w-[min(100%,36rem)] text-left text-sm">
                  <div
                    className="grid border-b border-slate-100 bg-slate-50/90 font-medium text-slate-600"
                    style={RESULT_GRID_STYLE}
                  >
                    <div className="px-4 py-3" role="columnheader">
                      채널
                    </div>
                    <div className="px-4 py-3" role="columnheader">
                      URL
                    </div>
                    <div
                      className="flex w-[3.25rem] shrink-0 items-center justify-center px-2 py-3"
                      role="columnheader"
                    >
                      <span className="sr-only">복사</span>
                      <ClipboardIcon className="h-4 w-4 text-slate-500" />
                    </div>
                  </div>
                  {rows.map(({ group, leaf, url }) => (
                    <div
                      key={leaf.id}
                      className="grid border-b border-slate-100 bg-white last:border-b-0 hover:bg-slate-50/50"
                      style={RESULT_GRID_STYLE}
                    >
                      <div className="px-4 py-3">
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <FaviconBadge
                            domain={group.faviconDomain}
                            label={group.label}
                            fallback={group.faviconFallback ?? "initial"}
                          />
                          <span>{group.label}</span>
                        </div>
                        <div className="mt-0.5 font-medium text-slate-900">
                          {leaf.label}
                        </div>
                      </div>
                      <div className="min-w-0 px-4 py-3">
                        <span
                          className="block break-all text-xs leading-relaxed text-slate-600"
                          title={url}
                        >
                          {url}
                        </span>
                      </div>
                      <div className="flex w-[3.25rem] shrink-0 items-start justify-center px-2 py-3">
                        <button
                          type="button"
                          onClick={() => void copyText(url, "복사 완료")}
                          className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white p-2 text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
                          aria-label="URL 복사"
                        >
                          <ClipboardIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        </div>
      </main>

      <SiteFooter />

      {toast && (
        <div
          role="status"
          className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-800 shadow-lg"
        >
          {toast}
        </div>
      )}
    </div>
  );
}
