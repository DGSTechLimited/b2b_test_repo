"use client";

import { useState } from "react";
import { AlertTriangle, Building2, ChevronDown, Layers, ShoppingCart, TrendingUp } from "lucide-react";
import { AdminContentContainer } from "@/components/layout/AdminContentContainer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";

type AdminDashboardClientProps = {
  dealerCount: number;
  ordersLast30: number;
  backorderedLines: number;
  revenueLast30: number;
  ordersByWeek: Array<{ label: string; count: number }>;
  topProducts: Array<{ partStkNo: string; category: string; revenue: number }>;
  topDealers: Array<{ dealerName: string; orderCount: number; revenue: number }>;
  categoryMix: Array<{ category: string; revenue: number; percent: number }>;
};

export function AdminDashboardClient({
  dealerCount,
  ordersLast30: _ordersLast30,
  backorderedLines,
  revenueLast30,
  ordersByWeek,
  topProducts,
  topDealers,
  categoryMix
}: AdminDashboardClientProps) {
  const rangeOptions = [
    { value: "7d", label: "Last 7 days", days: 7, weeks: 1 },
    { value: "14d", label: "Last 14 days", days: 14, weeks: 2 },
    { value: "30d", label: "Last 30 days", days: 30, weeks: 4 },
    { value: "6m", label: "Last 6 months", days: 180, weeks: 12 },
    { value: "1y", label: "Last 1 year", days: 365, weeks: 12 }
  ];

  const [range, setRange] = useState(rangeOptions[2].value);
  const selectedRange = rangeOptions.find((option) => option.value === range) ?? rangeOptions[2];
  const rangeLabel = selectedRange.label;
  const rangeWeeks = selectedRange.weeks;
  const rangeScale = selectedRange.days / (rangeWeeks * 7);
  const rangeMultiplier = selectedRange.days / 30;

  const seriesSlice = ordersByWeek.slice(-rangeWeeks);
  const ordersSeries = seriesSlice.map((item) => Math.round(item.count * rangeScale));
  const seriesLabels = seriesSlice.map((item) => item.label);
  const previousSlice = ordersByWeek.slice(Math.max(0, ordersByWeek.length - rangeWeeks * 2), Math.max(0, ordersByWeek.length - rangeWeeks));
  const previousSeries = [
    ...Array(Math.max(0, rangeWeeks - previousSlice.length)).fill(null),
    ...previousSlice.map((item) => Math.round(item.count * rangeScale))
  ];

  const ordersTotal = ordersSeries.reduce((sum, value) => sum + value, 0);
  const previousTotal = previousSeries.reduce((sum, value) => sum + (value ?? 0), 0);
  const revenueDisplay = revenueLast30 * rangeMultiplier;
  const backorderDisplay = Math.max(0, Math.round(backorderedLines * rangeMultiplier));
  const totalRevenue = Math.max(1, revenueDisplay);
  const maxOrders = Math.max(
    ...ordersSeries,
    ...previousSeries.filter((value): value is number => value !== null),
    1
  );
  const chartWidth = 560;
  const chartHeight = 120;
  const chartPad = 12;
  const peakIndex = ordersSeries.findIndex((value) => value === maxOrders);
  const minIndex = ordersSeries.findIndex((value) => value === Math.min(...ordersSeries, maxOrders));
  const peakWeeks = seriesLabels
    .map((label, index) => ({ label, count: ordersSeries[index] ?? 0 }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 4);

  const trendFromTotals = (current: number, previous: number) => {
    if (previous === 0) {
      return { direction: "flat", pct: 0 };
    }
    const pct = ((current - previous) / previous) * 100;
    if (pct > 1) return { direction: "up", pct };
    if (pct < -1) return { direction: "down", pct };
    return { direction: "flat", pct };
  };

  const formatTrend = (trend: { direction: "up" | "down" | "flat"; pct: number }) => {
    if (trend.direction === "up") return `▲ ${Math.abs(trend.pct).toFixed(0)}%`;
    if (trend.direction === "down") return `▼ ${Math.abs(trend.pct).toFixed(0)}%`;
    return "→ 0%";
  };

  const formatCount = (value: number) =>
    new Intl.NumberFormat("en-GB", { maximumFractionDigits: 0 }).format(value);
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-GB", { maximumFractionDigits: 0 }).format(value);

  const trendClass = (trend: { direction: "up" | "down" | "flat" }) => {
    if (trend.direction === "up") return "text-status-success";
    if (trend.direction === "down") return "text-status-error";
    return "text-brand-700";
  };

  const linePath = (
    values: Array<number | null>,
    width: number,
    height: number,
    pad: number,
    maxValue: number
  ) => {
    const step = values.length > 1 ? (width - pad * 2) / (values.length - 1) : 0;
    let path = "";
    values.forEach((value, idx) => {
      if (value === null) return;
      const x = pad + step * idx;
      const y = height - pad - (value / Math.max(1, maxValue)) * (height - pad * 2);
      path += path ? ` L ${x} ${y}` : `M ${x} ${y}`;
    });
    return path;
  };

  const areaPath = (
    values: number[],
    width: number,
    height: number,
    pad: number,
    maxValue: number
  ) => {
    if (values.length === 0) return "";
    const step = values.length > 1 ? (width - pad * 2) / (values.length - 1) : 0;
    const points = values.map((value, idx) => {
      const x = pad + step * idx;
      const y = height - pad - (value / Math.max(1, maxValue)) * (height - pad * 2);
      return { x, y };
    });
    const topPath = points.map((point, idx) => `${idx === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ");
    const lastPoint = points[points.length - 1];
    const firstPoint = points[0];
    return `${topPath} L ${lastPoint.x} ${height - pad} L ${firstPoint.x} ${height - pad} Z`;
  };

  const ordersTrend = trendFromTotals(ordersTotal, previousTotal);
  const revenueTrend = ordersTrend;
  const backorderTrend = ordersTrend;
  const dealerTrend = { direction: "flat" as const, pct: 0 };
  const previousOrdersLabel = `${formatCount(previousTotal)} orders`;
  const previousRevenueEstimate =
    ordersTotal > 0 ? revenueDisplay * (previousTotal / Math.max(1, ordersTotal)) : 0;
  const previousBackorderEstimate =
    ordersTotal > 0 ? backorderDisplay * (previousTotal / Math.max(1, ordersTotal)) : 0;

  const sparklineHeights = (values: number[], height: number) => {
    const maxValue = Math.max(...values, 1);
    return values.map((value) => Math.max(2, Math.round((value / maxValue) * height)));
  };

  const ordersSpark = sparklineHeights(ordersSeries, 24);
  const revenueSpark = ordersSpark;
  const backorderSpark = ordersSpark;
  const dealerSpark = Array.from({ length: ordersSeries.length }, () => 12);

  const categoryColor = (category: string) => {
    if (category === "BRANDED") return "bg-status-success/60";
    if (category === "AFTERMARKET") return "bg-slate-400/60";
    return "bg-accent-600/60";
  };

  const categoryBadge = (category: string) => {
    if (category === "BRANDED") return "bg-status-success/10 text-status-success";
    if (category === "AFTERMARKET") return "bg-slate-100 text-slate-600";
    return "bg-accent-600/10 text-accent-700";
  };

  const adjustedTopProducts = topProducts.map((product) => ({
    ...product,
    revenue: product.revenue * rangeMultiplier
  }));
  const adjustedTopDealers = topDealers.map((dealer) => ({
    ...dealer,
    revenue: dealer.revenue * rangeMultiplier,
    orderCount: Math.max(0, Math.round(dealer.orderCount * rangeMultiplier))
  }));
  const adjustedCategoryMix = categoryMix.map((row) => ({
    ...row,
    revenue: row.revenue * rangeMultiplier
  }));

  const topCategory = adjustedCategoryMix.reduce(
    (top, current) => (current.revenue > top.revenue ? current : top),
    { category: "GENUINE", revenue: 0, percent: 0 }
  );
  const insightPrimary = `Backorders account for ${Math.round(
    (backorderDisplay / Math.max(1, ordersTotal)) * 100
  )}% of recent orders.`;
  const insightSecondary = `${topCategory.category} is the top revenue driver at ${topCategory.percent}%.`;
  const insightTertiary =
    ordersTrend.direction === "up"
      ? "Orders increased compared to the previous period."
      : ordersTrend.direction === "down"
        ? "Orders declined compared to the previous period."
        : "Orders held steady versus the previous period.";
  return (
    <AdminContentContainer>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-brand-700">
            Overview · <span className="font-medium text-brand-700/70">{rangeLabel}</span>
          </p>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-9 gap-2">
                {rangeLabel}
                <ChevronDown className="h-4 w-4 text-brand-700" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {rangeOptions.map((option) => (
                <DropdownMenuItem
                  key={option.value}
                  onSelect={() => setRange(option.value)}
                  className={option.value === range ? "bg-surface-100 font-semibold text-brand-900" : undefined}
                >
                  {option.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <Card className="border-l-2 border-t-2 border-violet-500/70 bg-gradient-to-br from-violet-500/20 via-violet-500/8 to-white">
            <CardHeader className="flex flex-row items-start justify-between pb-1">
              <div>
                <CardTitle className="text-xs font-semibold text-brand-700">Total Dealers</CardTitle>
                <p className="text-[11px] text-brand-700/60">{rangeLabel}</p>
              </div>
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-500/15">
                <Building2 className="h-3.5 w-3.5 text-violet-600" />
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-[40px] font-semibold text-violet-700 tabular-nums leading-none">{dealerCount}</p>
              <div className="mt-2 flex items-center gap-2 text-xs">
                <span className={`font-semibold ${trendClass(dealerTrend)}`}>{formatTrend(dealerTrend)}</span>
                <span className="text-brand-700/60">
                  vs prior period ({formatCount(dealerCount)} dealers)
                </span>
              </div>
              <div className="mt-3 flex h-6 items-end gap-1">
                {dealerSpark.map((height, idx) => (
                  <span
                    key={`dealer-spark-${idx}`}
                    className="flex-1 rounded-sm bg-violet-500/35"
                    style={{ height: `${height}px` }}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
          <Card className="border-l-2 border-t-2 border-accent-600/70 bg-gradient-to-br from-accent-600/20 via-accent-600/8 to-white">
            <CardHeader className="flex flex-row items-start justify-between pb-1">
              <div>
                <CardTitle className="text-xs font-semibold text-brand-700">Orders</CardTitle>
                <p className="text-[11px] text-brand-700/60">{rangeLabel}</p>
              </div>
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent-600/10">
                <ShoppingCart className="h-3.5 w-3.5 text-accent-600" />
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-[40px] font-semibold text-accent-700 tabular-nums leading-none">
                {formatCount(ordersTotal)}
              </p>
              <div className="mt-2 flex items-center gap-2 text-xs">
                <span className={`font-semibold ${trendClass(ordersTrend)}`}>{formatTrend(ordersTrend)}</span>
                <span className="text-brand-700/60">vs prior period ({previousOrdersLabel})</span>
              </div>
              <div className="mt-3 flex h-6 items-end gap-1">
                {ordersSpark.map((height, idx) => (
                  <span
                    key={`orders-spark-${idx}`}
                    className="flex-1 rounded-sm bg-accent-600/40"
                    style={{ height: `${height}px` }}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
          <Card className="border-l-2 border-t-2 border-status-warning/70 bg-gradient-to-br from-status-warning/20 via-status-warning/8 to-white">
            <CardHeader className="flex flex-row items-start justify-between pb-1">
              <div>
                <CardTitle className="text-xs font-semibold text-brand-700">Backordered Lines</CardTitle>
                <p className="text-[11px] text-brand-700/60">{rangeLabel}</p>
              </div>
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-status-warning/10">
                <AlertTriangle className="h-3.5 w-3.5 text-status-warning" />
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-[40px] font-semibold text-status-warning tabular-nums leading-none">
                {formatCount(backorderDisplay)}
              </p>
              <div className="mt-2 flex items-center gap-2 text-xs">
                <span className={`font-semibold ${trendClass(backorderTrend)}`}>{formatTrend(backorderTrend)}</span>
                <span className="text-brand-700/60">
                  vs prior period ({formatCount(previousBackorderEstimate)} lines)
                </span>
              </div>
              <div className="mt-3 flex h-6 items-end gap-1">
                {backorderSpark.map((height, idx) => (
                  <span
                    key={`backorder-spark-${idx}`}
                    className="flex-1 rounded-sm bg-status-warning/35"
                    style={{ height: `${height}px` }}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
          <Card className="border-l-2 border-t-2 border-status-success/70 bg-gradient-to-br from-status-success/20 via-status-success/8 to-white">
            <CardHeader className="flex flex-row items-start justify-between pb-1">
              <div>
                <CardTitle className="text-xs font-semibold text-brand-700">Revenue</CardTitle>
                <p className="text-[11px] text-brand-700/60">{rangeLabel}</p>
              </div>
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-status-success/10">
                <TrendingUp className="h-3.5 w-3.5 text-status-success" />
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-[40px] font-semibold text-status-success tabular-nums leading-none">
                £{formatCurrency(revenueDisplay)}
              </p>
              <div className="mt-2 flex items-center gap-2 text-xs">
                <span className={`font-semibold ${trendClass(revenueTrend)}`}>{formatTrend(revenueTrend)}</span>
                <span className="text-brand-700/60">
                  vs prior period (£{formatCurrency(previousRevenueEstimate)})
                </span>
              </div>
              <div className="mt-3 flex h-6 items-end gap-1">
                {revenueSpark.map((height, idx) => (
                  <span
                    key={`revenue-spark-${idx}`}
                    className="flex-1 rounded-sm bg-status-success/35"
                    style={{ height: `${height}px` }}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Orders trend</CardTitle>
              <p className="text-xs text-brand-700/60">{rangeLabel}</p>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-4">
                <div className="relative h-28">
                  <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="absolute inset-0 h-full w-full">
                    <line
                      x1={chartPad}
                      x2={chartWidth - chartPad}
                      y1={chartPad}
                      y2={chartPad}
                      stroke="rgba(226,232,240,1)"
                    />
                    <line
                      x1={chartPad}
                      x2={chartWidth - chartPad}
                      y1={chartHeight - chartPad}
                      y2={chartHeight - chartPad}
                      stroke="rgba(226,232,240,1)"
                    />
                    <path
                      d={areaPath(ordersSeries, chartWidth, chartHeight, chartPad, maxOrders)}
                      fill="rgba(11,67,149,0.18)"
                    />
                    <path
                      d={linePath(ordersSeries, chartWidth, chartHeight, chartPad, maxOrders)}
                      fill="none"
                      stroke="rgba(11,67,149,0.9)"
                      strokeWidth="2.5"
                    />
                    <path
                      d={linePath(previousSeries, chartWidth, chartHeight, chartPad, maxOrders)}
                      fill="none"
                      stroke="rgba(100,116,139,0.75)"
                      strokeDasharray="4 4"
                      strokeWidth="2"
                    />
                    {peakIndex >= 0 ? (() => {
                      const step = ordersSeries.length > 1 ? (chartWidth - chartPad * 2) / (ordersSeries.length - 1) : 0;
                      const x = chartPad + step * peakIndex;
                      const y = chartHeight - chartPad - (ordersSeries[peakIndex] / maxOrders) * (chartHeight - chartPad * 2);
                      return <circle cx={x} cy={y} r="3.5" fill="rgba(11,67,149,0.9)" />;
                    })() : null}
                    {minIndex >= 0 ? (() => {
                      const step = ordersSeries.length > 1 ? (chartWidth - chartPad * 2) / (ordersSeries.length - 1) : 0;
                      const x = chartPad + step * minIndex;
                      const y = chartHeight - chartPad - (ordersSeries[minIndex] / maxOrders) * (chartHeight - chartPad * 2);
                      return <circle cx={x} cy={y} r="3.5" fill="rgba(148,163,184,0.8)" />;
                    })() : null}
                  </svg>
                </div>
                <div className="flex justify-between text-[10px] text-brand-700/70">
                  {seriesLabels.map((label) => (
                    <span key={`${label}-axis`} className="flex-1 text-center">
                      {label}
                    </span>
                  ))}
                </div>
                <div className="flex items-center gap-4 text-[11px] text-brand-700/70">
                  <span className="flex items-center gap-2">
                    <span className="h-2 w-4 rounded-sm bg-accent-600/70" />
                    Current period
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="h-2 w-4 rounded-sm bg-slate-400/70" />
                    Previous period
                  </span>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-3">
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.2em] text-brand-700/60">Current</p>
                      <p className="text-2xl font-semibold text-accent-700 tabular-nums">
                        {formatCount(ordersTotal)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.2em] text-brand-700/60">Previous</p>
                      <p className="text-lg font-semibold text-brand-900 tabular-nums">
                        {formatCount(previousTotal)}
                      </p>
                      <p className={`text-xs ${trendClass(ordersTrend)}`}>{formatTrend(ordersTrend)}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.2em] text-brand-700/60">Order momentum</p>
                    <div className="mt-2 space-y-2">
                      {peakWeeks.length === 0 ? (
                        <span className="text-xs text-brand-700/70">No peak weeks yet.</span>
                      ) : (
                        peakWeeks.map((week) => (
                          <div key={week.label} className="flex items-center justify-between text-xs text-brand-700">
                            <span className="text-brand-700/70">{week.label}</span>
                            <span className="font-semibold text-brand-900 tabular-nums">
                              {formatCount(week.count)}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Top products</CardTitle>
              <p className="text-xs text-brand-700/60">{rangeLabel}</p>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2">
                {adjustedTopProducts.length === 0 ? (
                  <p className="text-sm text-brand-700">No product revenue yet.</p>
                ) : (
                  adjustedTopProducts.map((product) => (
                    <div
                      key={`${product.partStkNo}-${product.category}`}
                      className="flex items-center justify-between border-b border-surface-100 pb-2 last:border-b-0 last:pb-0"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-brand-900">{product.partStkNo}</p>
                        <span
                          className={`mt-1 inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-medium ${categoryBadge(
                            product.category
                          )}`}
                        >
                          {product.category}
                        </span>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-brand-900 tabular-nums">
                          £{formatCurrency(product.revenue)}
                        </p>
                        <p className="text-[11px] text-brand-700/70 tabular-nums">
                          {Math.round((product.revenue / totalRevenue) * 100)}%
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Top dealers</CardTitle>
            <p className="text-xs text-brand-700/60">{rangeLabel}</p>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid gap-3 lg:grid-cols-2">
              {adjustedTopDealers.length === 0 ? (
                <p className="text-sm text-brand-700">No dealer activity yet.</p>
              ) : (
                adjustedTopDealers.map((dealer) => (
                  <div
                    key={dealer.dealerName}
                    className="flex items-center justify-between border-b border-surface-100 pb-2 last:border-b-0 last:pb-0"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-brand-900">{dealer.dealerName}</p>
                      <p className="text-xs text-brand-700/70">{dealer.orderCount} orders</p>
                    </div>
                    <div className="text-right">
                        <p className="text-sm font-semibold text-brand-900 tabular-nums">
                          £{formatCurrency(dealer.revenue)}
                        </p>
                      <p className="text-[11px] text-brand-700/70 tabular-nums">
                        {Math.round((dealer.revenue / totalRevenue) * 100)}%
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Category mix</CardTitle>
              <p className="text-xs text-brand-700/60">{rangeLabel}</p>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3">
                {adjustedCategoryMix.length === 0 ? (
                  <p className="text-sm text-brand-700">No category mix yet.</p>
                ) : (
                  <>
                    <div className="flex h-2 overflow-hidden rounded-full bg-surface-100">
                      {adjustedCategoryMix.map((row) => (
                        <div
                          key={`${row.category}-bar`}
                          className={categoryColor(row.category)}
                          style={{ width: `${row.percent}%` }}
                        />
                      ))}
                    </div>
                    <div className="space-y-2">
                      {adjustedCategoryMix.map((row) => (
                        <div key={row.category} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <span className={`h-2 w-2 rounded-full ${categoryColor(row.category)}`} />
                            <span className="font-medium text-brand-900">{row.category}</span>
                            <span className="text-[11px] text-brand-700/70">{row.percent}%</span>
                          </div>
                          <span className="text-brand-700 tabular-nums">£{formatCurrency(row.revenue)}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Insights</CardTitle>
              <p className="text-xs text-brand-700/60">{rangeLabel}</p>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3 text-sm text-brand-700">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="mt-0.5 h-4 w-4 text-status-warning" />
                  <span>{insightPrimary}</span>
                </div>
                <div className="flex items-start gap-2">
                  <Layers className="mt-0.5 h-4 w-4 text-accent-600" />
                  <span>{insightSecondary}</span>
                </div>
                <div className="flex items-start gap-2">
                  <TrendingUp className="mt-0.5 h-4 w-4 text-status-success" />
                  <span>{insightTertiary}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminContentContainer>
  );
}
