import { describe, expect, it } from "vitest";
import { detectSupersessionCycles } from "../lib/supersession";

describe("detectSupersessionCycles", () => {
  it("flags cycles introduced by incoming rows", () => {
    const existing = [
      { oldPartNo: "A", newPartNo: "B" },
      { oldPartNo: "B", newPartNo: "C" }
    ];
    const incoming = [
      { oldPartNo: "C", newPartNo: "A" },
      { oldPartNo: "D", newPartNo: "E" }
    ];

    const rejected = detectSupersessionCycles(existing, incoming);
    expect(rejected.has(0)).toBe(true);
    expect(rejected.has(1)).toBe(false);
  });
});
