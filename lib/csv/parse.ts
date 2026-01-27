import { parse } from "csv-parse/sync";
import { normalizeHeader } from "./validation";

export type ParsedCsv = {
  headers: string[];
  rows: Record<string, string>[];
};

export function parseCsv(input: string): ParsedCsv {
  const records = parse(input, {
    columns: (headers) => headers.map(normalizeHeader),
    skip_empty_lines: true,
    trim: false
  }) as Record<string, string>[];

  const headers = records.length > 0 ? Object.keys(records[0]) : [];
  return { headers, rows: records };
}
