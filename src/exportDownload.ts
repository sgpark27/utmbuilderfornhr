import * as XLSX from "xlsx";

export type UtmExportRow = {
  groupLabel: string;
  leafLabel: string;
  utm_source: string;
  utm_medium: string;
  utm_content: string;
  url: string;
};

export function downloadXlsx(rows: UtmExportRow[], filename: string): void {
  const data = rows.map((r) => ({
    대분류: r.groupLabel,
    소분류: r.leafLabel,
    utm_source: r.utm_source,
    utm_medium: r.utm_medium,
    utm_content: r.utm_content || "",
    URL: r.url,
  }));
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "UTM");
  XLSX.writeFile(wb, filename);
}

export function buildExportBasename(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `careerlink-utm_${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}`;
}
