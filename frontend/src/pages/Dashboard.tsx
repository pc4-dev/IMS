import React from "react";
import { useAppStore } from "../store";
import {
  PageHeader,
  KPICard,
  Card,
  StatusBadge,
  Skeleton,
} from "../components/ui";
import {
  Package,
  RefreshCw,
  ShoppingCart,
  AlertTriangle,
  FileText,
  CheckSquare,
} from "lucide-react";
import { fmtCur } from "../utils";

export const Dashboard = () => {
  const { stats, pos, loading } = useAppStore();

  const {
    totalSKUs,
    inStock,
    reusable,
    pendingPOs,
    lowStockCount,
    pendingWriteOffs,
  } = stats;

  if (loading && !stats.totalSKUs) {
    return (
      <div className="space-y-6">
        <PageHeader title="Dashboard" sub="Loading overview..." />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Skeleton className="h-96 rounded-2xl" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-24 rounded-2xl" />
            <Skeleton className="h-24 rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        sub="Overview of Garden City store operations"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          label="Total SKUs"
          value={totalSKUs}
          icon={Package}
          color="blue"
        />
        <KPICard
          label="In Stock"
          value={inStock}
          icon={CheckSquare}
          color="green"
        />
        <KPICard
          label="Reusable Stock"
          value={reusable}
          icon={RefreshCw}
          color="purple"
        />
        <KPICard
          label="Pending POs"
          value={pendingPOs}
          icon={ShoppingCart}
          color="orange"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="p-0 overflow-hidden border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
            <div className="p-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50">
              <h3 className="text-[14px] font-bold text-gray-900 dark:text-white">
                Recent Purchase Orders
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800">
                    <th className="px-4 py-3 text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      PO No.
                    </th>
                    <th className="px-4 py-3 text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Project
                    </th>
                    <th className="px-4 py-3 text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Value
                    </th>
                    <th className="px-4 py-3 text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                  {pos
                    .slice(-4)
                    .reverse()
                    .map((po) => (
                      <tr
                        key={po.id}
                        className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors"
                      >
                        <td className="px-4 py-3 text-[13px] font-medium text-gray-900 dark:text-white">
                          {po.id}
                        </td>
                        <td className="px-4 py-3 text-[13px] text-gray-500 dark:text-gray-400">
                          {po.project}
                        </td>
                        <td className="px-4 py-3 text-[13px] font-medium text-gray-900 dark:text-white">
                          {fmtCur(po.totalValue)}
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={po.status} />
                        </td>
                      </tr>
                    ))}
                  {pos.length === 0 && (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-4 py-8 text-center text-gray-500 dark:text-gray-400 text-[13px]"
                      >
                        No purchase orders found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="p-4 border-l-4 border-l-red-500 dark:bg-gray-900 border-gray-200 dark:border-gray-800">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-[13px] font-bold text-gray-900 dark:text-white">
                  Low Stock Alerts
                </h4>
                <p className="text-[13px] text-gray-500 dark:text-gray-400 mt-1">
                  {lowStockCount} items are below their minimum reorder level.
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-4 border-l-4 border-l-amber-500 dark:bg-gray-900 border-gray-200 dark:border-gray-800">
            <div className="flex items-start gap-3">
              <FileText className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-[13px] font-bold text-gray-900 dark:text-white">
                  Pending Write-offs
                </h4>
                <p className="text-[13px] text-gray-500 dark:text-gray-400 mt-1">
                  {pendingWriteOffs} requests awaiting approval.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
