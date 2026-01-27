import { stringify } from "csv-stringify/sync";

export function normalizeHeader(header: string) {
  return header.replace(/^\uFEFF/, "").trim();
}

export function validateHeaders(actual: string[], expected: string[]) {
  const normalizedActual = actual.map(normalizeHeader);
  const normalizedExpected = expected.map(normalizeHeader);

  if (normalizedActual.length !== normalizedExpected.length) {
    return {
      ok: false,
      message: `Expected ${normalizedExpected.length} columns, received ${normalizedActual.length}.`
    };
  }

  for (let i = 0; i < normalizedExpected.length; i += 1) {
    if (normalizedActual[i] !== normalizedExpected[i]) {
      return {
        ok: false,
        message: `Header mismatch at column ${i + 1}: expected "${normalizedExpected[i]}", received "${normalizedActual[i]}".`
      };
    }
  }

  return { ok: true };
}

export function buildErrorCsv(headers: string[], rows: Record<string, string>[], errorKey = "error_reason") {
  const outputRows = rows.map((row) => ({ ...row }));
  return stringify(outputRows, {
    header: true,
    columns: [...headers, errorKey]
  });
}
