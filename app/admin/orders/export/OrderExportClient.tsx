"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Search from "lucide-react/dist/esm/icons/search";
import { AdminContentContainer } from "@/components/layout/AdminContentContainer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pagination, PaginationContent, PaginationItem, PaginationLink } from "@/components/ui/pagination";
import { Select } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type OrderRow = {
  id: string;
  orderNumber: string;
  dealerAccountNo: string;
  dealerName: string;
  itemCount: number;
  totalAmount: string;
  currency: string;
  status: string;
  createdAt: string;
};

type OrdersResponse = {
  data: OrderRow[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

const pageSize = 20;
const statusOptions = [
  { value: "PENDING", label: "Pending" },
  { value: "ON_HOLD", label: "On Hold" },
  { value: "SUSPENDED", label: "Suspended" },
  { value: "PROCESSING", label: "Processing" },
  { value: "SHIPPED", label: "Shipped" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" },
  { value: "ALL", label: "All Statuses" }
];

export function OrderExportClient() {
  const [query, setQuery] = useState("");
  const [appliedQuery, setAppliedQuery] = useState("");
  const [status, setStatus] = useState("PENDING");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [meta, setMeta] = useState({ total: 0, totalPages: 1 });

  useEffect(() => {
    setPage(1);
  }, [appliedQuery, status]);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({
      query: appliedQuery,
      status,
      page: String(page),
      pageSize: String(pageSize)
    });
    const res = await fetch(`/api/admin/orders?${params.toString()}`);
    if (res.ok) {
      const data = (await res.json()) as OrdersResponse;
      setOrders(data.data);
      setMeta({ total: data.total, totalPages: data.totalPages });
    }
    setLoading(false);
  }, [appliedQuery, status, page]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const applySearch = useCallback(() => {
    const nextQuery = query.trim();
    setPage(1);
    setAppliedQuery(nextQuery);
    if (nextQuery === appliedQuery && page === 1) {
      fetchOrders();
    }
  }, [query, appliedQuery, page, fetchOrders]);

  const pages = useMemo(() => {
    const total = meta.totalPages;
    if (total <= 7) {
      return Array.from({ length: total }, (_, index) => index + 1);
    }
    const start = Math.max(1, page - 2);
    const end = Math.min(total, page + 2);
    const pagesSet = new Set([1, total]);
    for (let idx = start; idx <= end; idx += 1) {
      pagesSet.add(idx);
    }
    return Array.from(pagesSet).sort((a, b) => a - b);
  }, [meta.totalPages, page]);

  const statusVariant = (value: string) => {
    if (value === "ON_HOLD" || value === "SUSPENDED") return "warning";
    if (value === "PROCESSING") return "default";
    if (value === "SHIPPED" || value === "COMPLETED") return "success";
    if (value === "CANCELLED") return "danger";
    return "default";
  };

  return (
    <AdminContentContainer>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-semibold">Order export</h2>
        </div>

        <div className="sticky top-24 z-10 flex flex-nowrap items-center gap-3 overflow-x-auto rounded-2xl border border-surface-200 bg-white/95 px-4 py-2 shadow-soft backdrop-blur">
          <div className="relative min-w-[280px] flex-[1_1_62%]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-700" />
            <Input
              placeholder="Search by order number, account, or dealer"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  applySearch();
                }
              }}
              className="h-10 pl-9 text-[13px]"
            />
          </div>
          <Select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            className="h-10 w-[160px] shrink-0 text-[13px]"
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
          <Button type="button" variant="outline" className="ml-auto h-10 shrink-0" onClick={applySearch}>
            Search
          </Button>
          <Button asChild variant="accent" className="h-10 shrink-0">
            <a href="/api/admin/orders/export">Download CSV</a>
          </Button>
        </div>

        <div className="rounded-2xl border border-surface-200 bg-white shadow-soft overflow-hidden">
          <Table wrapperClassName="h-[62vh] overflow-y-auto">
            <TableHeader className="sticky top-0 z-10 bg-white">
              <TableRow className="bg-white">
                <TableHead className="py-2 min-w-[160px]">Order No</TableHead>
                <TableHead className="py-2 min-w-[160px]">Dealer</TableHead>
                <TableHead className="py-2 min-w-[140px]">Account No</TableHead>
                <TableHead className="py-2">Items</TableHead>
                <TableHead className="py-2">Total</TableHead>
                <TableHead className="py-2">Status</TableHead>
                <TableHead className="py-2">Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-6 text-center text-sm text-brand-700">
                    Loading orders...
                  </TableCell>
                </TableRow>
              ) : orders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-6 text-center text-sm text-brand-700">
                    No orders found.
                  </TableCell>
                </TableRow>
              ) : (
                orders.map((order) => (
                  <TableRow key={order.id} className="hover:bg-surface-50">
                    <TableCell className="py-2 text-[13px] font-semibold">{order.orderNumber}</TableCell>
                    <TableCell className="py-2 text-[13px]">{order.dealerName}</TableCell>
                    <TableCell className="py-2 text-[13px]">{order.dealerAccountNo}</TableCell>
                    <TableCell className="py-2 text-[13px]">{order.itemCount}</TableCell>
                    <TableCell className="py-2 text-[13px]">
                      {order.currency} {order.totalAmount}
                    </TableCell>
                    <TableCell className="py-2 text-[13px]">
                      <Badge variant={statusVariant(order.status)}>{order.status}</Badge>
                    </TableCell>
                    <TableCell className="py-2 text-[13px]">
                      {new Intl.DateTimeFormat("en-GB", { dateStyle: "medium" }).format(
                        new Date(order.createdAt)
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex items-center justify-between gap-4">
          <p className="text-sm text-brand-700">
            {meta.total} records · Page {page} of {meta.totalPages}
          </p>
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationLink onClick={() => setPage((prev) => Math.max(1, prev - 1))} disabled={page === 1}>
                  Prev
                </PaginationLink>
              </PaginationItem>
              {pages.map((pageNumber) => (
                <PaginationItem key={pageNumber}>
                  <PaginationLink onClick={() => setPage(pageNumber)} isActive={pageNumber === page}>
                    {pageNumber}
                  </PaginationLink>
                </PaginationItem>
              ))}
              <PaginationItem>
                <PaginationLink
                  onClick={() => setPage((prev) => Math.min(meta.totalPages, prev + 1))}
                  disabled={page === meta.totalPages}
                >
                  Next
                </PaginationLink>
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      </div>
    </AdminContentContainer>
  );
}
