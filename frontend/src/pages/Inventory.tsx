import React, { useState, useMemo, useCallback, memo, useEffect } from "react";
import { useAppStore } from "../store";
import {
  PageHeader,
  Card,
  StatusBadge,
  Btn,
  Modal,
  SField,
  Field,
  Pagination,
  Skeleton,
  ConfirmModal,
} from "../components/ui";
import { Tag, Search, AlertTriangle, Plus, Eye, Edit2, Trash2 } from "lucide-react";
import { InventoryItem } from "../types";
import { PROJECTS, CATEGORIES, UNITS } from "../data";
import toast from "react-hot-toast";

const InventoryRow = memo(
  ({
    item,
    catalogue,
    role,
    onTag,
    onView,
    onEdit,
    onDelete,
  }: {
    item: InventoryItem;
    catalogue: any[];
    role: string | null;
    onTag: (item: InventoryItem) => void;
    onView: (item: InventoryItem) => void;
    onEdit: (item: InventoryItem) => void;
    onDelete: (sku: string) => void;
  }) => {
    const cat = catalogue.find((c) => c.sku === item.sku);
    const isLow = cat && item.liveStock <= cat.minStock;

    return (
      <tr className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
        <td className="px-4 py-3 text-[13px] font-mono text-gray-500 dark:text-gray-400">
          {item.sku}
        </td>
        <td className="px-4 py-3 text-[13px] font-medium text-gray-900 dark:text-white">
          <div className="flex items-center gap-2">
            {item.itemName || cat?.name || "N/A"}
            {isLow && (
              <AlertTriangle
                className="w-4 h-4 text-amber-500"
                title="Below minimum stock"
              />
            )}
          </div>
        </td>
        <td className="px-4 py-3 text-[13px] text-gray-500 dark:text-gray-400">
          {item.category} / {item.subCategory}
        </td>
        <td className="px-4 py-3 text-[13px] font-bold text-right">
          <span
            className={
              item.liveStock === 0
                ? "text-red-500"
                : item.liveStock < 10
                  ? "text-amber-500"
                  : "text-emerald-500"
            }
          >
            {item.liveStock} {item.unit}
          </span>
        </td>
        <td className="px-4 py-3">
          <StatusBadge status={item.condition} />
        </td>
        <td className="px-4 py-3">
          <div className="flex items-center gap-2">
            <Btn
              icon={Eye}
              small
              outline
              onClick={() => onView(item)}
              title="View Details"
            />
            {["Super Admin", "Director", "Store Incharge"].includes(
              role || "",
            ) && (
              <>
                <Btn
                  icon={Tag}
                  small
                  outline
                  onClick={() => onTag(item)}
                  title="Tag Item"
                />
                <Btn
                  icon={Edit2}
                  small
                  outline
                  onClick={() => onEdit(item)}
                  title="Edit Item"
                />
                <Btn
                  icon={Trash2}
                  small
                  outline
                  color="red"
                  onClick={() => onDelete(item.sku)}
                  title="Delete Item"
                />
              </>
            )}
          </div>
        </td>
      </tr>
    );
  },
);

InventoryRow.displayName = "InventoryRow";

const INITIAL_ITEM: InventoryItem = {
  sku: "",
  itemName: "",
  category: "",
  subCategory: "",
  unit: "Nos",
  condition: "New",
  openingStock: 0,
  liveStock: 0,
  sourceSite: "",
  lastProject: "",
};

export const Inventory = () => {
  const {
    inventory,
    inventoryPagination,
    stats,
    fetchResource,
    updateInventory,
    catalogue,
    role,
    addWriteOff,
    addInventory,
    deleteInventory,
    loading,
    actionLoading,
    setActionLoading,
  } = useAppStore();

  const [search, setSearch] = useState("");
  const [tagModal, setTagModal] = useState<InventoryItem | null>(null);
  const [viewModal, setViewModal] = useState<InventoryItem | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [tagData, setTagData] = useState({
    condition: "New",
    sourceSite: "",
    lastProject: "",
    quantity: 0,
  });

  const [newItem, setNewItem] = useState<InventoryItem>(INITIAL_ITEM);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    // Only show skeleton if we have no data
    const isInitialLoad = inventory.length === 0;
    // Fetch a large number of items to show as a single list
    fetchResource("inventory", 1, 1000, !isInitialLoad);
  }, [fetchResource]);

  const validateForm = (data: any) => {
    const newErrors: Record<string, string> = {};
    if (!data.sku) newErrors.sku = "SKU is required";
    if (!data.itemName) newErrors.itemName = "Item name is required";
    if (!data.category) newErrors.category = "Category is required";
    if (!data.subCategory) newErrors.subCategory = "Sub-category is required";
    if (!data.unit) newErrors.unit = "Unit is required";
    if (!data.condition) newErrors.condition = "Condition is required";
    if (data.openingStock < 0) newErrors.openingStock = "Cannot be negative";
    if (data.liveStock < 0) newErrors.liveStock = "Cannot be negative";
    if (!data.sourceSite) newErrors.sourceSite = "Project name is required";
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePageChange = useCallback(
    (page: number) => {
      fetchResource("inventory", page);
    },
    [fetchResource],
  );

  const filtered = useMemo(
    () =>
      inventory.filter(
        (i) =>
          i.itemName?.toLowerCase().includes(search.toLowerCase()) ||
          i.sku?.toLowerCase().includes(search.toLowerCase()),
      ),
    [inventory, search],
  );

  const handleTag = async () => {
    if (!tagModal) return;
    
    const tagErrors: Record<string, string> = {};
    if (!tagData.condition) tagErrors.condition = "Condition is required";
    if (tagData.quantity <= 0) tagErrors.quantity = "Quantity must be greater than 0";
    if (!tagData.sourceSite) tagErrors.sourceSite = "Project is required";
    
    if (Object.keys(tagErrors).length > 0) {
      setErrors(tagErrors);
      return;
    }

    setActionLoading(true);
    try {
      if (tagData.condition === "Damaged") {
        await addWriteOff({
          sku: tagModal.sku,
          name: tagModal.itemName,
          category: tagModal.category,
          quantity: tagData.quantity,
          unit: tagModal.unit,
          reason: "Damaged during tagging",
          status: "Pending",
          requestedBy: "Store Incharge",
          date: new Date().toISOString(),
        });

        await updateInventory(tagModal.sku, {
          liveStock: Math.max(0, tagModal.liveStock - tagData.quantity),
          condition: tagModal.condition,
        });
        toast.success("Item marked as damaged and write-off requested");
      } else {
        await updateInventory(tagModal.sku, {
          condition: tagData.condition as any,
          sourceSite: tagData.sourceSite,
          lastProject: tagData.lastProject,
        });
        toast.success("Item tagged successfully");
      }
      setTagModal(null);
      setErrors({});
    } catch (error: any) {
      toast.error(`Failed to tag item: ${error.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddInventory = async () => {
    if (!validateForm(newItem)) {
      toast.error("Please fix the errors in the form");
      return;
    }

    try {
      if (isEditing) {
        await updateInventory(newItem.sku, newItem);
        toast.success("Item updated successfully");
      } else {
        await addInventory(newItem);
        toast.success("Item added to inventory");
      }
      setShowAddModal(false);
      setNewItem(INITIAL_ITEM);
      setIsEditing(false);
      setErrors({});
    } catch (error: any) {
      toast.error(
        `Failed to ${isEditing ? "update" : "add"} item: ${error.message}`,
      );
    }
  };

  const onTag = useCallback((item: InventoryItem) => {
    setTagModal(item);
    setTagData({
      condition: item.condition,
      sourceSite: item.sourceSite || "",
      lastProject: item.lastProject || "",
      quantity: 0,
    });
  }, []);

  const onView = useCallback((item: InventoryItem) => {
    setViewModal(item);
  }, []);

  const onEdit = useCallback((item: InventoryItem) => {
    setNewItem(item);
    setIsEditing(true);
    setShowAddModal(true);
  }, []);

  const onDelete = useCallback((sku: string) => {
    setDeleteConfirm(sku);
  }, []);

  const confirmDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await deleteInventory(deleteConfirm);
      toast.success("Item deleted successfully");
      setDeleteConfirm(null);
    } catch (error: any) {
      toast.error(`Failed to delete item: ${error.message}`);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Inventory Management"
        subtitle="Real-time stock tracking and asset tagging"
        actions={
          ["Super Admin", "Director", "Store Incharge"].includes(
            role || "",
          ) && (
            <Btn
              label="Add Item"
              icon={Plus}
              onClick={() => {
                setIsEditing(false);
                setNewItem(INITIAL_ITEM);
                setShowAddModal(true);
              }}
            />
          )
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            Total Items
          </p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            {inventoryPagination?.total || 0}
          </p>
        </Card>
        <Card className="p-4 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            Low Stock
          </p>
          <p className="text-2xl font-bold text-amber-500 mt-1">
            {stats.lowStockCount}
          </p>
        </Card>
        <Card className="p-4 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            Out of Stock
          </p>
          <p className="text-2xl font-bold text-red-500 mt-1">
            {stats.outOfStock}
          </p>
        </Card>
        <Card className="p-4 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            Categories
          </p>
          <p className="text-2xl font-bold text-indigo-500 mt-1">
            {stats.categoriesCount}
          </p>
        </Card>
      </div>

      <Card className="p-0 overflow-hidden border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
        <div className="p-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50/30 dark:bg-gray-800/30 flex flex-col sm:flex-row items-center gap-4">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by SKU or Item Name..."
              className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all dark:text-white"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800">
                <th className="px-4 py-3 text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  SKU
                </th>
                <th className="px-4 py-3 text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Item Name
                </th>
                <th className="px-4 py-3 text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-4 py-3 text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">
                  Stock
                </th>
                <th className="px-4 py-3 text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Condition
                </th>
                <th className="px-4 py-3 text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {loading && filtered.length === 0 ? (
                [1, 2, 3, 4, 5].map((i) => (
                  <tr key={i}>
                    <td colSpan={6} className="px-4 py-4">
                      <Skeleton className="h-8 w-full rounded" />
                    </td>
                  </tr>
                ))
              ) : (
                filtered.map((item) => (
                  <InventoryRow
                    key={item.sku}
                    item={item}
                    catalogue={catalogue}
                    role={role}
                    onTag={onTag}
                    onView={onView}
                    onEdit={onEdit}
                    onDelete={onDelete}
                  />
                ))
              )}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-8 text-center text-gray-500 dark:text-gray-400"
                  >
                    No items found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination removed as per user request for a single list format */}
      </Card>

      {tagModal && (
        <Modal
          title={`Tag Item: ${tagModal.itemName}`}
          onClose={() => setTagModal(null)}
        >
          <div className="space-y-6">
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800">
              <p className="text-sm font-medium text-blue-900 dark:text-blue-200">
                Item: {tagModal.itemName}
              </p>
              <p className="text-xs text-blue-700 dark:text-blue-400 mt-1">
                SKU: {tagModal.sku}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <SField
                label="New Condition"
                value={tagData.condition}
                onChange={(e: any) =>
                  setTagData({ ...tagData, condition: e.target.value as any })
                }
                options={["Needs Repair", "Damaged"]}
                required
                error={errors.condition}
              />
              <Field
                label="Quantity"
                type="number"
                value={tagData.quantity}
                onChange={(e: any) =>
                  setTagData({
                    ...tagData,
                    quantity: parseInt(e.target.value) || 0,
                  })
                }
                required
                error={errors.quantity}
              />
            </div>

            {tagData.condition === "Damaged" && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 text-xs rounded-lg border border-red-100 dark:border-red-800 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <span className="font-bold">Note:</span>
                  Marking as damaged will remove items from live stock and
                  require AGM/Director approval.
                </div>
              </div>
            )}

            <SField
              label="Project Name"
              value={tagData.sourceSite}
              onChange={(e: any) =>
                setTagData({ ...tagData, sourceSite: e.target.value })
              }
              options={PROJECTS}
              required
              error={errors.sourceSite}
            />

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
              <Btn label="Cancel" outline onClick={() => {
                setTagModal(null);
                setErrors({});
              }} />
              <Btn
                label="Confirm Tagging"
                onClick={handleTag}
                loading={actionLoading}
              />
            </div>
          </div>
        </Modal>
      )}

      {viewModal && (
        <Modal
          title="Inventory Item Details"
          onClose={() => setViewModal(null)}
        >
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">SKU</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{viewModal.sku}</p>
              </div>
              <div>
                <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Item Name</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{viewModal.itemName}</p>
              </div>
              <div>
                <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Category</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{viewModal.category}</p>
              </div>
              <div>
                <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Sub-Category</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{viewModal.subCategory}</p>
              </div>
              <div>
                <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Live Stock</p>
                <p className="text-sm font-bold text-emerald-500">{viewModal.liveStock} {viewModal.unit}</p>
              </div>
              <div>
                <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Condition</p>
                <StatusBadge status={viewModal.condition} />
              </div>
              <div>
                <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Project</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{viewModal.sourceSite}</p>
              </div>
            </div>
            <div className="flex justify-end pt-4 border-t border-gray-100 dark:border-gray-800">
              <Btn label="Close" outline onClick={() => setViewModal(null)} />
            </div>
          </div>
        </Modal>
      )}

      {showAddModal && (
        <Modal
          title={isEditing ? "Edit Inventory Item" : "Add New Inventory Item"}
          onClose={() => {
            setShowAddModal(false);
            setNewItem(INITIAL_ITEM);
            setIsEditing(false);
            setErrors({});
          }}
        >
          <div className="space-y-6">
            <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl border border-dashed border-gray-200 dark:border-gray-700 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field
                  label="SKU (Auto-generated)"
                  value={newItem.sku}
                  onChange={(e: any) =>
                    setNewItem({ ...newItem, sku: e.target.value })
                  }
                  placeholder="e.g. ELE/CAB/0001"
                  required
                  error={errors.sku}
                />
                <Field
                  label="Item Name"
                  value={newItem.itemName}
                  onChange={(e: any) =>
                    setNewItem({ ...newItem, itemName: e.target.value })
                  }
                  placeholder="e.g. Copper Cable 10mm"
                  required
                  error={errors.itemName}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <SField
                  label="Category"
                  value={newItem.category}
                  onChange={(e: any) =>
                    setNewItem({ ...newItem, category: e.target.value })
                  }
                  options={CATEGORIES}
                  required
                  error={errors.category}
                />
                <Field
                  label="Sub-Category"
                  value={newItem.subCategory}
                  onChange={(e: any) =>
                    setNewItem({ ...newItem, subCategory: e.target.value })
                  }
                  placeholder="e.g. Cables"
                  required
                  error={errors.subCategory}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <SField
                label="Unit"
                value={newItem.unit}
                onChange={(e: any) =>
                  setNewItem({ ...newItem, unit: e.target.value })
                }
                options={UNITS}
                required
                error={errors.unit}
              />
              <SField
                label="Condition"
                value={newItem.condition}
                onChange={(e: any) =>
                  setNewItem({ ...newItem, condition: e.target.value as any })
                }
                options={["New", "Good", "Needs Repair", "Damaged"]}
                required
                error={errors.condition}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-amber-50/30 dark:bg-amber-900/10 rounded-xl border border-amber-100 dark:border-amber-800">
              <Field
                label="Opening Stock"
                type="number"
                value={newItem.openingStock}
                onChange={(e: any) => {
                  const val = parseInt(e.target.value) || 0;
                  setNewItem({ ...newItem, openingStock: val, liveStock: val });
                }}
                required
                error={errors.openingStock}
              />
              <Field
                label="Live Stock"
                type="number"
                value={newItem.liveStock}
                onChange={(e: any) =>
                  setNewItem({
                    ...newItem,
                    liveStock: parseInt(e.target.value) || 0,
                  })
                }
                required
                error={errors.liveStock}
              />
            </div>

            <div className="grid grid-cols-1 gap-4">
              <SField
                label="Project Name"
                value={newItem.sourceSite}
                onChange={(e: any) =>
                  setNewItem({ ...newItem, sourceSite: e.target.value })
                }
                options={PROJECTS}
                required
                error={errors.sourceSite}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
              <Btn
                label="Cancel"
                outline
                onClick={() => {
                  setShowAddModal(false);
                  setNewItem(INITIAL_ITEM);
                  setIsEditing(false);
                  setErrors({});
                }}
              />
              <Btn
                label={isEditing ? "Update Item" : "Add Item to Inventory"}
                onClick={handleAddInventory}
                loading={actionLoading}
              />
            </div>
          </div>
        </Modal>
      )}

      {deleteConfirm && (
        <ConfirmModal
          title="Delete Inventory Item"
          message={`Are you sure you want to delete ${deleteConfirm}? This action cannot be undone.`}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteConfirm(null)}
          loading={actionLoading}
        />
      )}
    </div>
  );
};

export default Inventory;
