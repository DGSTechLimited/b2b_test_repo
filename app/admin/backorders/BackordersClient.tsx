"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Search from "lucide-react/dist/esm/icons/search";
import UploadCloud from "lucide-react/dist/esm/icons/upload-cloud";
import { AdminContentContainer } from "@/components/layout/AdminContentContainer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/components/ui/toast";

type BackordersClientProps = {
  onUpload: (formData: FormData) => Promise<void>;
};

type OrderStatusRow = {
  id: string;
  accountNo: string;
  orderNumber: string;
  partNumber: string;
  orderedQty: number;
  fulfilledQty: number | null;
  backorderedQty: number | null;
  status: string;
  statusDate: string;
};

type PaginatedResponse<T> = {
  data: T[];
};

const statusOptions = [
  { value: "ALL", label: "All Statuses" },
  { value: "OPEN", label: "Open" },
  { value: "PARTIALLY_FULFILLED", label: "Partially Fulfilled" },
  { value: "BACKORDERED", label: "Backordered" },
  { value: "FULFILLED", label: "Fulfilled" },
  { value: "CANCELLED", label: "Cancelled" }
];

export function BackordersClient({ onUpload }: BackordersClientProps) {
  const { toast } = useToast();
  const [rows, setRows] = useState<OrderStatusRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const fetchRows = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/uploads/order-status?page=1&pageSize=50");
    if (res.ok) {
      const data = (await res.json()) as PaginatedResponse<OrderStatusRow>;
      setRows(data.data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchRows();
  }, [fetchRows]);

  const handleUpload = useCallback(
    async (formData: FormData) => {
      try {
        await onUpload(formData);
        toast({ title: "Uploaded successfully" });
        await fetchRows();
      } catch (error) {
        const message =
          error instanceof Error && error.message
            ? error.message
            : "Upload failed. Please try again";
        toast({ title: message, variant: "error" });
      }
    },
    [fetchRows, onUpload, toast]
  );

  const filteredRows = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return rows.filter((row) => {
      const matchesQuery =
        !normalizedQuery ||
        [row.accountNo, row.orderNumber, row.partNumber]
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery);
      const matchesStatus = statusFilter === "ALL" || row.status === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [query, rows, statusFilter]);

  return (
    <AdminContentContainer>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-semibold">Backorders</h2>
          <p className="mt-1 text-sm text-brand-700">
            Upload order status updates to sync fulfilled and backordered quantities.
          </p>
        </div>

        <div className="rounded-2xl border border-surface-200 bg-surface-50/80 px-4 py-4 shadow-soft">
          <form
            action={handleUpload}
            encType="multipart/form-data"
            className="flex flex-col gap-3 md:flex-row md:items-center"
          >
            <div className="flex items-center gap-2 text-sm font-semibold text-brand-800">
              <UploadCloud className="h-4 w-4 text-accent-600" />
              Upload CSV
            </div>
            <input
              type="file"
              name="file"
              accept=".csv"
              required
              className="w-full rounded-lg border border-surface-200 bg-white px-3 py-2 text-sm md:flex-1"
            />
            <Button type="submit" variant="accent" className="md:shrink-0">
              Upload
            </Button>
          </form>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <div className="relative min-w-[240px] flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-700" />
              <Input
                placeholder="Search by account, order, or part"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="h-10 pl-9 text-[13px]"
              />
            </div>
            <Select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="h-10 w-[180px] shrink-0 text-[13px]"
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-surface-200 bg-white shadow-soft">
          <Table wrapperClassName="h-[62vh] overflow-y-auto">
            <TableHeader className="sticky top-0 z-10 bg-surface-50">
              <TableRow className="bg-surface-50">
                <TableHead>Account No</TableHead>
                <TableHead>Order No</TableHead>
                <TableHead>Part No</TableHead>
                <TableHead>Ordered Qty</TableHead>
                <TableHead>Fulfilled Qty</TableHead>
                <TableHead>Backordered Qty</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Status Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-6 text-center text-brand-700">
                    Loading backorders...
                  </TableCell>
                </TableRow>
              ) : filteredRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-6 text-center text-brand-700">
                    No backorder records found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredRows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="py-2 text-[13px] font-semibold">{row.accountNo}</TableCell>
                    <TableCell className="py-2 text-[13px]">{row.orderNumber}</TableCell>
                    <TableCell className="py-2 text-[13px]">{row.partNumber}</TableCell>
                    <TableCell className="py-2 text-[13px]">{row.orderedQty}</TableCell>
                    <TableCell className="py-2 text-[13px]">{row.fulfilledQty ?? "-"}</TableCell>
                    <TableCell className="py-2 text-[13px]">{row.backorderedQty ?? "-"}</TableCell>
                    <TableCell className="py-2 text-[13px]">
                      <Badge
                        variant={
                          row.status === "FULFILLED"
                            ? "success"
                            : row.status === "BACKORDERED"
                              ? "warning"
                              : row.status === "PARTIALLY_FULFILLED"
                                ? "accent"
                                : row.status === "CANCELLED"
                                  ? "danger"
                                  : "neutral"
                        }
                      >
                        {row.status.split("_").join(" ")}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-2 text-[13px]">
                      {new Intl.DateTimeFormat("en-GB", { dateStyle: "medium" }).format(
                        new Date(row.statusDate)
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </AdminContentContainer>
  );
}
