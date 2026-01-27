"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Building2 from "lucide-react/dist/esm/icons/building-2";
import Copy from "lucide-react/dist/esm/icons/copy";
import Pencil from "lucide-react/dist/esm/icons/pencil";
import Search from "lucide-react/dist/esm/icons/search";
import Tag from "lucide-react/dist/esm/icons/tag";
import User from "lucide-react/dist/esm/icons/user";
import { AdminContentContainer } from "@/components/layout/AdminContentContainer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Pagination, PaginationContent, PaginationItem, PaginationLink } from "@/components/ui/pagination";
import { Select } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/components/ui/toast";

type UserRow = {
  id: string;
  name: string;
  role: "ADMIN" | "DEALER";
  email: string;
  status: "ACTIVE" | "INACTIVE" | "SUSPENDED";
  accountNo?: string | null;
  genuineTier?: string | null;
  aftermarketTier?: string | null;
  brandedTier?: string | null;
  dealerName?: string | null;
  createdBy?: string | null;
  createdAt: string;
};

type UsersResponse = {
  data: UserRow[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

const pageSize = 20;

const statusVariant = (status: UserRow["status"]) => {
  if (status === "ACTIVE") return "success";
  if (status === "SUSPENDED") return "danger";
  return "warning";
};

const statusDot = (status: UserRow["status"]) => {
  if (status === "ACTIVE") return "bg-status-success";
  if (status === "SUSPENDED") return "bg-status-error";
  return "bg-status-warning";
};

export function UsersClient() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"ADMIN" | "DEALER">("ADMIN");
  const [adminQuery, setAdminQuery] = useState("");
  const [dealerQuery, setDealerQuery] = useState("");
  const [adminAppliedQuery, setAdminAppliedQuery] = useState("");
  const [dealerAppliedQuery, setDealerAppliedQuery] = useState("");
  const [adminStatus, setAdminStatus] = useState("ALL");
  const [dealerStatus, setDealerStatus] = useState("ALL");
  const [adminPage, setAdminPage] = useState(1);
  const [dealerPage, setDealerPage] = useState(1);
  const [adminLoading, setAdminLoading] = useState(true);
  const [dealerLoading, setDealerLoading] = useState(true);
  const [adminUsers, setAdminUsers] = useState<UserRow[]>([]);
  const [dealerUsers, setDealerUsers] = useState<UserRow[]>([]);
  const [adminMeta, setAdminMeta] = useState({ total: 0, totalPages: 1 });
  const [dealerMeta, setDealerMeta] = useState({ total: 0, totalPages: 1 });
  const [createAdminOpen, setCreateAdminOpen] = useState(false);
  const [createDealerOpen, setCreateDealerOpen] = useState(false);
  const [editAdmin, setEditAdmin] = useState<UserRow | null>(null);
  const [editDealer, setEditDealer] = useState<UserRow | null>(null);

  useEffect(() => {
    setAdminPage(1);
  }, [adminAppliedQuery, adminStatus]);

  useEffect(() => {
    setDealerPage(1);
  }, [dealerAppliedQuery, dealerStatus]);

  const fetchAdminUsers = useCallback(async () => {
    setAdminLoading(true);
    const params = new URLSearchParams({
      query: adminAppliedQuery,
      type: "admin",
      status: adminStatus,
      page: String(adminPage),
      pageSize: String(pageSize)
    });
    const res = await fetch(`/api/admin/users?${params.toString()}`);
    if (!res.ok) {
      setAdminLoading(false);
      return;
    }
    const data = (await res.json()) as UsersResponse;
    setAdminUsers(data.data);
    setAdminMeta({ total: data.total, totalPages: data.totalPages });
    setAdminLoading(false);
  }, [adminAppliedQuery, adminStatus, adminPage]);

  const fetchDealerUsers = useCallback(async () => {
    setDealerLoading(true);
    const params = new URLSearchParams({
      query: dealerAppliedQuery,
      type: "dealer",
      status: dealerStatus,
      page: String(dealerPage),
      pageSize: String(pageSize)
    });
    const res = await fetch(`/api/admin/users?${params.toString()}`);
    if (!res.ok) {
      setDealerLoading(false);
      return;
    }
    const data = (await res.json()) as UsersResponse;
    setDealerUsers(data.data);
    setDealerMeta({ total: data.total, totalPages: data.totalPages });
    setDealerLoading(false);
  }, [dealerAppliedQuery, dealerStatus, dealerPage]);

  useEffect(() => {
    fetchAdminUsers();
  }, [fetchAdminUsers]);

  useEffect(() => {
    fetchDealerUsers();
  }, [fetchDealerUsers]);

  const activeUsers = activeTab === "ADMIN" ? adminUsers : dealerUsers;
  const activeLoading = activeTab === "ADMIN" ? adminLoading : dealerLoading;
  const activeMeta = activeTab === "ADMIN" ? adminMeta : dealerMeta;
  const activePage = activeTab === "ADMIN" ? adminPage : dealerPage;

  const pages = useMemo(() => {
    const total = activeMeta.totalPages;
    if (total <= 7) {
      return Array.from({ length: total }, (_, index) => index + 1);
    }
    const start = Math.max(1, activePage - 2);
    const end = Math.min(total, activePage + 2);
    const pagesSet = new Set([1, total]);
    for (let idx = start; idx <= end; idx += 1) {
      pagesSet.add(idx);
    }
    return Array.from(pagesSet).sort((a, b) => a - b);
  }, [activeMeta.totalPages, activePage]);

  const applyAdminSearch = useCallback(() => {
    const nextQuery = adminQuery.trim();
    setAdminPage(1);
    setAdminAppliedQuery(nextQuery);
    if (nextQuery === adminAppliedQuery && adminPage === 1) {
      fetchAdminUsers();
    }
  }, [adminQuery, adminAppliedQuery, adminPage, fetchAdminUsers]);

  const applyDealerSearch = useCallback(() => {
    const nextQuery = dealerQuery.trim();
    setDealerPage(1);
    setDealerAppliedQuery(nextQuery);
    if (nextQuery === dealerAppliedQuery && dealerPage === 1) {
      fetchDealerUsers();
    }
  }, [dealerQuery, dealerAppliedQuery, dealerPage, fetchDealerUsers]);

  const currentQuery = activeTab === "ADMIN" ? adminQuery : dealerQuery;
  const setCurrentQuery = activeTab === "ADMIN" ? setAdminQuery : setDealerQuery;
  const currentStatus = activeTab === "ADMIN" ? adminStatus : dealerStatus;
  const setCurrentStatus = activeTab === "ADMIN" ? setAdminStatus : setDealerStatus;
  const handleSearch = activeTab === "ADMIN" ? applyAdminSearch : applyDealerSearch;

  return (
    <AdminContentContainer>
      <div className="space-y-5">
        <div>
          <h2 className="text-3xl font-semibold text-brand-950">Users</h2>
        </div>

        <div className="inline-flex w-fit flex-wrap gap-2 rounded-2xl border border-surface-200 bg-white p-2 shadow-soft">
          {(["ADMIN", "DEALER"] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                activeTab === tab ? "bg-accent-600 text-white shadow-sm" : "text-brand-700 hover:bg-surface-100"
              }`}
            >
              {tab === "ADMIN" ? "Admin Users" : "Dealer Users"}
            </button>
          ))}
        </div>

      <div className="sticky top-24 z-10 flex flex-nowrap items-center gap-3 overflow-x-auto rounded-2xl border border-surface-200 bg-white/95 px-4 py-2 shadow-soft backdrop-blur">
        <div className="relative min-w-[280px] flex-[1_1_62%]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-700" />
          <Input
            placeholder="Search by name, email, or account number"
            value={currentQuery}
            onChange={(event) => setCurrentQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                handleSearch();
              }
            }}
            className="h-10 pl-9 text-[13px]"
          />
        </div>
        <Select
          value={currentStatus}
          onChange={(event) => setCurrentStatus(event.target.value)}
          className="h-10 w-[140px] shrink-0 text-[13px]"
        >
          <option value="ALL">All Statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
          {activeTab === "DEALER" ? <option value="SUSPENDED">Suspended</option> : null}
        </Select>
        <Button type="button" variant="outline" className="ml-auto h-10 shrink-0" onClick={handleSearch}>
          Search
        </Button>
        {activeTab === "DEALER" ? (
          <Button
            type="button"
            variant="outline"
            className="h-10 shrink-0"
            onClick={() => {
              window.location.href = "/api/admin/dealers/export";
            }}
          >
            Download CSV
          </Button>
        ) : null}
        <Button
          type="button"
          variant="accent"
          className="h-10 shrink-0"
          onClick={() => (activeTab === "ADMIN" ? setCreateAdminOpen(true) : setCreateDealerOpen(true))}
        >
          Create {activeTab === "ADMIN" ? "Admin" : "Dealer"}
        </Button>
      </div>

      <div className="rounded-2xl border border-surface-200 bg-white shadow-soft overflow-hidden">
        <Table wrapperClassName="h-[62vh] overflow-y-auto">
          <TableHeader className="sticky top-0 z-10 bg-white">
            <TableRow className="bg-white">
              {activeTab === "ADMIN" ? (
                <>
                  <TableHead className="py-2 min-w-[200px]">
                    <span className="inline-flex items-center gap-2">
                      <User className="h-3.5 w-3.5 text-brand-700" />
                      User Name
                    </span>
                  </TableHead>
                  <TableHead className="py-2 min-w-[240px]">Email</TableHead>
                  <TableHead className="py-2 min-w-[140px]">Status</TableHead>
                  <TableHead className="py-2 text-right min-w-[90px]">Actions</TableHead>
                </>
              ) : (
                <>
                  <TableHead className="py-2 min-w-[200px]">
                    <span className="inline-flex items-center gap-2">
                      <Building2 className="h-3.5 w-3.5 text-brand-700" />
                      Dealer Name
                    </span>
                  </TableHead>
                  <TableHead className="py-2 min-w-[140px]">Account No</TableHead>
                  <TableHead className="py-2 min-w-[220px]">Email</TableHead>
                  <TableHead className="py-2 min-w-[120px]">
                    <span className="inline-flex items-center gap-2">
                      <Tag className="h-3.5 w-3.5 text-brand-700" />
                      Genuine Tier
                    </span>
                  </TableHead>
                  <TableHead className="py-2 min-w-[140px]">Aftermarket Tier</TableHead>
                  <TableHead className="py-2 min-w-[120px]">Branded Tier</TableHead>
                  <TableHead className="py-2 min-w-[140px]">Status</TableHead>
                  <TableHead className="py-2 text-right min-w-[90px]">Actions</TableHead>
                </>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {activeLoading && activeUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={activeTab === "ADMIN" ? 4 : 8} className="py-6 text-center text-brand-700">
                  Loading users...
                </TableCell>
              </TableRow>
            ) : activeUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={activeTab === "ADMIN" ? 4 : 8} className="py-6 text-center text-brand-700">
                  No users match these filters.
                </TableCell>
              </TableRow>
            ) : activeTab === "ADMIN" ? (
              adminUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="py-2 text-[13px] font-semibold text-brand-900 whitespace-nowrap">
                    {user.name}
                  </TableCell>
                  <TableCell className="py-2 text-[13px] text-brand-900 whitespace-nowrap truncate max-w-[260px]">
                    {user.email}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    <Badge variant={statusVariant(user.status)}>
                      <span
                        className={`mr-2 inline-flex h-2 w-2 rounded-full ${statusDot(user.status)}`}
                      />
                      {user.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="px-2"
                      onClick={() => setEditAdmin(user)}
                      aria-label="Edit user"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              dealerUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="py-2 text-[13px] font-semibold text-brand-900 whitespace-nowrap">
                    {user.dealerName ?? user.name}
                  </TableCell>
                  <TableCell className="py-2 text-[13px] whitespace-nowrap">{user.accountNo ?? "-"}</TableCell>
                  <TableCell className="py-2 text-[13px] text-brand-900 whitespace-nowrap truncate max-w-[240px]">
                    {user.email}
                  </TableCell>
                  <TableCell className="py-2 text-[13px] whitespace-nowrap">
                    {user.genuineTier ? <Badge variant="neutral">{user.genuineTier}</Badge> : "-"}
                  </TableCell>
                  <TableCell className="py-2 text-[13px] whitespace-nowrap">
                    {user.aftermarketTier ? <Badge variant="neutral">{user.aftermarketTier}</Badge> : "-"}
                  </TableCell>
                  <TableCell className="py-2 text-[13px] whitespace-nowrap">
                    {user.brandedTier ? <Badge variant="neutral">{user.brandedTier}</Badge> : "-"}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    <Badge variant={statusVariant(user.status)}>
                      <span
                        className={`mr-2 inline-flex h-2 w-2 rounded-full ${statusDot(user.status)}`}
                      />
                      {user.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="px-2"
                      onClick={() => setEditDealer(user)}
                      aria-label="Edit dealer"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-brand-700">
          {activeMeta.total} users · Page {activePage} of {activeMeta.totalPages}
        </p>
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationLink
                onClick={() =>
                  activeTab === "ADMIN"
                    ? setAdminPage((prev) => Math.max(1, prev - 1))
                    : setDealerPage((prev) => Math.max(1, prev - 1))
                }
                disabled={activePage === 1}
              >
                Prev
              </PaginationLink>
            </PaginationItem>
            {pages.map((pageNumber) => (
              <PaginationItem key={pageNumber}>
                <PaginationLink
                  onClick={() => (activeTab === "ADMIN" ? setAdminPage(pageNumber) : setDealerPage(pageNumber))}
                  isActive={pageNumber === activePage}
                >
                  {pageNumber}
                </PaginationLink>
              </PaginationItem>
            ))}
            <PaginationItem>
              <PaginationLink
                onClick={() =>
                  activeTab === "ADMIN"
                    ? setAdminPage((prev) => Math.min(activeMeta.totalPages, prev + 1))
                    : setDealerPage((prev) => Math.min(activeMeta.totalPages, prev + 1))
                }
                disabled={activePage === activeMeta.totalPages}
              >
                Next
              </PaginationLink>
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>

      <CreateAdminModal
        open={createAdminOpen}
        onOpenChange={setCreateAdminOpen}
        onCreated={() => {
          toast({ title: "Admin user created" });
          fetchAdminUsers();
        }}
      />
      <CreateDealerModal
        open={createDealerOpen}
        onOpenChange={setCreateDealerOpen}
        onCreated={() => {
          toast({ title: "Dealer user created" });
          fetchDealerUsers();
        }}
      />
      <EditAdminModal
        user={editAdmin}
        onOpenChange={(open) => {
          if (!open) {
            setEditAdmin(null);
          }
        }}
        onUpdated={() => {
          toast({ title: "Admin updated" });
          fetchAdminUsers();
        }}
      />
      <EditDealerModal
        user={editDealer}
        onOpenChange={(open) => {
          if (!open) {
            setEditDealer(null);
          }
        }}
        onUpdated={() => {
          toast({ title: "Dealer updated" });
          fetchDealerUsers();
        }}
      />
      </div>
    </AdminContentContainer>
  );
}

type CreateModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: () => void;
};

type EditModalProps = {
  user: UserRow | null;
  onOpenChange: (open: boolean) => void;
  onUpdated?: () => void;
};

function CreateAdminModal({ open, onOpenChange, onCreated }: CreateModalProps) {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("ACTIVE");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) {
      setName("");
      setEmail("");
      setStatus("ACTIVE");
      setPassword("");
      setFieldErrors({});
    }
  }, [open]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setFieldErrors({});

    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: "ADMIN", name, email, password, status })
    });

    const data = await res.json();
    if (!res.ok) {
      const rawErrors = data.fieldErrors || {};
      const normalizedErrors = Object.fromEntries(
        Object.entries(rawErrors).map(([key, value]) => [key, Array.isArray(value) ? value[0] : value])
      );
      setFieldErrors(normalizedErrors);
      toast({
        title: "Unable to create admin",
        description: data.message ?? "Check the form for errors.",
        variant: "error"
      });
      setSubmitting(false);
      return;
    }

    setSubmitting(false);
    onOpenChange(false);
    onCreated?.();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Create Admin</DialogTitle>
          <DialogDescription>Provision an admin account with a temporary password.</DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="text-sm font-semibold text-brand-700">User Name</label>
              <Input value={name} onChange={(event) => setName(event.target.value)} required />
              {fieldErrors.name ? <p className="mt-1 text-xs text-status-error">{fieldErrors.name}</p> : null}
            </div>
            <div className="md:col-span-2">
              <label className="text-sm font-semibold text-brand-700">Email</label>
              <Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
              {fieldErrors.email ? <p className="mt-1 text-xs text-status-error">{fieldErrors.email}</p> : null}
            </div>
            <div>
              <label className="text-sm font-semibold text-brand-700">Status</label>
              <Select value={status} onChange={(event) => setStatus(event.target.value)}>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </Select>
            </div>
            <div>
              <label className="text-sm font-semibold text-brand-700">Temporary Password</label>
              <Input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required />
              {fieldErrors.password ? (
                <p className="mt-1 text-xs text-status-error">{fieldErrors.password}</p>
              ) : null}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="accent" disabled={submitting}>
              {submitting ? "Creating..." : "Create Admin"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function CreateDealerModal({ open, onOpenChange, onCreated }: CreateModalProps) {
  const { toast } = useToast();
  const [dealerName, setDealerName] = useState("");
  const [accountNo, setAccountNo] = useState("");
  const [email, setEmail] = useState("");
  const [genuineTier, setGenuineTier] = useState("A");
  const [aftermarketTier, setAftermarketTier] = useState("A");
  const [brandedTier, setBrandedTier] = useState("A");
  const [dispatchMethodDefault, setDispatchMethodDefault] = useState("");
  const [status, setStatus] = useState("ACTIVE");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) {
      setDealerName("");
      setAccountNo("");
      setEmail("");
      setGenuineTier("A");
      setAftermarketTier("A");
      setBrandedTier("A");
      setDispatchMethodDefault("");
      setStatus("ACTIVE");
      setPassword("");
      setFieldErrors({});
    }
  }, [open]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setFieldErrors({});

    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        role: "DEALER",
        dealerName,
        accountNo,
        email,
        genuineTier,
        aftermarketTier,
        brandedTier,
        dispatchMethodDefault,
        password,
        status
      })
    });

    const data = await res.json();
    if (!res.ok) {
      const rawErrors = data.fieldErrors || {};
      const normalizedErrors = Object.fromEntries(
        Object.entries(rawErrors).map(([key, value]) => [key, Array.isArray(value) ? value[0] : value])
      );
      setFieldErrors(normalizedErrors);
      toast({
        title: "Unable to create dealer",
        description: data.message ?? "Check the form for errors.",
        variant: "error"
      });
      setSubmitting(false);
      return;
    }

    setSubmitting(false);
    onOpenChange(false);
    onCreated?.();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create Dealer</DialogTitle>
          <DialogDescription>Create a dealer account with category-based tiers.</DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm font-semibold text-brand-700">Company Name</label>
              <Input value={dealerName} onChange={(event) => setDealerName(event.target.value)} required />
              {fieldErrors.dealerName ? (
                <p className="mt-1 text-xs text-status-error">{fieldErrors.dealerName}</p>
              ) : null}
            </div>
            <div>
              <label className="text-sm font-semibold text-brand-700">Account No</label>
              <Input value={accountNo} onChange={(event) => setAccountNo(event.target.value)} required />
              {fieldErrors.accountNo ? (
                <p className="mt-1 text-xs text-status-error">{fieldErrors.accountNo}</p>
              ) : null}
            </div>
            <div className="md:col-span-2">
              <label className="text-sm font-semibold text-brand-700">Email</label>
              <Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
              {fieldErrors.email ? <p className="mt-1 text-xs text-status-error">{fieldErrors.email}</p> : null}
            </div>
            <div>
              <label className="text-sm font-semibold text-brand-700">Genuine Tier</label>
              <Select value={genuineTier} onChange={(event) => setGenuineTier(event.target.value)}>
                {["A", "B", "C", "D", "E", "F"].map((tier) => (
                  <option key={tier} value={tier}>
                    {tier}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <label className="text-sm font-semibold text-brand-700">Aftermarket Tier</label>
              <Select value={aftermarketTier} onChange={(event) => setAftermarketTier(event.target.value)}>
                {["A", "B", "C", "D", "E", "F"].map((tier) => (
                  <option key={tier} value={tier}>
                    {tier}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <label className="text-sm font-semibold text-brand-700">Branded Tier</label>
              <Select value={brandedTier} onChange={(event) => setBrandedTier(event.target.value)}>
                {["A", "B", "C", "D", "E", "F"].map((tier) => (
                  <option key={tier} value={tier}>
                    {tier}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <label className="text-sm font-semibold text-brand-700">Status</label>
              <Select value={status} onChange={(event) => setStatus(event.target.value)}>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
                <option value="SUSPENDED">Suspended</option>
              </Select>
            </div>
            <div className="md:col-span-2">
              <label className="text-sm font-semibold text-brand-700">
                Default Shipping Method (optional)
              </label>
              <Input
                value={dispatchMethodDefault}
                onChange={(event) => setDispatchMethodDefault(event.target.value)}
              />
            </div>
            <div className="md:col-span-2">
              <label className="text-sm font-semibold text-brand-700">Temporary Password</label>
              <Input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required />
              {fieldErrors.password ? (
                <p className="mt-1 text-xs text-status-error">{fieldErrors.password}</p>
              ) : null}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="accent" disabled={submitting}>
              {submitting ? "Creating..." : "Create Dealer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function EditAdminModal({ user, onOpenChange, onUpdated }: EditModalProps) {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [status, setStatus] = useState<"ACTIVE" | "INACTIVE">("ACTIVE");
  const [saving, setSaving] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [resetPassword, setResetPassword] = useState("");
  const [resetResult, setResetResult] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setResetOpen(false);
      setResetResult(null);
      return;
    }
    setName(user.name);
    setStatus(user.status);
    setResetPassword("");
    setResetResult(null);
  }, [user]);

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user) return;
    setSaving(true);
    const res = await fetch(`/api/admin/users/${user.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, status })
    });

    if (!res.ok) {
      toast({ title: "Unable to update admin", variant: "error" });
      setSaving(false);
      return;
    }
    setSaving(false);
    onOpenChange(false);
    onUpdated?.();
  };

  const handleReset = async () => {
    if (!user) return;
    setSaving(true);
    const res = await fetch(`/api/admin/users/${user.id}/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: resetPassword || undefined })
    });
    const data = await res.json();
    if (!res.ok) {
      toast({ title: "Unable to reset password", description: data.message, variant: "error" });
      setSaving(false);
      return;
    }
    setResetResult(data.tempPassword);
    toast({ title: "Temporary password generated" });
    setSaving(false);
  };

  const copyPassword = async () => {
    if (!resetResult) return;
    await navigator.clipboard.writeText(resetResult);
    toast({ title: "Password copied" });
  };

  return (
    <Dialog open={Boolean(user)} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Edit Admin</DialogTitle>
          <DialogDescription>Update access, status, or reset credentials.</DialogDescription>
        </DialogHeader>
        {user ? (
          <form className="space-y-4" onSubmit={handleSave}>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-semibold text-brand-700">Email</label>
                <Input value={user.email} readOnly />
              </div>
              <div>
                <label className="text-sm font-semibold text-brand-700">Status</label>
                <Select value={status} onChange={(event) => setStatus(event.target.value as "ACTIVE" | "INACTIVE")}>
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                </Select>
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-semibold text-brand-700">User Name</label>
                <Input value={name} onChange={(event) => setName(event.target.value)} />
              </div>
            </div>
            <div className="rounded-2xl border border-surface-200 bg-surface-50 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-brand-900">Reset Password</p>
                  <p className="text-xs text-brand-700">Generate a temporary password for this user.</p>
                </div>
                <Button type="button" variant="outline" onClick={() => setResetOpen(true)}>
                  Reset Password
                </Button>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="accent" disabled={saving}>
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        ) : null}
      </DialogContent>

      <Dialog open={resetOpen} onOpenChange={setResetOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>Share the temporary password securely with the user.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-semibold text-brand-700">Temporary Password</label>
              <Input
                value={resetPassword}
                onChange={(event) => setResetPassword(event.target.value)}
                placeholder="Leave blank to auto-generate"
              />
            </div>
            {resetResult ? (
              <div className="rounded-2xl border border-surface-200 bg-surface-50 p-3">
                <p className="text-xs text-brand-700">Temporary password</p>
                <div className="mt-2 flex items-center justify-between gap-2">
                  <code className="text-sm font-semibold text-brand-900">{resetResult}</code>
                  <Button type="button" variant="ghost" onClick={copyPassword}>
                    <Copy className="h-4 w-4" />
                    Copy
                  </Button>
                </div>
              </div>
            ) : null}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setResetOpen(false)}>
              Close
            </Button>
            <Button type="button" variant="accent" onClick={handleReset} disabled={saving}>
              {saving ? "Resetting..." : "Confirm Reset"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}

function EditDealerModal({ user, onOpenChange, onUpdated }: EditModalProps) {
  const { toast } = useToast();
  const [dealerName, setDealerName] = useState("");
  const [status, setStatus] = useState<"ACTIVE" | "INACTIVE" | "SUSPENDED">("ACTIVE");
  const [genuineTier, setGenuineTier] = useState("A");
  const [aftermarketTier, setAftermarketTier] = useState("A");
  const [brandedTier, setBrandedTier] = useState("A");
  const [saving, setSaving] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [resetPassword, setResetPassword] = useState("");
  const [resetResult, setResetResult] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setResetOpen(false);
      setResetResult(null);
      return;
    }
    setDealerName(user.dealerName ?? user.name);
    setStatus(user.status);
    setGenuineTier(user.genuineTier ?? "A");
    setAftermarketTier(user.aftermarketTier ?? "A");
    setBrandedTier(user.brandedTier ?? "A");
    setResetPassword("");
    setResetResult(null);
  }, [user]);

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user) return;
    setSaving(true);
    const res = await fetch(`/api/admin/users/${user.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: dealerName,
        status,
        genuineTier,
        aftermarketTier,
        brandedTier
      })
    });

    if (!res.ok) {
      toast({ title: "Unable to update dealer", variant: "error" });
      setSaving(false);
      return;
    }
    setSaving(false);
    onOpenChange(false);
    onUpdated?.();
  };

  const handleReset = async () => {
    if (!user) return;
    setSaving(true);
    const res = await fetch(`/api/admin/users/${user.id}/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: resetPassword || undefined })
    });
    const data = await res.json();
    if (!res.ok) {
      toast({ title: "Unable to reset password", description: data.message, variant: "error" });
      setSaving(false);
      return;
    }
    setResetResult(data.tempPassword);
    toast({ title: "Temporary password generated" });
    setSaving(false);
  };

  const copyPassword = async () => {
    if (!resetResult) return;
    await navigator.clipboard.writeText(resetResult);
    toast({ title: "Password copied" });
  };

  return (
    <Dialog open={Boolean(user)} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Dealer</DialogTitle>
          <DialogDescription>Update tier settings, status, or reset credentials.</DialogDescription>
        </DialogHeader>
        {user ? (
          <form className="space-y-4" onSubmit={handleSave}>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-semibold text-brand-700">Email</label>
                <Input value={user.email} readOnly />
              </div>
              <div>
                <label className="text-sm font-semibold text-brand-700">Status</label>
                <Select
                  value={status}
                  onChange={(event) => setStatus(event.target.value as "ACTIVE" | "INACTIVE" | "SUSPENDED")}
                >
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                  <option value="SUSPENDED">Suspended</option>
                </Select>
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-semibold text-brand-700">Company Name</label>
                <Input value={dealerName} onChange={(event) => setDealerName(event.target.value)} />
              </div>
              <div>
                <label className="text-sm font-semibold text-brand-700">Account No</label>
                <Input value={user.accountNo ?? ""} readOnly />
              </div>
              <div>
                <label className="text-sm font-semibold text-brand-700">Genuine Tier</label>
                <Select value={genuineTier} onChange={(event) => setGenuineTier(event.target.value)}>
                  {["A", "B", "C", "D", "E", "F"].map((tier) => (
                    <option key={tier} value={tier}>
                      {tier}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <label className="text-sm font-semibold text-brand-700">Aftermarket Tier</label>
                <Select value={aftermarketTier} onChange={(event) => setAftermarketTier(event.target.value)}>
                  {["A", "B", "C", "D", "E", "F"].map((tier) => (
                    <option key={tier} value={tier}>
                      {tier}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <label className="text-sm font-semibold text-brand-700">Branded Tier</label>
                <Select value={brandedTier} onChange={(event) => setBrandedTier(event.target.value)}>
                  {["A", "B", "C", "D", "E", "F"].map((tier) => (
                    <option key={tier} value={tier}>
                      {tier}
                    </option>
                  ))}
                </Select>
              </div>
            </div>
            <div className="rounded-2xl border border-surface-200 bg-surface-50 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-brand-900">Reset Password</p>
                  <p className="text-xs text-brand-700">Generate a temporary password for this user.</p>
                </div>
                <Button type="button" variant="outline" onClick={() => setResetOpen(true)}>
                  Reset Password
                </Button>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="accent" disabled={saving}>
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        ) : null}
      </DialogContent>

      <Dialog open={resetOpen} onOpenChange={setResetOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>Share the temporary password securely with the user.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-semibold text-brand-700">Temporary Password</label>
              <Input
                value={resetPassword}
                onChange={(event) => setResetPassword(event.target.value)}
                placeholder="Leave blank to auto-generate"
              />
            </div>
            {resetResult ? (
              <div className="rounded-2xl border border-surface-200 bg-surface-50 p-3">
                <p className="text-xs text-brand-700">Temporary password</p>
                <div className="mt-2 flex items-center justify-between gap-2">
                  <code className="text-sm font-semibold text-brand-900">{resetResult}</code>
                  <Button type="button" variant="ghost" onClick={copyPassword}>
                    <Copy className="h-4 w-4" />
                    Copy
                  </Button>
                </div>
              </div>
            ) : null}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setResetOpen(false)}>
              Close
            </Button>
            <Button type="button" variant="accent" onClick={handleReset} disabled={saving}>
              {saving ? "Resetting..." : "Confirm Reset"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}
