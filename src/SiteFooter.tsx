/** 배포·수정 시 날짜를 맞춰 주세요. */
const LAST_UPDATED_LABEL = "2026년 3월 31일";

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

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-slate-200 bg-slate-100/90 py-6 text-center text-xs text-slate-500">
      <p className="text-slate-500">최종 수정일 {LAST_UPDATED_LABEL}</p>
      <p className="mt-2">
        <a
          href="mailto:sgpark00@nhr.kr"
          className="inline-flex items-center justify-center gap-1.5 text-sky-800 underline-offset-2 hover:underline"
        >
          <MailIcon className="h-4 w-4 shrink-0" />
          <span>sgpark00@nhr.kr</span>
        </a>
      </p>
    </footer>
  );
}
