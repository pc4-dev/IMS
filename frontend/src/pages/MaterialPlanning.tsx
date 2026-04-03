import React, { useState, useCallback, useEffect } from "react";
import { useAppStore } from "../store";
import {
  PageHeader,
  Card,
  StatusBadge,
  Btn,
  Modal,
  Field,
  SField,
  Pagination,
  ConfirmModal,
} from "../components/ui";
import { Plus, Search, AlertTriangle, Eye, Edit2, Trash2 } from "lucide-react";
import { MaterialPlan, PlanLineItem } from "../types";
import { genId, todayStr } from "../utils";
import { PROJECTS, WORK_TYPES } from "../data";

export const MaterialPlanning = () => {
  const { 
    plans, 
    plansPagination,
    fetchResource,
    addPlan, 
    updatePlan, 
    deletePlan, 
    role, 
    inventory,
    loading,
    actionLoading
  } = useAppStore();

  useEffect(() => {
    fetchResource('planning', 1);
  }, [fetchResource]);

  const [modal, setModal] = useState(false);
  const [viewModal, setViewModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<MaterialPlan | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const validateForm = (data: any) => {
    const newErrors: Record<string, string> = {};
    if (!data.project) newErrors.project = "Project is required";
    if (!data.milestone) newErrors.milestone = "Milestone is required";
    if (!data.workType) newErrors.workType = "Work Type is required";
    if (!data.items || data.items.length === 0) newErrors.items = "At least one item is required";
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  const canEdit = ["Super Admin", "Director", "Project Manager"].includes(role || "");
  const [newPlan, setNewPlan] = useState<Partial<MaterialPlan>>({
    project: "",
    milestone: "",
    workType: "",
    items: [],
  });
  const [searchItem, setSearchItem] = useState("");

  const handlePageChange = useCallback((page: number) => {
    fetchResource('planning', page);
  }, [fetchResource]);

  const handleCreate = async () => {
    if (!validateForm(newPlan)) {
      return;
    }

    if (isEditing) {
      try {
        await updatePlan(newPlan.id!, newPlan);
        setModal(false);
        setNewPlan({ project: "", milestone: "", workType: "", items: [] });
        setIsEditing(false);
        setErrors({});
      } catch (error: any) {
        alert(`Failed to update material plan: ${error.message}`);
      }
      return;
    }

    // Find the max ID to avoid duplicates
    const maxIdNum = plans.reduce((max, p) => {
      const parts = p.id.split("-");
      const num = parseInt(parts[parts.length - 1] || "0");
      return num > max ? num : max;
    }, 0);

    const plan: MaterialPlan = {
      id: genId("MP", maxIdNum),
      project: newPlan.project!,
      milestone: newPlan.milestone!,
      workType: newPlan.workType!,
      date: todayStr(),
      status: "Open",
      items: newPlan.items!,
    };
    
    try {
      await addPlan(plan);
      setModal(false);
      setNewPlan({ project: "", milestone: "", workType: "", items: [] });
      setErrors({});
    } catch (error: any) {
      alert(`Failed to create material plan: ${error.message}`);
    }
  };

  const addItem = (invItem: any) => {
    const reusable = inventory
      .filter(
        (i) =>
          i.sku === invItem.sku &&
          ["Good", "Needs Repair"].includes(i.condition),
      )
      .reduce((sum, i) => sum + i.liveStock, 0);

    const item: PlanLineItem = {
      sku: invItem.sku,
      name: invItem.name,
      required: 1,
      unit: invItem.unit,
      available: invItem.liveStock,
      reusable,
      shortage: Math.max(0, 1 - invItem.liveStock),
      priority: "Medium",
      delivery: todayStr(),
      activity: "",
    };
    setNewPlan({ ...newPlan, items: [...(newPlan.items || []), item] });
    setSearchItem("");
  };

  const updateItem = (index: number, field: string, value: any) => {
    const items = [...(newPlan.items || [])];
    const item = { ...items[index], [field]: value };
    if (field === "required") {
      item.shortage = Math.max(0, item.required - item.available);
    }
    items[index] = item;
    setNewPlan({ ...newPlan, items });
  };

  const handleConfirmDelete = async () => {
    if (!deletingId) return;
    try {
      await deletePlan(deletingId);
      setDeletingId(null);
    } catch (error: any) {
      console.error("Failed to delete material plan:", error);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Material Planning"
        sub="Plan materials for upcoming project milestones"
        actions={
          canEdit && (
            <Btn
              label="New Plan"
              icon={Plus}
              onClick={() => {
                setNewPlan({ project: "", milestone: "", workType: "", items: [] });
                setIsEditing(false);
                setModal(true);
              }}
            />
          )
        }
      />

      <div className="space-y-4">
        {plans.map((plan) => (
          <Card key={plan.id} className="p-0 overflow-hidden border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
            <div className="p-4 border-b border-[#E8ECF0] dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="text-[14px] font-bold text-[#1A1A2E] dark:text-white">
                    {plan.id}
                  </h3>
                  <StatusBadge status={plan.status} />
                </div>
                <p className="text-[13px] text-[#6B7280] dark:text-gray-400">
                  {plan.project} • {plan.workType} • {plan.milestone}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[11px] font-bold text-[#6B7280] dark:text-gray-500 uppercase">
                  Date
                </p>
                <p className="text-[13px] font-medium text-[#1A1A2E] dark:text-gray-300">
                  {plan.date}
                </p>
                {canEdit && (
                  <div className="flex gap-2 mt-2 justify-end">
                    <Btn
                      icon={Eye}
                      small
                      outline
                      onClick={() => {
                        setSelectedPlan(plan);
                        setViewModal(true);
                      }}
                      title="View"
                    />
                    <Btn
                      icon={Edit2}
                      small
                      outline
                      onClick={() => {
                        setNewPlan(plan);
                        setIsEditing(true);
                        setModal(true);
                      }}
                      title="Edit"
                    />
                    <Btn
                      icon={Trash2}
                      small
                      outline
                      color="red"
                      onClick={() => setDeletingId(plan.id)}
                      title="Delete"
                    />
                  </div>
                )}
              </div>
            </div>
            <div className="p-4 overflow-x-auto bg-white dark:bg-gray-900">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#E8ECF0] dark:border-gray-800">
                    <th className="px-2 py-2 text-[11px] font-bold text-[#6B7280] dark:text-gray-400 uppercase">
                      Item
                    </th>
                    <th className="px-2 py-2 text-[11px] font-bold text-[#6B7280] dark:text-gray-400 uppercase text-right">
                      Required
                    </th>
                    <th className="px-2 py-2 text-[11px] font-bold text-[#6B7280] dark:text-gray-400 uppercase text-right">
                      Available
                    </th>
                    <th className="px-2 py-2 text-[11px] font-bold text-[#6B7280] dark:text-gray-400 uppercase text-right">
                      Shortage
                    </th>
                    <th className="px-2 py-2 text-[11px] font-bold text-[#6B7280] dark:text-gray-400 uppercase">
                      Priority
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8ECF0] dark:divide-gray-800">
                  {plan.items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                      <td className="px-2 py-2 text-[13px] dark:text-gray-300">{item.name}</td>
                      <td className="px-2 py-2 text-[13px] font-medium text-right dark:text-gray-300">
                        {item.required} {item.unit}
                      </td>
                      <td className="px-2 py-2 text-[13px] text-right dark:text-gray-300">
                        {item.available}
                        {item.reusable > 0 && (
                          <span
                            className="ml-1 text-blue-500 dark:text-blue-400"
                            title="Includes reusable stock"
                          >
                            ({item.reusable} R)
                          </span>
                        )}
                      </td>
                      <td className="px-2 py-2 text-[13px] font-bold text-right text-[#EF4444] dark:text-red-400">
                        {item.shortage > 0 ? item.shortage : "-"}
                      </td>
                      <td className="px-2 py-2 text-[13px] dark:text-gray-300">{item.priority}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        ))}
        {plans.length === 0 && (
          <div className="text-center py-12 text-gray-500 text-[13px]">
            No material plans created yet.
          </div>
        )}

        {plansPagination && (
          <Pagination
            data={plansPagination}
            onPageChange={handlePageChange}
          />
        )}
      </div>

      {viewModal && selectedPlan && (
        <Modal
          title={`Material Plan Details - ${selectedPlan.id}`}
          wide
          onClose={() => setViewModal(false)}
        >
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <p className="text-[11px] font-bold text-gray-500 uppercase">Project</p>
                <p className="text-[13px] font-medium text-gray-900 dark:text-white">{selectedPlan.project}</p>
              </div>
              <div>
                <p className="text-[11px] font-bold text-gray-500 uppercase">Work Type</p>
                <p className="text-[13px] font-medium text-gray-900 dark:text-white">{selectedPlan.workType}</p>
              </div>
              <div>
                <p className="text-[11px] font-bold text-gray-500 uppercase">Milestone</p>
                <p className="text-[13px] font-medium text-gray-900 dark:text-white">{selectedPlan.milestone}</p>
              </div>
              <div>
                <p className="text-[11px] font-bold text-gray-500 uppercase">Date</p>
                <p className="text-[13px] font-medium text-gray-900 dark:text-white">{selectedPlan.date}</p>
              </div>
            </div>

            <div className="border rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[600px]">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-4 py-2 text-[11px] font-bold text-gray-500 uppercase">Item</th>
                      <th className="px-4 py-2 text-[11px] font-bold text-gray-500 uppercase text-right">Required</th>
                      <th className="px-4 py-2 text-[11px] font-bold text-gray-500 uppercase text-right">Available</th>
                      <th className="px-4 py-2 text-[11px] font-bold text-gray-500 uppercase text-right">Shortage</th>
                      <th className="px-4 py-2 text-[11px] font-bold text-gray-500 uppercase">Priority</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {selectedPlan.items.map((item, idx) => (
                      <tr key={idx}>
                        <td className="px-4 py-2 text-[13px] text-gray-900 dark:text-gray-300">{item.name}</td>
                        <td className="px-4 py-2 text-[13px] text-right text-gray-900 dark:text-gray-300">{item.required} {item.unit}</td>
                        <td className="px-4 py-2 text-[13px] text-right text-gray-900 dark:text-gray-300">{item.available}</td>
                        <td className="px-4 py-2 text-[13px] text-right font-bold text-red-500">{item.shortage}</td>
                        <td className="px-4 py-2 text-[13px] text-gray-900 dark:text-gray-300">{item.priority}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Btn label="Close" outline onClick={() => setViewModal(false)} />
            </div>
          </div>
        </Modal>
      )}

      {modal && (
        <Modal
          title={isEditing ? "Edit Material Plan" : "Create Material Plan"}
          wide
          onClose={() => {
            setModal(false);
            setErrors({});
          }}
        >
          <div className="grid grid-cols-3 gap-4 mb-6">
            <SField
              label="Project"
              value={newPlan.project}
              onChange={(e: any) =>
                setNewPlan({ ...newPlan, project: e.target.value })
              }
              options={PROJECTS}
              required
              error={errors.project}
            />
            <Field
              label="Milestone"
              value={newPlan.milestone}
              onChange={(e: any) =>
                setNewPlan({ ...newPlan, milestone: e.target.value })
              }
              required
              error={errors.milestone}
            />
            <SField
              label="Work Type"
              value={newPlan.workType}
              onChange={(e: any) =>
                setNewPlan({ ...newPlan, workType: e.target.value })
              }
              options={WORK_TYPES}
              required
              error={errors.workType}
            />
          </div>

          <div className="mb-6">
            <h3 className="text-[13px] font-bold text-[#1A1A2E] dark:text-white mb-3">
              Plan Items
            </h3>

            {errors.items && (
              <p className="text-[11px] text-red-500 mb-2">{errors.items}</p>
            )}

            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search inventory to add items..."
                value={searchItem}
                onChange={(e) => setSearchItem(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-[#E8ECF0] dark:border-gray-700 bg-white dark:bg-gray-800 rounded-lg text-[13px] text-gray-900 dark:text-white focus:outline-none focus:border-[#F97316] dark:focus:border-orange-500"
              />
              {searchItem && (
                <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-[#E8ECF0] dark:border-gray-700 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  {inventory
                    .filter((i) =>
                      i.name.toLowerCase().includes(searchItem.toLowerCase()),
                    )
                    .map((i) => (
                      <div
                        key={i.sku}
                        onClick={() => addItem(i)}
                        className="px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer text-[13px] text-gray-900 dark:text-gray-300"
                      >
                        {i.name} ({i.sku}) - Stock: {i.liveStock}
                      </div>
                    ))}
                </div>
              )}
            </div>

            {newPlan.items && newPlan.items.length > 0 && (
              <table className="w-full text-left border-collapse mb-4">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-[#E8ECF0] dark:border-gray-700">
                    <th className="px-2 py-2 text-[11px] font-bold text-[#6B7280] dark:text-gray-400 uppercase">
                      Item
                    </th>
                    <th className="px-2 py-2 text-[11px] font-bold text-[#6B7280] dark:text-gray-400 uppercase w-24">
                      Required
                    </th>
                    <th className="px-2 py-2 text-[11px] font-bold text-[#6B7280] dark:text-gray-400 uppercase w-24">
                      Priority
                    </th>
                    <th className="px-2 py-2 text-[11px] font-bold text-[#6B7280] dark:text-gray-400 uppercase">
                      Activity
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8ECF0] dark:divide-gray-700">
                  {newPlan.items.map((item, idx) => (
                    <tr key={idx}>
                      <td className="px-2 py-2 text-[13px] dark:text-gray-300">
                        {item.name}
                        {item.reusable > 0 && (
                          <div className="text-[11px] text-blue-600 dark:text-blue-400 flex items-center gap-1 mt-1">
                            <AlertTriangle className="w-3 h-3" />{" "}
                            {item.reusable} reusable in stock
                          </div>
                        )}
                      </td>
                      <td className="px-2 py-2">
                        <input
                          type="number"
                          value={item.required}
                          onChange={(e) =>
                            updateItem(idx, "required", Number(e.target.value))
                          }
                          className="w-full px-2 py-1 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded text-[13px] text-gray-900 dark:text-white"
                        />
                      </td>
                      <td className="px-2 py-2">
                        <select
                          value={item.priority}
                          onChange={(e) =>
                            updateItem(idx, "priority", e.target.value)
                          }
                          className="w-full px-2 py-1 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded text-[13px] text-gray-900 dark:text-white"
                        >
                          <option value="High">High</option>
                          <option value="Medium">Medium</option>
                          <option value="Low">Low</option>
                        </select>
                      </td>
                      <td className="px-2 py-2">
                        <input
                          type="text"
                          value={item.activity}
                          onChange={(e) =>
                            updateItem(idx, "activity", e.target.value)
                          }
                          placeholder="e.g. Slab casting"
                          className="w-full px-2 py-1 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded text-[13px] text-gray-900 dark:text-white"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-[#E8ECF0] dark:border-gray-700">
            <Btn label="Cancel" outline onClick={() => {
              setModal(false);
              setErrors({});
            }} />
            <Btn
              label={isEditing ? "Update Plan" : "Create Plan"}
              onClick={handleCreate}
              loading={actionLoading}
            />
          </div>
        </Modal>
      )}

      {deletingId && (
        <ConfirmModal
          title="Delete Material Plan"
          message="Are you sure you want to delete this material plan? This action cannot be undone."
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeletingId(null)}
          loading={actionLoading}
        />
      )}
    </div>
  );
};
