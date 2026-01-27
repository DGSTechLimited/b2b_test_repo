"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Search from "lucide-react/dist/esm/icons/search";
import UploadCloud from "lucide-react/dist/esm/icons/upload-cloud";
import { AdminContentContainer } from "@/components/layout/AdminContentContainer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pagination, PaginationContent, PaginationItem, PaginationLink } from "@/components/ui/pagination";
import { Select } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/components/ui/toast";

type UploadsClientProps = {
  onUploadPartsAftermarket: (formData: FormData) => Promise<void>;
  onUploadPartsGenuine: (formData: FormData) => Promise<void>;
  onUploadOrderStatus: (formData: FormData) => Promise<void>;
  onUploadSupersession: (formData: FormData) => Promise<void>;
};

type PartRow = {
  id: string;
  stkNo: string;
  description: string | null;
  supplier: string | null;
  brand: string | null;
  freeStock: number;
  bandA: string;
  bandB: string;
  bandC: string;
  bandD: string;
  bandE: string;
  bandF: string;
  isActive: boolean;
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

type SupersessionRow = {
  id: string;
  oldPartNo: string;
  newPartNo: string;
  effectiveDate: string | null;
  status: string;
};

type PaginatedResponse<T> = {
  data: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

const tabs = [
  { key: "AFTERMARKET", label: "Parts (Aftermarket)" },
  { key: "GENUINE", label: "Parts (Genuine)" },
  { key: "BRANDED", label: "Parts (Branded)" },
  { key: "ORDER_STATUS", label: "Order Status" },
  { key: "SUPERSESSION", label: "Supersession" }
] as const;

export function UploadsClient({
  onUploadPartsAftermarket,
  onUploadPartsGenuine,
  onUploadOrderStatus,
  onUploadSupersession
}: UploadsClientProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]["key"]>("AFTERMARKET");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [parts, setParts] = useState<PartRow[]>([]);
  const [orderStatuses, setOrderStatuses] = useState<OrderStatusRow[]>([]);
  const [supersessions, setSupersessions] = useState<SupersessionRow[]>([]);
  const [meta, setMeta] = useState({ total: 0, totalPages: 1 });
  const [searchQuery, setSearchQuery] = useState("");
  const [appliedQuery, setAppliedQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [supplierBrandFilter, setSupplierBrandFilter] = useState("ALL");

  useEffect(() => {
    setPage(1);
    setSearchQuery("");
    setAppliedQuery("");
    setStatusFilter("ALL");
    setSupplierBrandFilter("ALL");
  }, [activeTab]);

  useEffect(() => {
    setPage(1);
  }, [appliedQuery, statusFilter, supplierBrandFilter]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      if (activeTab === "AFTERMARKET" || activeTab === "GENUINE" || activeTab === "BRANDED") {
        const res = await fetch(`/api/admin/uploads/parts?type=${activeTab}&page=${page}&pageSize=20`);
        if (res.ok) {
          const data = (await res.json()) as PaginatedResponse<PartRow>;
          setParts(data.data);
          setMeta({ total: data.total, totalPages: data.totalPages });
        }
      }
      if (activeTab === "ORDER_STATUS") {
        const res = await fetch(`/api/admin/uploads/order-status?page=${page}&pageSize=20`);
        if (res.ok) {
          const data = (await res.json()) as PaginatedResponse<OrderStatusRow>;
          setOrderStatuses(data.data);
          setMeta({ total: data.total, totalPages: data.totalPages });
        }
      }
      if (activeTab === "SUPERSESSION") {
        const res = await fetch(`/api/admin/uploads/supersession?page=${page}&pageSize=20`);
        if (res.ok) {
          const data = (await res.json()) as PaginatedResponse<SupersessionRow>;
          setSupersessions(data.data);
          setMeta({ total: data.total, totalPages: data.totalPages });
        }
      }
      setLoading(false);
    };
    fetchData();
  }, [activeTab, page]);

  const templateHref = useMemo(() => {
    switch (activeTab) {
      case "AFTERMARKET":
        return "/api/uploads/template?type=parts_aftermarket";
      case "GENUINE":
        return "/api/uploads/template?type=parts_genuine";
      case "ORDER_STATUS":
        return "/api/uploads/template?type=order_status";
      case "SUPERSESSION":
        return "/api/uploads/template?type=supersession";
      case "BRANDED":
        return "/api/uploads/template?type=parts_genuine";
      default:
        return "#";
    }
  }, [activeTab]);

  const uploadAction = useMemo(() => {
    switch (activeTab) {
      case "AFTERMARKET":
        return onUploadPartsAftermarket;
      case "GENUINE":
        return onUploadPartsGenuine;
      case "ORDER_STATUS":
        return onUploadOrderStatus;
      case "SUPERSESSION":
        return onUploadSupersession;
      case "BRANDED":
        return onUploadPartsGenuine;
      default:
        return onUploadPartsAftermarket;
    }
  }, [
    activeTab,
    onUploadOrderStatus,
    onUploadPartsAftermarket,
    onUploadPartsGenuine,
    onUploadSupersession
  ]);

  const handleUpload = useCallback(
    async (formData: FormData) => {
      try {
        await uploadAction(formData);
        toast({ title: "Uploaded successfully" });
      } catch (error) {
        const message =
          error instanceof Error && error.message
            ? error.message
            : "Upload failed. Please try again";
        toast({ title: message, variant: "error" });
      }
    },
    [toast, uploadAction]
  );

  const statusOptions = useMemo(() => {
    switch (activeTab) {
      case "ORDER_STATUS":
        return [
          { value: "ALL", label: "All Statuses" },
          { value: "OPEN", label: "Open" },
          { value: "PARTIALLY_FULFILLED", label: "Partially Fulfilled" },
          { value: "BACKORDERED", label: "Backordered" },
          { value: "FULFILLED", label: "Fulfilled" },
          { value: "CANCELLED", label: "Cancelled" }
        ];
      case "SUPERSESSION":
        return [
          { value: "ALL", label: "All Statuses" },
          { value: "ACTIVE", label: "Active" },
          { value: "PENDING", label: "Pending" }
        ];
      default:
        return [
          { value: "ALL", label: "All Statuses" },
          { value: "ACTIVE", label: "Active" },
          { value: "INACTIVE", label: "Inactive" }
        ];
    }
  }, [activeTab]);

  const supplierBrandOptions = useMemo(() => {
    if (activeTab !== "AFTERMARKET") {
      return [{ value: "ALL", label: "All Suppliers / Brands" }];
    }
    const options = new Set<string>();
    parts.forEach((row) => {
      const label = [row.supplier, row.brand].filter(Boolean).join(" · ");
      if (label) {
        options.add(label);
      }
    });
    return [
      { value: "ALL", label: "All Suppliers / Brands" },
      ...Array.from(options)
        .sort((a, b) => a.localeCompare(b))
        .map((label) => ({ value: label, label }))
    ];
  }, [activeTab, parts]);

  const applySearch = useCallback(() => {
    const nextQuery = searchQuery.trim();
    setAppliedQuery(nextQuery);
  }, [searchQuery]);

  const normalizedQuery = appliedQuery.trim().toLowerCase();

  const filteredParts = useMemo(() => {
    let rows = parts;
    if (normalizedQuery) {
      rows = rows.filter((row) => {
        const haystack = [row.stkNo, row.description ?? ""]
          .join(" ")
          .toLowerCase();
        return haystack.includes(normalizedQuery);
      });
    }
    if (statusFilter !== "ALL") {
      rows = rows.filter((row) => (statusFilter === "ACTIVE" ? row.isActive : !row.isActive));
    }
    if (supplierBrandFilter !== "ALL") {
      rows = rows.filter((row) => {
        const label = [row.supplier, row.brand].filter(Boolean).join(" · ");
        return label === supplierBrandFilter;
      });
    }
    return rows;
  }, [parts, normalizedQuery, statusFilter, supplierBrandFilter]);

  const filteredOrderStatuses = useMemo(() => {
    let rows = orderStatuses;
    if (normalizedQuery) {
      rows = rows.filter((row) => {
        const haystack = [row.accountNo, row.orderNumber, row.partNumber].join(" ").toLowerCase();
        return haystack.includes(normalizedQuery);
      });
    }
    if (statusFilter !== "ALL") {
      rows = rows.filter((row) => row.status.toUpperCase() === statusFilter);
    }
    return rows;
  }, [orderStatuses, normalizedQuery, statusFilter]);

  const filteredSupersessions = useMemo(() => {
    let rows = supersessions;
    if (normalizedQuery) {
      rows = rows.filter((row) => {
        const haystack = [row.oldPartNo, row.newPartNo].join(" ").toLowerCase();
        return haystack.includes(normalizedQuery);
      });
    }
    if (statusFilter !== "ALL") {
      rows = rows.filter((row) => row.status.toUpperCase() === statusFilter);
    }
    return rows;
  }, [supersessions, normalizedQuery, statusFilter]);

  const hasFilters =
    normalizedQuery !== "" || statusFilter !== "ALL" || supplierBrandFilter !== "ALL";

  const activeRowCount = useMemo(() => {
    switch (activeTab) {
      case "ORDER_STATUS":
        return filteredOrderStatuses.length;
      case "SUPERSESSION":
        return filteredSupersessions.length;
      default:
        return filteredParts.length;
    }
  }, [activeTab, filteredOrderStatuses.length, filteredParts.length, filteredSupersessions.length]);

  const displayedMeta = useMemo(() => {
    if (!hasFilters) {
      return { total: meta.total, totalPages: meta.totalPages, page };
    }
    const filteredTotal =
      activeTab === "ORDER_STATUS"
        ? filteredOrderStatuses.length
        : activeTab === "SUPERSESSION"
          ? filteredSupersessions.length
          : filteredParts.length;
    return { total: filteredTotal, totalPages: 1, page: 1 };
  }, [
    activeTab,
    filteredParts.length,
    filteredOrderStatuses.length,
    filteredSupersessions.length,
    hasFilters,
    meta.total,
    meta.totalPages,
    page
  ]);

  const pages = useMemo(() => {
    const total = displayedMeta.totalPages;
    if (total <= 7) {
      return Array.from({ length: total }, (_, index) => index + 1);
    }
    const start = Math.max(1, displayedMeta.page - 2);
    const end = Math.min(total, displayedMeta.page + 2);
    const pagesSet = new Set([1, total]);
    for (let idx = start; idx <= end; idx += 1) {
      pagesSet.add(idx);
    }
    return Array.from(pagesSet).sort((a, b) => a - b);
  }, [displayedMeta.page, displayedMeta.totalPages]);

  const columnCount = useMemo(() => {
    switch (activeTab) {
      case "ORDER_STATUS":
        return 8;
      case "SUPERSESSION":
        return 4;
      default:
        return 6;
    }
  }, [activeTab]);

  return (
    <AdminContentContainer>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-semibold">Maintain catalog feeds</h2>
        </div>

        <div className="pb-3">
          <div className="inline-flex w-fit flex-wrap gap-2 rounded-full border border-surface-200/70 bg-white/70 px-2 py-1">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  activeTab === tab.key
                    ? "bg-accent-600 text-white shadow-sm"
                    : "text-brand-700/80 hover:bg-surface-100"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {activeTab === "AFTERMARKET" ? (
          <div className="bg-surface-50/80 px-0 py-4">
            <div className="flex flex-col gap-6 md:flex-row md:items-stretch">
              <div className="flex h-full flex-1 rounded-2xl bg-surface-50/70 px-4 py-2.5 shadow-[0_6px_16px_-12px_rgba(15,23,42,0.35)]">
                <div className="flex flex-col gap-2">
                  <div className="relative w-full">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-700" />
                    <Input
                      placeholder="Search by part number, description"
                      value={searchQuery}
                      onChange={(event) => setSearchQuery(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          applySearch();
                        }
                      }}
                      className="h-10 pl-9 text-[13px]"
                    />
                  </div>
                  <div className="grid w-full items-center gap-2 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_120px]">
                    <Select
                      value={supplierBrandFilter}
                      onChange={(event) => setSupplierBrandFilter(event.target.value)}
                      className="h-10 w-full text-[13px]"
                    >
                      {supplierBrandOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </Select>
                    <Select
                      value={statusFilter}
                      onChange={(event) => setStatusFilter(event.target.value)}
                      className="h-10 w-full text-[13px]"
                    >
                      {statusOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </Select>
                    <Button
                      type="button"
                      variant="accent"
                      className="h-10 w-full justify-self-end px-6"
                      onClick={applySearch}
                    >
                      Search
                    </Button>
                  </div>
                </div>
              </div>

              <div className="w-full md:w-[520px] md:shrink-0">
                <form
                  action={handleUpload}
                  encType="multipart/form-data"
                  className="flex h-full w-full flex-col rounded-2xl bg-surface-50/70 px-4 py-2.5 shadow-[0_6px_16px_-12px_rgba(15,23,42,0.35)]"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-sm font-semibold text-brand-800">
                      <UploadCloud className="h-4 w-4 text-accent-600" />
                      Bulk upload
                    </div>
                    <a
                      href={templateHref}
                      className="text-xs font-semibold text-brand-700 transition hover:text-brand-900 hover:underline"
                    >
                      Download template
                    </a>
                  </div>
                  <div className="mt-2 flex flex-nowrap items-center gap-2">
                    <input
                      type="file"
                      name="file"
                      accept=".csv,.xlsx"
                      required
                      className="h-11 w-full min-w-[140px] rounded-lg border border-surface-200 bg-white px-3 text-sm leading-none file:mr-3 file:h-9 file:rounded-md file:border-0 file:bg-surface-100 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-brand-800 file:leading-none file:translate-y-[1px]"
                    />
                    <Button
                      type="submit"
                      variant="accent"
                      className="h-11 shrink-0 px-4"
                    >
                      Upload
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        ) : (
          <div className="border-b border-surface-200 bg-surface-50/80 px-0 py-4">
            <form
              action={handleUpload}
              encType="multipart/form-data"
              className="flex flex-col gap-3 md:flex-row md:items-center"
            >
              <Button asChild variant="ghost" className="md:shrink-0">
                <a href={templateHref}>Download template</a>
              </Button>
              <input
                type="file"
                name="file"
                accept=".csv,.xlsx"
                required
                className="w-full rounded-lg border border-surface-200 bg-white px-3 py-2 text-sm md:flex-1"
              />
              <Button type="submit" variant="accent" className="md:shrink-0">
                Upload
              </Button>
            </form>

            <div className="mt-3 flex flex-nowrap items-center gap-3 overflow-x-auto">
              <div className="relative min-w-[280px] flex-[1_1_62%]">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-700" />
                <Input
                  placeholder="Search by part number, description, supplier"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
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
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="h-10 w-[160px] shrink-0 text-[13px]"
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
              <Button type="button" variant="accent" className="ml-auto h-10 shrink-0" onClick={applySearch}>
                Search
              </Button>
            </div>
          </div>
        )}

        <div className="overflow-hidden rounded-2xl border border-surface-200 bg-white shadow-soft">
          <Table wrapperClassName="h-[62vh] overflow-y-auto">
            <TableHeader className="sticky top-0 z-10 bg-surface-50">
              <TableRow className="bg-surface-50">
                {activeTab === "ORDER_STATUS" ? (
                  <>
                    <TableHead>Account No</TableHead>
                    <TableHead>Order No</TableHead>
                    <TableHead>Part No</TableHead>
                    <TableHead>Ordered Qty</TableHead>
                    <TableHead>Fulfilled Qty</TableHead>
                    <TableHead>Backordered Qty</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Status Date</TableHead>
                  </>
                ) : activeTab === "SUPERSESSION" ? (
                  <>
                    <TableHead>Old Part</TableHead>
                    <TableHead>New Part</TableHead>
                    <TableHead>Effective Date</TableHead>
                    <TableHead>Status</TableHead>
                  </>
                ) : (
                  <>
                    <TableHead>Part Number</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Supplier / Brand</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead>Tier Prices</TableHead>
                    <TableHead>Status</TableHead>
                  </>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={columnCount} className="py-6 text-center text-brand-700">
                  Loading records...
                </TableCell>
              </TableRow>
            ) : activeRowCount === 0 ? (
              <TableRow>
                <TableCell colSpan={columnCount} className="py-6 text-center text-brand-700">
                  No records found.
                </TableCell>
              </TableRow>
            ) : activeTab === "ORDER_STATUS" ? (
              filteredOrderStatuses.map((row) => (
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
            ) : activeTab === "SUPERSESSION" ? (
              filteredSupersessions.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="py-2 text-[13px] font-semibold">{row.oldPartNo}</TableCell>
                  <TableCell className="py-2 text-[13px]">{row.newPartNo}</TableCell>
                  <TableCell className="py-2 text-[13px]">
                    {row.effectiveDate
                      ? new Intl.DateTimeFormat("en-GB", { dateStyle: "medium" }).format(
                          new Date(row.effectiveDate)
                        )
                      : "-"}
                  </TableCell>
                  <TableCell className="py-2 text-[13px]">
                    <Badge variant={row.status === "Active" ? "success" : "warning"}>{row.status}</Badge>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              filteredParts.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="py-2 text-[13px] font-semibold">{row.stkNo}</TableCell>
                  <TableCell className="py-2 text-[13px]">{row.description ?? "-"}</TableCell>
                  <TableCell className="py-2 text-[13px]">
                    <div className="flex flex-col">
                      <span>{row.supplier ?? "-"}</span>
                      <span className="text-xs text-brand-700">{row.brand ?? "-"}</span>
                    </div>
                  </TableCell>
                  <TableCell className="py-2 text-[13px]">{row.freeStock}</TableCell>
                  <TableCell className="py-2 text-[12px] text-brand-700">
                    A {row.bandA} · B {row.bandB} · C {row.bandC} · D {row.bandD} · E {row.bandE} · F {row.bandF}
                  </TableCell>
                  <TableCell className="py-2 text-[13px]">
                    <Badge variant={row.isActive ? "success" : "warning"}>
                      {row.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
            </TableBody>
          </Table>
      </div>

      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-brand-700">
          {displayedMeta.total} records · Page {displayedMeta.page} of {displayedMeta.totalPages}
        </p>
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationLink
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                disabled={hasFilters || page === 1}
              >
                Prev
              </PaginationLink>
            </PaginationItem>
            {pages.map((pageNumber) => (
              <PaginationItem key={pageNumber}>
                <PaginationLink
                  onClick={() => setPage(pageNumber)}
                  isActive={pageNumber === displayedMeta.page}
                  disabled={hasFilters}
                >
                  {pageNumber}
                </PaginationLink>
              </PaginationItem>
            ))}
            <PaginationItem>
              <PaginationLink
                onClick={() => setPage((prev) => Math.min(meta.totalPages, prev + 1))}
                disabled={hasFilters || page === meta.totalPages}
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
