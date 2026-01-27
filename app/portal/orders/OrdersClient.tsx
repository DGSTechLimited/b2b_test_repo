"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import ArrowUpDown from "lucide-react/dist/esm/icons/arrow-up-down";
import Clock from "lucide-react/dist/esm/icons/clock";
import Loader from "lucide-react/dist/esm/icons/loader";
import Truck from "lucide-react/dist/esm/icons/truck";
import CheckCircle2 from "lucide-react/dist/esm/icons/check-circle-2";
import Download from "lucide-react/dist/esm/icons/download";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/components/ui/toast";
import { formatMoney } from "@/lib/format";

type OrderRow = {
  id: string;
  orderNumber: string;
  createdAtLabel: string;
  createdAt: string;
  status: string;
  totalAmount: string;
};

type OrdersClientProps = {
  orders: OrderRow[];
};

export function OrdersClient({ orders }: OrdersClientProps) {
  const { toast } = useToast();
  const [sortKey, setSortKey] = useState<"orderNumber" | "createdAt" | "status" | "totalAmount">(
    "createdAt"
  );
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [downloading, setDownloading] = useState<"csv" | "xlsx" | null>(null);

  const sortedOrders = useMemo(() => {
    const sorted = [...orders];
    sorted.sort((a, b) => {
      let comparison = 0;
      switch (sortKey) {
        case "orderNumber":
          comparison = a.orderNumber.localeCompare(b.orderNumber);
          break;
        case "status":
          comparison = a.status.localeCompare(b.status);
          break;
        case "totalAmount":
          comparison = Number(a.totalAmount) - Number(b.totalAmount);
          break;
        case "createdAt":
        default:
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
      }
      return sortDir === "asc" ? comparison : -comparison;
    });
    return sorted;
  }, [orders, sortDir, sortKey]);

  const toggleSort = (key: typeof sortKey) => {
    if (key === sortKey) {
      setSortDir((dir) => (dir === "asc" ? "desc" : "asc"));
      return;
    }
    setSortKey(key);
    setSortDir(key === "createdAt" || key === "totalAmount" ? "desc" : "asc");
  };

  const sortLabel = (key: typeof sortKey) =>
    sortKey === key ? (sortDir === "asc" ? "↑" : "↓") : "";

  const stats = useMemo(() => {
    const summary = {
      onHold: 0,
      processing: 0,
      shipped: 0,
      completed: 0
    };
    orders.forEach((order) => {
      switch (order.status) {
        case "ON_HOLD":
        case "SUSPENDED":
          summary.onHold += 1;
          break;
        case "PROCESSING":
          summary.processing += 1;
          break;
        case "SHIPPED":
          summary.shipped += 1;
          break;
        case "COMPLETED":
          summary.completed += 1;
          break;
        default:
          break;
      }
    });
    return summary;
  }, [orders]);

  const handleDownload = async (format: "csv" | "xlsx") => {
    setDownloading(format);
    try {
      const res = await fetch(`/api/orders/export?format=${format}`);
      if (!res.ok) {
        throw new Error("download_failed");
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = format === "csv" ? "orders.csv" : "orders.xlsx";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      toast({ title: "Failed to download orders. Please try again", variant: "error" });
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div className="space-y-8">
      <div className="rounded-3xl border border-surface-200 bg-white px-7 py-7 shadow-soft">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-600">Dealer Portal</p>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-5">
          <div>
            <h2 className="text-3xl font-extrabold text-brand-950">Order Radar</h2>
            <p className="mt-2 text-sm text-brand-700">
              Monitor what’s in flight, what’s on hold, and what’s completed.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <div className="rounded-2xl border border-surface-200 bg-[#FFF7ED] px-4 py-3">
              <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-[#B45309]">
                <Clock className="h-4 w-4" />
                On Hold
              </div>
              <p className="mt-1 text-lg font-semibold text-brand-950">{stats.onHold}</p>
            </div>
            <div className="rounded-2xl border border-surface-200 bg-[#EEF2FF] px-4 py-3">
              <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-[#4338CA]">
                <Loader className="h-4 w-4" />
                Processing
              </div>
              <p className="mt-1 text-lg font-semibold text-brand-950">{stats.processing}</p>
            </div>
            <div className="rounded-2xl border border-surface-200 bg-[#ECFDF3] px-4 py-3">
              <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-[#16794C]">
                <Truck className="h-4 w-4" />
                Shipped
              </div>
              <p className="mt-1 text-lg font-semibold text-brand-950">{stats.shipped}</p>
            </div>
            <div className="rounded-2xl border border-surface-200 bg-[#F5F3FF] px-4 py-3">
              <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-[#6D28D9]">
                <CheckCircle2 className="h-4 w-4" />
                Completed
              </div>
              <p className="mt-1 text-lg font-semibold text-brand-950">{stats.completed}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_260px]">
        <Card className="border border-surface-200 bg-white shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between gap-4 pb-4">
            <CardTitle>Order History</CardTitle>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className="h-10 gap-2 border-[#0b4395]"
                  disabled={downloading !== null}
                >
                  <Download className="h-4 w-4 " />
                  {downloading ? "Preparing..." : "Download"}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={() => handleDownload("csv")}>
                  Download CSV
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => handleDownload("xlsx")}>
                  Download XLSX
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </CardHeader>
          <CardContent>
            {orders.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-surface-200 bg-surface-50 p-6 text-center">
                <p className="text-brand-700">No orders yet.</p>
                <Button asChild variant="accent" className="mt-4">
                  <Link href="/portal/parts">Start ordering</Link>
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      <button
                        type="button"
                        onClick={() => toggleSort("orderNumber")}
                        className="inline-flex items-center gap-2 text-brand-700 hover:text-brand-900"
                      >
                        Order
                        <ArrowUpDown className="h-3.5 w-3.5" />
                        <span className="text-xs">{sortLabel("orderNumber")}</span>
                      </button>
                    </TableHead>
                    <TableHead>
                      <button
                        type="button"
                        onClick={() => toggleSort("createdAt")}
                        className="inline-flex items-center gap-2 text-brand-700 hover:text-brand-900"
                      >
                        Date
                        <ArrowUpDown className="h-3.5 w-3.5" />
                        <span className="text-xs">{sortLabel("createdAt")}</span>
                      </button>
                    </TableHead>
                    <TableHead>
                      <button
                        type="button"
                        onClick={() => toggleSort("status")}
                        className="inline-flex items-center gap-2 text-brand-700 hover:text-brand-900"
                      >
                        Status
                        <ArrowUpDown className="h-3.5 w-3.5" />
                        <span className="text-xs">{sortLabel("status")}</span>
                      </button>
                    </TableHead>
                    <TableHead className="text-right">
                      <button
                        type="button"
                        onClick={() => toggleSort("totalAmount")}
                        className="inline-flex items-center justify-end gap-2 text-brand-700 hover:text-brand-900"
                      >
                        Total
                        <ArrowUpDown className="h-3.5 w-3.5" />
                        <span className="text-xs">{sortLabel("totalAmount")}</span>
                      </button>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedOrders.map((order) => (
                    <TableRow key={order.id} className="hover:bg-surface-50">
                      <TableCell>
                        <Link
                          href={`/portal/orders/${order.id}`}
                          className="font-semibold text-brand-950 hover:text-accent-600"
                        >
                          {order.orderNumber}
                        </Link>
                      </TableCell>
                      <TableCell className="text-brand-700">{order.createdAtLabel}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusVariant(order.status)}>{order.status}</Badge>
                      </TableCell>
                      <TableCell className="text-right font-semibold text-brand-900">
                        {formatMoney(order.totalAmount)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <div className="space-y-4 lg:sticky lg:top-32">
          <Card className="border border-surface-200 bg-white shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button asChild variant="accent" className="w-full">
                <Link href="/portal/parts">New order</Link>
              </Button>
              <Button asChild variant="outline" className="w-full">
                <Link href="/portal/backorders">View backorders</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function getStatusVariant(status: string) {
  switch (status) {
    case "PROCESSING":
      return "accent" as const;
    case "PENDING":
    case "SHIPPED":
    case "COMPLETED":
      return "success" as const;
    case "ON_HOLD":
    case "SUSPENDED":
      return "warning" as const;
    case "CANCELLED":
      return "danger" as const;
    default:
      return "neutral" as const;
  }
}
