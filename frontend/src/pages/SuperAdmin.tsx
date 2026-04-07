import React, { useState } from "react";
import { useAppStore } from "../store";
import { PageHeader, Card, Btn, StatusBadge, Field } from "../components/ui";
import { ShieldAlert, Settings, Users, FileText } from "lucide-react";
import { fmtCur } from "../utils";
import { toast } from "react-hot-toast";

export const SuperAdmin = () => {
  const { pos, updatePO, settings, setSettings, saveSettings, actionLoading } = useAppStore();
  const [tab, setTab] = useState("overview");

  const totalValue = pos.reduce((sum, p) => sum + p.totalValue, 0);
  const pendingPOs = pos.filter((p) =>
    ["Pending L1", "Pending L2"].includes(p.status),
  );

  const handleForceApprove = async (id: string) => {
    await updatePO(id, {
      status: "Approved",
      approvalL1: "Approved",
      approvalL2: "Approved",
    });
  };

  const handleBlock = async (id: string) => {
    await updatePO(id, { status: "Blocked" });
  };

  const handleSaveSettings = async () => {
    try {
      await saveSettings(settings);
      toast.success("System settings updated successfully");
    } catch (error: any) {
      toast.error(`Failed to save settings: ${error.message}`);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Super Admin Panel"
        sub="System configuration and overrides"
      />

      <div className="flex gap-2 border-b border-[#E8ECF0] dark:border-gray-800 mb-6 overflow-x-auto no-scrollbar">
        {[
          { id: "overview", label: "Overview", icon: FileText },
          { id: "overrides", label: "Override Approvals", icon: ShieldAlert },
          { id: "settings", label: "System Settings", icon: Settings },
          { id: "users", label: "User & Role Mgmt", icon: Users },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-3 text-[13px] font-bold uppercase tracking-wider transition-colors border-b-2 whitespace-nowrap ${tab === t.id ? "border-[#6D28D9] text-[#6D28D9] dark:text-purple-400 dark:border-purple-400" : "border-transparent text-[#6B7280] dark:text-gray-400 hover:text-[#1A1A2E] dark:hover:text-white"}`}
          >
            <t.icon className="w-4 h-4" />
            {t.label}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6 bg-gradient-to-br from-[#6D28D9] to-[#4C1D95] text-white border-none shadow-xl shadow-purple-900/20">
            <h3 className="text-[13px] font-bold uppercase tracking-wider text-purple-200 mb-2">
              Total PO Value (All Projects)
            </h3>
            <p className="text-4xl font-extrabold">{fmtCur(totalValue)}</p>
          </Card>

          <Card className="p-6 border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
            <h3 className="text-[13px] font-bold uppercase tracking-wider text-[#6B7280] dark:text-gray-400 mb-2">
              Pending Approvals
            </h3>
            <p className="text-4xl font-extrabold text-[#1A1A2E] dark:text-white">
              {pendingPOs.length}
            </p>
          </Card>
          <Card className="p-6 border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
            <h3 className="text-[13px] font-bold uppercase tracking-wider text-[#6B7280] dark:text-gray-400 mb-2">
              Auto-Approve Threshold
            </h3>
            <p className="text-4xl font-extrabold text-[#1A1A2E] dark:text-white">
              {fmtCur(settings.poThreshold)}
            </p>
          </Card>
        </div>
      )}

      {tab === "overrides" && (
        <Card className="p-0 overflow-hidden border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-[#E8ECF0] dark:border-gray-800">
                  <th className="px-4 py-3 text-[11px] font-bold text-[#6B7280] dark:text-gray-400 uppercase tracking-wider">
                    PO No.
                  </th>
                  <th className="px-4 py-3 text-[11px] font-bold text-[#6B7280] dark:text-gray-400 uppercase tracking-wider">
                    Project
                  </th>
                  <th className="px-4 py-3 text-[11px] font-bold text-[#6B7280] dark:text-gray-400 uppercase tracking-wider text-right">
                    Value
                  </th>
                  <th className="px-4 py-3 text-[11px] font-bold text-[#6B7280] dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-[11px] font-bold text-[#6B7280] dark:text-gray-400 uppercase tracking-wider text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8ECF0] dark:divide-gray-800">
                {pos.map((po) => (
                  <tr key={po.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                    <td className="px-4 py-3 text-[13px] font-medium text-[#1A1A2E] dark:text-white">
                      {po.id}
                    </td>
                    <td className="px-4 py-3 text-[13px] text-[#6B7280] dark:text-gray-400">
                      {po.project}
                    </td>
                    <td className="px-4 py-3 text-[13px] font-bold text-right dark:text-gray-300">
                      {fmtCur(po.totalValue)}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={po.status} />
                    </td>
                    <td className="px-4 py-3 text-right space-x-2">
                      {po.status !== "Approved" && po.status !== "Blocked" && (
                        <>
                          <Btn
                            label="Force Approve"
                            small
                            color="purple"
                            onClick={() => handleForceApprove(po.id)}
                          />
                          <Btn
                            label="Block"
                            small
                            color="red"
                            outline
                            onClick={() => handleBlock(po.id)}
                          />
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {tab === "settings" && (
        <Card className="p-6 max-w-2xl border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
          <h3 className="text-[16px] font-bold text-[#1A1A2E] dark:text-white mb-6">
            System Configuration
          </h3>
          <div className="space-y-4">
            <Field
              label="PO Auto-Approve Threshold (₹)"
              type="number"
              value={settings.poThreshold}
              onChange={(e: any) =>
                setSettings({
                  ...settings,
                  poThreshold: Number(e.target.value),
                })
              }
            />
            <Field
              label="Min Supplier Quotes (Low Value)"
              type="number"
              value={settings.minQuotesLow}
              onChange={(e: any) =>
                setSettings({
                  ...settings,
                  minQuotesLow: Number(e.target.value),
                })
              }
            />
            <Field
              label="Min Supplier Quotes (High Value)"
              type="number"
              value={settings.minQuotesHigh}
              onChange={(e: any) =>
                setSettings({
                  ...settings,
                  minQuotesHigh: Number(e.target.value),
                })
              }
            />
            <div className="pt-4">
              <Btn 
                label="Save Settings" 
                color="purple" 
                onClick={handleSaveSettings}
                loading={actionLoading}
              />
            </div>
          </div>
        </Card>
      )}

      {tab === "users" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            "Super Admin",
            "Director",
            "AGM",
            "Project Manager",
            "Store Incharge",
          ].map((r) => (
            <Card key={r} className="p-6 flex items-center gap-4 border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg ${r === "Super Admin" ? "bg-gradient-to-br from-[#6D28D9] to-[#4C1D95]" : "bg-[#F97316]"}`}
              >
                {r.charAt(0)}
              </div>
              <div>
                <h3 className="text-[14px] font-bold text-[#1A1A2E] dark:text-white">{r}</h3>
                <p className="text-[13px] text-[#6B7280] dark:text-gray-400">System Role</p>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
