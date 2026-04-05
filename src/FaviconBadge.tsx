import { useState } from "react";

/** Google 공개 파비콘 프록시 (도메인만 알면 16~128px 아이콘 조회 가능) */
export function faviconUrlForDomain(domain: string, size = 32): string {
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=${size}`;
}

function MailIcon({ className }: { className?: string }) {
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
      <rect width="20" height="16" x="2" y="4" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  );
}

type FaviconBadgeProps = {
  /** 예: www.saramin.co.kr — 없으면 메일 아이콘 또는 이니셜 */
  domain?: string;
  /** 접근성·이니셜 폴백용 */
  label: string;
  /** 'mail': 도메인 없을 때 봉투 아이콘 / 'initial': 첫 글자 */
  fallback?: "mail" | "initial";
  className?: string;
};

/**
 * 외부 파비콘 로드 실패 시 이니셜 또는 메일 아이콘으로 대체합니다.
 */
export function FaviconBadge({
  domain,
  label,
  fallback = "initial",
  className = "",
}: FaviconBadgeProps) {
  const [failed, setFailed] = useState(false);

  const base =
    "inline-flex h-6 w-6 shrink-0 items-center justify-center overflow-hidden rounded-md border border-slate-200/80 bg-white";

  if (!domain || failed) {
    if (fallback === "mail") {
      return (
        <span
          className={`${base} text-slate-500 ${className}`}
          title={label}
          aria-hidden
        >
          <MailIcon className="h-3.5 w-3.5" />
        </span>
      );
    }
    return (
      <span
        className={`${base} bg-slate-100 text-[11px] font-bold text-slate-600 ${className}`}
        title={label}
        aria-hidden
      >
        {label.slice(0, 1)}
      </span>
    );
  }

  return (
    <img
      src={faviconUrlForDomain(domain)}
      alt=""
      width={24}
      height={24}
      loading="lazy"
      decoding="async"
      className={`${base} object-contain p-0.5 ${className}`}
      onError={() => setFailed(true)}
    />
  );
}
