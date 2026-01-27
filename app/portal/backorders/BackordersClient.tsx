"use client";

import { useMemo, useState } from "react";
import ArrowUpDown from "lucide-react/dist/esm/icons/arrow-up-down";
import Boxes from "lucide-react/dist/esm/icons/boxes";
import Hash from "lucide-react/dist/esm/icons/hash";
import BadgeDollarSign from "lucide-react/dist/esm/icons/badge-dollar-sign";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatMoney } from "@/lib/format";

type BackorderRow = {
  id: string;
  part: string;
  description: string | null;
  yourOrderNo: string | null;
  qOrd: number | null;
  lineValue: string | null;
};

type BackordersClientProps = {
  backorders: BackorderRow[];
};

export function BackordersClient({ backorders }: BackordersClientProps) {
  const [sortKey, setSortKey] = useState<"part" | "order" | "qty" | "value">("part");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const sortedBackorders = useMemo(() => {
    const sorted = [...backorders];
    sorted.sort((a, b) => {
      let comparison = 0;
      switch (sortKey) {
        case "order":
          comparison = (a.yourOrderNo ?? "").localeCompare(b.yourOrderNo ?? "");
          break;
        case "qty":
          comparison = (a.qOrd ?? 0) - (b.qOrd ?? 0);
          break;
        case "value":
          comparison = Number(a.lineValue ?? 0) - Number(b.lineValue ?? 0);
          break;
        case "part":
        default:
          comparison = a.part.localeCompare(b.part);
          break;
      }
      return sortDir === "asc" ? comparison : -comparison;
    });
    return sorted;
  }, [backorders, sortDir, sortKey]);

  const toggleSort = (key: typeof sortKey) => {
    if (key === sortKey) {
      setSortDir((dir) => (dir === "asc" ? "desc" : "asc"));
      return;
    }
    setSortKey(key);
    setSortDir(key === "qty" || key === "value" ? "desc" : "asc");
  };

  const sortLabel = (key: typeof sortKey) =>
    sortKey === key ? (sortDir === "asc" ? "↑" : "↓") : "";

  const summary = useMemo(() => {
    const totals = {
      count: backorders.length,
      qty: 0,
      value: 0
    };
    backorders.forEach((row) => {
      totals.qty += row.qOrd ?? 0;
      totals.value += row.lineValue ? Number(row.lineValue) : 0;
    });
    return totals;
  }, [backorders]);

  return (
    <div className="space-y-8">
      <div className="rounded-3xl border border-surface-200 bg-white px-7 py-7 shadow-soft">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-600">Dealer Portal</p>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-5">
          <div>
            <h2 className="text-3xl font-extrabold text-brand-950">Backorder Pulse</h2>
            <p className="mt-2 text-sm text-brand-700">
              Review backordered parts, quantities, and line values.
            </p>
          </div>
          <Button asChild variant="accent">
            <a href="/api/backorders/export">Download CSV</a>
          </Button>
        </div>
        <div className="mt-5 flex flex-wrap gap-3">
          <div className="rounded-2xl border border-surface-200 bg-[#EEF4FF] px-4 py-3">
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-[#335C99]">
              <Boxes className="h-4 w-4" />
              Orders
            </div>
            <p className="mt-1 text-lg font-semibold text-brand-950">{summary.count}</p>
          </div>
          <div className="rounded-2xl border border-surface-200 bg-[#ECFDF3] px-4 py-3">
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-[#16794C]">
              <Hash className="h-4 w-4" />
              Quantity
            </div>
            <p className="mt-1 text-lg font-semibold text-brand-950">{summary.qty}</p>
          </div>
          <div className="rounded-2xl border border-surface-200 bg-[#FFF7ED] px-4 py-3">
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-[#B45309]">
              <BadgeDollarSign className="h-4 w-4" />
              Price
            </div>
            <p className="mt-1 text-lg font-semibold text-brand-950">
              {summary.value ? formatMoney(summary.value) : "£0.00"}
            </p>
          </div>
        </div>
      </div>

      <Card className="border border-surface-200 bg-white shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle>Recent updates</CardTitle>
        </CardHeader>
        <CardContent>
          {backorders.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-surface-200 bg-surface-50 p-6 text-center text-brand-700">
              No order status updates on record.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <button
                      type="button"
                      onClick={() => toggleSort("part")}
                      className="inline-flex items-center gap-2 text-brand-700 hover:text-brand-900"
                    >
                      Part
                      <ArrowUpDown className="h-3.5 w-3.5" />
                      <span className="text-xs">{sortLabel("part")}</span>
                    </button>
                  </TableHead>
                  <TableHead>
                    <button
                      type="button"
                      onClick={() => toggleSort("order")}
                      className="inline-flex items-center gap-2 text-brand-700 hover:text-brand-900"
                    >
                      Order No
                      <ArrowUpDown className="h-3.5 w-3.5" />
                      <span className="text-xs">{sortLabel("order")}</span>
                    </button>
                  </TableHead>
                  <TableHead>
                    <button
                      type="button"
                      onClick={() => toggleSort("qty")}
                      className="inline-flex items-center gap-2 text-brand-700 hover:text-brand-900"
                    >
                      Qty
                      <ArrowUpDown className="h-3.5 w-3.5" />
                      <span className="text-xs">{sortLabel("qty")}</span>
                    </button>
                  </TableHead>
                  <TableHead className="text-right">
                    <button
                      type="button"
                      onClick={() => toggleSort("value")}
                      className="inline-flex items-center justify-end gap-2 text-brand-700 hover:text-brand-900"
                    >
                      Line value
                      <ArrowUpDown className="h-3.5 w-3.5" />
                      <span className="text-xs">{sortLabel("value")}</span>
                    </button>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedBackorders.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>
                      <p className="font-semibold text-brand-950">{row.part}</p>
                      <p className="text-xs text-brand-600">{row.description}</p>
                    </TableCell>
                    <TableCell className="text-brand-700">{row.yourOrderNo ?? "-"}</TableCell>
                    <TableCell className="font-semibold text-brand-900">{row.qOrd ?? 0}</TableCell>
                    <TableCell className="text-right font-semibold text-brand-900">
                      {row.lineValue ? formatMoney(row.lineValue) : "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
