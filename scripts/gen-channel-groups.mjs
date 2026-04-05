/**
 * Reads data/channels.tsv (tab-separated, UTF-8) and prints TypeScript
 * and writes src/generatedDefaultChannelGroups.ts.
 *
 * Columns: ID, 채널명, 매체명, utm_source, utm_medium, URL
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const tsvPath = path.join(__dirname, "..", "data", "channels.tsv");
const outPath = path.join(__dirname, "..", "src", "generatedDefaultChannelGroups.ts");

const raw = fs.readFileSync(tsvPath, "utf8");
const lines = raw.split(/\r?\n/).filter((l) => l.trim().length > 0);
const header = lines[0];
if (!header.includes("utm_source")) {
  console.error("Expected header with utm_source in", tsvPath);
  process.exit(1);
}

const rows = [];
for (let i = 1; i < lines.length; i++) {
  const parts = lines[i].split("\t");
  const id = (parts[0] ?? "").trim();
  const channelName = (parts[1] ?? "").trim();
  const productName = (parts[2] ?? "").trim();
  const utm_source = (parts[3] ?? "").trim();
  const utm_medium = (parts[4] ?? "").trim();
  const url = (parts[5] ?? "").trim();
  if (!id || !channelName || !productName || !utm_source) {
    console.error("Bad row", i + 1, lines[i]);
    process.exit(1);
  }
  rows.push({
    id,
    channelName,
    productName,
    utm_source,
    utm_medium,
    url,
  });
}

/** @type {Map<string, typeof rows>} */
const byChannel = new Map();
for (const r of rows) {
  if (!byChannel.has(r.channelName)) byChannel.set(r.channelName, []);
  byChannel.get(r.channelName).push(r);
}

/** 좌측 채널 목록 표시 순서 (운영 기준) */
const CHANNEL_LABEL_ORDER = [
  "사람인",
  "잡코리아",
  "캐치",
  "자소설닷컴",
  "커리어톡",
  "구글",
  "인스타그램",
  "메타",
  "링크드인",
  "카카오톡",
  "스펙업",
  "에브리타임",
  "스누라이프",
  "세연넷",
  "노크",
  "고파스",
  "카대전",
  "포공채널",
  "서담",
  "위한",
  "이화이언",
  "리멤버",
  "블라인드",
  "잡플래닛",
  "원티드",
  "네이버",
  "토스",
  "당근",
  "링커리어",
  "캠퍼스픽",
  "슥삭",
  "아웃캠퍼스",
  "요즘것들",
  "대티즌",
  "올콘",
  "씽굿",
  "위비티",
  "부트텐트",
  "렛플",
  "프로그래머스",
  "OKKY",
  "게임잡",
  "백준",
  "하이브레인넷",
  "김박사넷",
  "가방끈",
  "피플앤잡",
  "슈퍼루키",
  "디맨드",
  "알바몬",
  "건설워커",
  "노트폴리오",
  "라우드소싱",
];

function channelOrderIndex(label) {
  const i = CHANNEL_LABEL_ORDER.indexOf(label);
  return i === -1 ? 10_000 : i;
}

const order = [...byChannel.keys()].sort((a, b) => {
  const da = channelOrderIndex(a);
  const db = channelOrderIndex(b);
  if (da !== db) return da - db;
  return a.localeCompare(b, "ko");
});

const usedGroupIds = new Set();
function makeGroupId(firstSource, channelLabel) {
  let base = firstSource.replace(/[^a-z0-9]/gi, "_").replace(/_+/g, "_");
  if (!base) base = "channel";
  if (!usedGroupIds.has(base)) {
    usedGroupIds.add(base);
    return base;
  }
  let n = 2;
  while (usedGroupIds.has(`${base}_${n}`)) n++;
  const id = `${base}_${n}`;
  usedGroupIds.add(id);
  return id;
}

function faviconHost(urlStr) {
  try {
    const u = new URL(urlStr);
    return u.hostname || undefined;
  } catch {
    return undefined;
  }
}

function esc(s) {
  return JSON.stringify(s);
}

const groups = [];
for (const channelName of order) {
  const list = byChannel.get(channelName);
  const gid = makeGroupId(list[0].utm_source, channelName);
  const host = faviconHost(list[0].url);
  const children = list.map((r) => {
    const parts = [
      `id: ${esc(r.id)}`,
      `label: ${esc(r.productName)}`,
      `utm_source: ${esc(r.utm_source)}`,
      `utm_medium: ${esc(r.utm_medium)}`,
    ];
    return `      { ${parts.join(", ")} }`;
  });
  const faviconLine = host ? `    faviconDomain: ${esc(host)},\n` : "";
  const groupBlock = `  {\n    id: ${esc(gid)},\n    label: ${esc(channelName)},\n${faviconLine}    children: [\n${children.join(",\n")},\n    ],\n  }`;
  groups.push(groupBlock);
}

const ts = `/**\n * Auto-generated from data/channels.tsv — do not edit by hand.\n * Regenerate: npm run gen:channels\n */\n\nexport const GENERATED_DEFAULT_CHANNEL_GROUPS = [\n${groups.join(",\n")},\n] as const;\n`;
fs.writeFileSync(outPath, ts, "utf8");
console.error("Wrote", outPath, `(${groups.length} groups)`);
