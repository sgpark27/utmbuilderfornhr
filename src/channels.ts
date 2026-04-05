/**
 * 채용 채널 프리셋 — 기본 목록은 data/channels.tsv에서 생성됩니다.
 * 수정: data/channels.tsv 편집 후 `npm run gen:channels` 실행.
 * 대분류(채널명) → 소분류(매체명) 구조이며, source / medium은 시트 값을 그대로 씁니다.
 */
import { GENERATED_DEFAULT_CHANNEL_GROUPS } from "./generatedDefaultChannelGroups";

export type ChannelLeaf = {
  /** 전역 유일 ID (체크박스 value) */
  id: string;
  /** 소분류 표시명 (예: PC 배너) */
  label: string;
  utm_source: string;
  utm_medium: string;
  /** 동일 source/medium 내 세부 구분이 필요할 때 사용 */
  utm_content?: string;
};

export type ChannelGroup = {
  /** 대분류 ID */
  id: string;
  /** 대분류 표시명 (예: 사람인) */
  label: string;
  /**
   * 파비콘 표시용 도메인 (예: www.saramin.co.kr).
   * 공개 favicon 프록시로 조회합니다. 없으면 UI에서 메일 아이콘·이니셜 등으로 대체.
   */
  faviconDomain?: string;
  /** faviconDomain 없을 때 뱃지 스타일: mail(봉투) | initial(첫 글자) */
  faviconFallback?: "mail" | "initial";
  children: ChannelLeaf[];
};

/** 코드 기본값 — localStorage에 저장된 데이터가 없을 때 사용 */
export const DEFAULT_CHANNEL_GROUPS: ChannelGroup[] =
  GENERATED_DEFAULT_CHANNEL_GROUPS as unknown as ChannelGroup[];

export function countAllLeaves(groups: ChannelGroup[]): number {
  return groups.reduce((n, g) => n + g.children.length, 0);
}
