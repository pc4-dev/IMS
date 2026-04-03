import React, { useCallback, useEffect } from "react";
import { useAppStore } from "../store";
import { PageHeader, Card, StatusBadge, Btn, Pagination, ConfirmModal } from "../components/ui";
import { Check, X } from "lucide-react";

export const WriteOffPage = () => {
  const { 
    writeOffs, 
    writeOffsPagination,
    fetchResource,
    updateWriteOff, 
    deleteWriteOff,
    inventory, 
    updateInventory, 
    role,
    loading,
    actionLoading
  } = useAppStore();

  useEffect(() => {
    fetchResource('writeoffs', 1);
  }, [fetchResource]);

  const handlePageChange = useCallback((page: number) => {
    fetchResource('writeoffs', page);
  }, [fetchResource]);

  const handleApprove = async (id: string) => {
    const wo = writeOffs.find((w) => w.id === id);
    if (!wo) return;

    // Deduct from live stock permanently
    const inv = inventory.find((i) => i.sku === wo.sku);
    if (inv) {
      await updateInventory(wo.sku, {
        liveStock: Math.max(0, inv.liveStock - wo.qty),
      });
    }

    await updateWriteOff(id, { status: "Approved" });
  };

  const handleReject = async (id: string) => {
    // Does not deduct stock, item remains in inventory (should be re-tagged)
    await updateWriteOff(id, { status: "Rejected" });
  };

  const [deleteConfirm, setDeleteConfirm] = React.useState<string | null>(null);

  const confirmDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await deleteWriteOff(deleteConfirm);
      setDeleteConfirm(null);
    } catch (error: any) {
      // Error handled in store
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Write-off Approvals"
        sub="Review and approve damaged or lost inventory write-offs"
      />

      <Card className="p-0 overflow-hidden border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-[#E8ECF0] dark:border-gray-800">
                <th className="px-4 py-3 text-[11px] font-bold text-[#6B7280] dark:text-gray-400 uppercase tracking-wider">
                  Ref No.
                </th>
                <th className="px-4 py-3 text-[11px] font-bold text-[#6B7280] dark:text-gray-400 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-4 py-3 text-[11px] font-bold text-[#6B7280] dark:text-gray-400 uppercase tracking-wider">
                  Item
                </th>
                <th className="px-4 py-3 text-[11px] font-bold text-[#6B7280] dark:text-gray-400 uppercase tracking-wider text-right">
                  Qty
                </th>
                <th className="px-4 py-3 text-[11px] font-bold text-[#6B7280] dark:text-gray-400 uppercase tracking-wider">
                  Reason
                </th>
                <th className="px-4 py-3 text-[11px] font-bold text-[#6B7280] dark:text-gray-400 uppercase tracking-wider">
                  Requested By
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
              {writeOffs.map((wo) => (
                <tr key={wo.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                  <td className="px-4 py-3 text-[13px] font-medium text-[#1A1A2E] dark:text-white">
                    {wo.id}
                  </td>
                  <td className="px-4 py-3 text-[13px] text-[#6B7280] dark:text-gray-400">
                    {wo.date}
                  </td>
                  <td className="px-4 py-3 text-[13px] text-[#1A1A2E] dark:text-gray-300">
                    {wo.name}{" "}
                    <span className="text-[11px] text-[#6B7280] dark:text-gray-500 block font-mono">
                      {wo.sku}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[13px] font-bold text-right text-[#EF4444] dark:text-red-400">
                    {wo.qty} {wo.unit}
                  </td>
                  <td
                    className="px-4 py-3 text-[13px] text-[#6B7280] dark:text-gray-400 max-w-xs truncate"
                    title={wo.reason}
                  >
                    {wo.reason}
                  </td>
                  <td className="px-4 py-3 text-[13px] text-[#6B7280] dark:text-gray-400">
                    {wo.requestedBy}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={wo.status} />
                  </td>
                  <td className="px-4 py-3 text-right space-x-2">
                    {role === "Super Admin" &&
                      wo.status === "Pending" && (
                        <>
                          <Btn
                            icon={Check}
                            small
                            color="green"
                            onClick={() => handleApprove(wo.id)}
                          />
                          <Btn
                            icon={X}
                            small
                            color="red"
                            outline
                            onClick={() => handleReject(wo.id)}
                          />
                          <Btn
                            label="Delete"
                            small
                            outline
                            color="red"
                            onClick={() => setDeleteConfirm(wo.id)}
                          />
                        </>
                      )}
                  </td>
                </tr>
              ))}
              {writeOffs.length === 0 && (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-8 text-center text-gray-500 dark:text-gray-400 text-[13px]"
                  >
                    No write-off requests found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {writeOffsPagination && (
        <Pagination
          data={writeOffsPagination}
          onPageChange={handlePageChange}
        />
      )}

      {deleteConfirm && (
        <ConfirmModal
          title="Delete Write-off Record"
          message="Are you sure you want to delete this write-off record? This action cannot be undone."
          onConfirm={confirmDelete}
          onCancel={() => setDeleteConfirm(null)}
          loading={actionLoading}
        />
      )}
    </div>
  );
};
