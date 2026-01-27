import { describe, expect, it } from "vitest";
import { validateHeaders } from "../lib/csv/validation";

describe("validateHeaders", () => {
  it("accepts exact headers with whitespace trimming", () => {
    const actual = [" Manufacturer ", "StkNo", "Band A"];
    const expected = ["Manufacturer", "StkNo", "Band A"];
    const result = validateHeaders(actual, expected);
    expect(result.ok).toBe(true);
  });

  it("rejects header mismatch", () => {
    const actual = ["Manufacturer", "StockNo", "Band A"];
    const expected = ["Manufacturer", "StkNo", "Band A"];
    const result = validateHeaders(actual, expected);
    expect(result.ok).toBe(false);
  });
});
