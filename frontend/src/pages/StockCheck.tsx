import React, { useState } from "react";
import { useAppStore } from "../store";
import { PageHeader, Card, Btn, SField } from "../components/ui";
import { CheckSquare, AlertTriangle, RefreshCw, FileText, Download } from "lucide-react";
import { CATEGORIES } from "../data";
import toast from "react-hot-toast";

export const StockCheck = () => {
  const { inventory, role, submitStockCheck, actionLoading } = useAppStore();
  const [category, setCategory] = useState("");
  const [counts, setCounts] = useState<Record<string, number | "">>({});

  const filtered = category
    ? inventory.filter((i) => i.category === category)
    : [];

  const handleSubmitAudit = async () => {
    const auditItems = filtered
      .filter(item => counts[item.sku] !== undefined && counts[item.sku] !== "")
      .map(item => ({
        sku: item.sku,
        name: item.name,
        systemStock: item.liveStock,
        physicalStock: Number(counts[item.sku]),
        variance: Number(counts[item.sku]) - item.liveStock,
        unit: item.unit
      }));

    if (auditItems.length === 0) {
      toast.error("No items audited!");
      return;
    }

    try {
      await submitStockCheck({
        id: `AUDIT-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        date: new Date().toISOString(),
        category,
        items: auditItems,
        status: "Completed"
      });
      toast.success("Audit submitted successfully!");
      setCounts({});
    } catch (error: any) {
      toast.error(`Failed to submit audit: ${error.message}`);
    }
  };

  const exportToCSV = () => {
    if (filtered.length === 0) return;
    
    const headers = ["SKU", "Item Name", "System Stock", "Physical Count", "Variance", "Unit"];
    const rows = filtered.map(item => {
      const count = counts[item.sku] !== undefined ? counts[item.sku] : "";
      const variance = count !== "" ? Number(count) - item.liveStock : "";
      return [
        item.sku,
        item.name,
        item.liveStock,
        count,
        variance,
        item.unit
      ];
    });

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `stock_check_${category}_${new Date().toLocaleDateString()}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Physical Stock Check"
        sub="Audit warehouse inventory against system records"
        actions={
          category && (
            <div className="flex gap-2">
              <Btn
                label="Export CSV"
                variant="ghost"
                icon={Download}
                onClick={exportToCSV}
              />
              {["Super Admin", "Director", "Store Incharge"].includes(role || "") && (
                <Btn
                  label="Submit Audit"
                  icon={CheckSquare}
                  onClick={handleSubmitAudit}
                  loading={actionLoading}
                />
              )}
            </div>
          )
        }
      />

      <Card className="p-4 mb-6 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
        <div className="max-w-md">
          <SField
            label="Select Category to Audit"
            value={category}
            onChange={(e: any) => {
              setCategory(e.target.value);
              setCounts({});
            }}
            options={CATEGORIES}
          />
        </div>
      </Card>

      {category && (
        <Card className="p-0 overflow-hidden bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-[#E8ECF0] dark:border-gray-800">
                  <th className="px-4 py-3 text-[11px] font-bold text-[#6B7280] dark:text-gray-400 uppercase tracking-wider">
                    SKU
                  </th>
                  <th className="px-4 py-3 text-[11px] font-bold text-[#6B7280] dark:text-gray-400 uppercase tracking-wider">
                    Item Name
                  </th>
                  <th className="px-4 py-3 text-[11px] font-bold text-[#6B7280] dark:text-gray-400 uppercase tracking-wider text-right">
                    System Stock
                  </th>
                  <th className="px-4 py-3 text-[11px] font-bold text-[#6B7280] dark:text-gray-400 uppercase tracking-wider text-right">
                    Physical Count
                  </th>
                  <th className="px-4 py-3 text-[11px] font-bold text-[#6B7280] dark:text-gray-400 uppercase tracking-wider text-right">
                    Variance
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8ECF0] dark:divide-gray-800">
                {filtered.map((item) => {
                  const count =
                    counts[item.sku] !== undefined ? counts[item.sku] : "";
                  const variance =
                    count !== "" ? Number(count) - item.liveStock : 0;

                  return (
                    <tr key={item.sku} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30">
                      <td className="px-4 py-3 text-[13px] font-mono text-[#6B7280] dark:text-gray-400">
                        {item.sku}
                      </td>
                      <td className="px-4 py-3 text-[13px] font-medium text-[#1A1A2E] dark:text-white">
                        {item.name}
                      </td>
                      <td className="px-4 py-3 text-[13px] font-bold text-right text-gray-900 dark:text-white">
                        {item.liveStock} {item.unit}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <input
                          type="number"
                          value={count}
                          onChange={(e) =>
                            setCounts({
                              ...counts,
                              [item.sku]:
                                e.target.value === ""
                                  ? ""
                                  : Number(e.target.value),
                            })
                          }
                          className="w-24 px-2 py-1 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 rounded text-[13px] text-right text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/20"
                          placeholder="Count"
                        />
                      </td>
                      <td className="px-4 py-3 text-right">
                        {count !== "" && (
                          <span
                            className={`text-[13px] font-bold ${variance > 0 ? "text-blue-500" : variance < 0 ? "text-red-500" : "text-green-500"}`}
                          >
                            {variance > 0 ? `+${variance}` : variance}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
};
