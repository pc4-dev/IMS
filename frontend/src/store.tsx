import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from "react";
import {
  InventoryItem,
  Vendor,
  PurchaseOrder,
  CatalogueEntry,
  MaterialPlan,
  GRN,
  Inward,
  Outward,
  InwardReturn,
  OutwardReturn,
  WriteOff,
  StockCheckReport,
  Role,
  Notification,
  MaterialTransferOutward,
  MaterialTransferInward,
} from "./types";
import { SEED_INVENTORY, SEED_VENDORS, SEED_POS, SEED_CATALOGUE } from "./data";
import { api } from "./services/api";

import { toast } from "react-hot-toast";

interface PaginationInfo {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

interface AppState {
  user: any | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  role: Role | null;
  setRole: (role: Role | null) => void;
  inventory: InventoryItem[];
  setInventory: React.Dispatch<React.SetStateAction<InventoryItem[]>>;
  inventoryPagination: PaginationInfo | null;
  catalogue: CatalogueEntry[];
  cataloguePagination: PaginationInfo | null;
  vendors: Vendor[];
  vendorsPagination: PaginationInfo | null;
  pos: PurchaseOrder[];
  posPagination: PaginationInfo | null;
  plans: MaterialPlan[];
  plansPagination: PaginationInfo | null;
  grns: GRN[];
  grnsPagination: PaginationInfo | null;
  inwards: Inward[];
  inwardsPagination: PaginationInfo | null;
  outwards: Outward[];
  outwardsPagination: PaginationInfo | null;
  materialTransferOutwards: MaterialTransferOutward[];
  materialTransferOutwardsPagination: PaginationInfo | null;
  materialTransferInwards: MaterialTransferInward[];
  materialTransferInwardsPagination: PaginationInfo | null;
  inwardReturns: InwardReturn[];
  inwardReturnsPagination: PaginationInfo | null;
  outwardReturns: OutwardReturn[];
  outwardReturnsPagination: PaginationInfo | null;
  writeOffs: WriteOff[];
  writeOffsPagination: PaginationInfo | null;
  stockCheckReports: StockCheckReport[];
  stockCheckReportsPagination: PaginationInfo | null;
  settings: {
    poThreshold: number;
    minQuotesLow: number;
    minQuotesHigh: number;
  };
  setSettings: React.Dispatch<
    React.SetStateAction<{
      poThreshold: number;
      minQuotesLow: number;
      minQuotesHigh: number;
    }>
  >;
  saveSettings: (data: {
    poThreshold: number;
    minQuotesLow: number;
    minQuotesHigh: number;
  }) => Promise<void>;
  loading: boolean;
  isAuthLoading: boolean;
  actionLoading: boolean;
  setActionLoading: React.Dispatch<React.SetStateAction<boolean>>;
  refreshData: () => Promise<void>;
  fetchResource: (resource: string, page?: number, limit?: number, silent?: boolean, filters?: any) => Promise<void>;
  updateInventory: (sku: string, data: Partial<InventoryItem>) => Promise<void>;
  addInventory: (data: InventoryItem) => Promise<void>;
  deleteInventory: (sku: string) => Promise<void>;
  updateCatalogue: (sku: string, data: Partial<CatalogueEntry>) => Promise<void>;
  addCatalogue: (data: CatalogueEntry) => Promise<void>;
  deleteCatalogue: (sku: string) => Promise<void>;
  updateVendor: (id: string, data: Partial<Vendor>) => Promise<void>;
  addVendor: (data: Vendor) => Promise<void>;
  deleteVendor: (id: string) => Promise<void>;
  updatePO: (id: string, data: Partial<PurchaseOrder>) => Promise<void>;
  addPO: (data: PurchaseOrder) => Promise<void>;
  deletePO: (id: string) => Promise<void>;
  updatePlan: (id: string, data: Partial<MaterialPlan>) => Promise<void>;
  addPlan: (data: MaterialPlan) => Promise<void>;
  deletePlan: (id: string) => Promise<void>;
  updateGRN: (id: string, data: Partial<GRN>) => Promise<void>;
  addGRN: (data: GRN) => Promise<void>;
  deleteGRN: (id: string) => Promise<void>;
  addInward: (data: Inward) => Promise<void>;
  deleteInward: (id: string) => Promise<void>;
  updateOutward: (id: string, data: Partial<Outward>) => Promise<void>;
  addOutward: (data: Outward) => Promise<void>;
  deleteOutward: (id: string) => Promise<void>;
  addMaterialTransferOutward: (data: MaterialTransferOutward) => Promise<void>;
  deleteMaterialTransferOutward: (id: string) => Promise<void>;
  updateMaterialTransferOutward: (id: string, data: Partial<MaterialTransferOutward>) => Promise<void>;
  addMaterialTransferInward: (data: MaterialTransferInward) => Promise<void>;
  deleteMaterialTransferInward: (id: string) => Promise<void>;
  updateMaterialTransferInward: (id: string, data: Partial<MaterialTransferInward>) => Promise<void>;
  addInwardReturn: (data: InwardReturn) => Promise<void>;
  deleteInwardReturn: (id: string) => Promise<void>;
  addOutwardReturn: (data: OutwardReturn) => Promise<void>;
  deleteOutwardReturn: (id: string) => Promise<void>;
  updateWriteOff: (id: string, data: Partial<WriteOff>) => Promise<void>;
  addWriteOff: (data: WriteOff) => Promise<void>;
  deleteWriteOff: (id: string) => Promise<void>;
  submitStockCheck: (report: Partial<StockCheckReport>) => Promise<void>;
  uploadImage: (file: File) => Promise<{ url: string }>;
  fetchPublicInventory: () => Promise<InventoryItem[]>;
  fetchPublicVendors: () => Promise<Vendor[]>;
  fetchPublicCatalogue: () => Promise<CatalogueEntry[]>;
  submitPublicPO: (data: any) => Promise<void>;
  submitPublicInward: (data: any) => Promise<void>;
  submitPublicOutward: (data: any) => Promise<void>;
  submitPublicMaterialTransferOutward: (data: any) => Promise<void>;
  submitPublicMaterialTransferInward: (data: any) => Promise<void>;
  uploadPublicImage: (file: File) => Promise<{ url: string }>;
  stats: {
    totalSKUs: number;
    inStock: number;
    reusable: number;
    pendingPOs: number;
    lowStockCount: number;
    pendingWriteOffs: number;
    outOfStock: number;
    categoriesCount: number;
  };
  fetchStats: () => Promise<void>;
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Notification) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
}

const AppContext = createContext<AppState | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<any | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [theme, setTheme] = useState<'light' | 'dark'>(
    (localStorage.getItem('theme') as 'light' | 'dark') || 'light'
  );
  const [role, setRole] = useState<Role | null>(null);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [inventoryPagination, setInventoryPagination] = useState<PaginationInfo | null>(null);
  const [catalogue, setCatalogue] = useState<CatalogueEntry[]>([]);
  const [cataloguePagination, setCataloguePagination] = useState<PaginationInfo | null>(null);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [vendorsPagination, setVendorsPagination] = useState<PaginationInfo | null>(null);
  const [pos, setPos] = useState<PurchaseOrder[]>([]);
  const [posPagination, setPosPagination] = useState<PaginationInfo | null>(null);
  const [plans, setPlans] = useState<MaterialPlan[]>([]);
  const [plansPagination, setPlansPagination] = useState<PaginationInfo | null>(null);
  const [grns, setGrns] = useState<GRN[]>([]);
  const [grnsPagination, setGrnsPagination] = useState<PaginationInfo | null>(null);
  const [inwards, setInwards] = useState<Inward[]>([]);
  const [inwardsPagination, setInwardsPagination] = useState<PaginationInfo | null>(null);
  const [outwards, setOutwards] = useState<Outward[]>([]);
  const [outwardsPagination, setOutwardsPagination] = useState<PaginationInfo | null>(null);
  const [materialTransferOutwards, setMaterialTransferOutwards] = useState<MaterialTransferOutward[]>([]);
  const [materialTransferOutwardsPagination, setMaterialTransferOutwardsPagination] = useState<PaginationInfo | null>(null);
  const [materialTransferInwards, setMaterialTransferInwards] = useState<MaterialTransferInward[]>([]);
  const [materialTransferInwardsPagination, setMaterialTransferInwardsPagination] = useState<PaginationInfo | null>(null);
  const [inwardReturns, setInwardReturns] = useState<InwardReturn[]>([]);
  const [inwardReturnsPagination, setInwardReturnsPagination] = useState<PaginationInfo | null>(null);
  const [outwardReturns, setOutwardReturns] = useState<OutwardReturn[]>([]);
  const [outwardReturnsPagination, setOutwardReturnsPagination] = useState<PaginationInfo | null>(null);
  const [writeOffs, setWriteOffs] = useState<WriteOff[]>([]);
  const [writeOffsPagination, setWriteOffsPagination] = useState<PaginationInfo | null>(null);
  const [stockCheckReports, setStockCheckReports] = useState<StockCheckReport[]>([]);
  const [stockCheckReportsPagination, setStockCheckReportsPagination] = useState<PaginationInfo | null>(null);
  const [stats, setStats] = useState({
    totalSKUs: 0,
    inStock: 0,
    reusable: 0,
    pendingPOs: 0,
    lowStockCount: 0,
    pendingWriteOffs: 0,
    outOfStock: 0,
    categoriesCount: 0,
  });
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const unreadCount = notifications.filter(n => !n.read).length;

  const addNotification = (notification: Notification) => {
    setNotifications(prev => [notification, ...prev].slice(0, 50)); // Keep last 50
  };

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  const [settings, setSettings] = useState({
    poThreshold: 25000,
    minQuotesLow: 2,
    minQuotesHigh: 3,
  });

  const saveSettings = async (data: any) => {
    setActionLoading(true);
    try {
      const res = await api.putSimple('settings', data);
      setSettings(res);
    } catch (error) {
      console.error("Failed to save settings:", error);
      throw error;
    } finally {
      setActionLoading(false);
    }
  };
  const [loading, setLoading] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  const login = async (email: string, password: string) => {
    try {
      console.log(`Attempting login for: ${email}`);
      const userData = await api.post('auth/login', { email, password });
      console.log(`Login successful for: ${email}`, userData);
      setUser(userData);
      setRole(userData.role);
      setIsAuthenticated(true);
      // Don't await refreshData here to enter the app immediately
      refreshData();
      return true;
    } catch (error) {
      console.error("Login failed:", error);
      return false;
    }
  };

  const logout = async () => {
    await api.post('auth/logout', {});
    setUser(null);
    setRole(null);
    setIsAuthenticated(false);
  };

  const checkAuth = async () => {
    setIsAuthLoading(true);
    try {
      const res = await api.get('auth/me');
      if (res.success) {
        setUser(res.data);
        setRole(res.data.role);
        setIsAuthenticated(true);
        // Don't await refreshData here to avoid blocking the app initialization
        refreshData();
      } else {
        setUser(null);
        setRole(null);
        setIsAuthenticated(false);
      }
    } catch (error) {
      setUser(null);
      setRole(null);
      setIsAuthenticated(false);
    } finally {
      setIsAuthLoading(false);
    }
  };

  const fetchResource = useCallback(async (resource: string, page = 1, limit = 50, silent = false, filters = {}) => {
    if (!silent) setLoading(true);
    try {
      const res = await api.get(resource, { page, limit, ...filters });
      if (res.success) {
        switch (resource) {
          case 'inventory':
            setInventory(res.data);
            setInventoryPagination(res.pagination);
            break;
          case 'catalogue':
            setCatalogue(res.data);
            setCataloguePagination(res.pagination);
            break;
          case 'vendors':
            setVendors(res.data);
            setVendorsPagination(res.pagination);
            break;
          case 'pos':
            setPos(res.data);
            setPosPagination(res.pagination);
            break;
          case 'planning':
            setPlans(res.data);
            setPlansPagination(res.pagination);
            break;
          case 'grn':
            setGrns(res.data);
            setGrnsPagination(res.pagination);
            break;
          case 'settings':
            setSettings(res.data);
            break;
          case 'inward':
            setInwards(res.data);
            setInwardsPagination(res.pagination);
            break;
          case 'outward':
            setOutwards(res.data);
            setOutwardsPagination(res.pagination);
            break;
          case 'material-transfer-outward':
            setMaterialTransferOutwards(res.data);
            setMaterialTransferOutwardsPagination(res.pagination);
            break;
          case 'material-transfer-inward':
            setMaterialTransferInwards(res.data);
            setMaterialTransferInwardsPagination(res.pagination);
            break;
          case 'inward-returns':
            setInwardReturns(res.data);
            setInwardReturnsPagination(res.pagination);
            break;
          case 'outward-returns':
            setOutwardReturns(res.data);
            setOutwardReturnsPagination(res.pagination);
            break;
          case 'writeoffs':
            setWriteOffs(res.data);
            setWriteOffsPagination(res.pagination);
            break;
          case 'stock-check-reports':
            setStockCheckReports(res.data);
            setStockCheckReportsPagination(res.pagination);
            break;
        }
      }
    } catch (error) {
      console.error(`Failed to fetch ${resource}:`, error);
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  const refreshData = useCallback(async () => {
    // Don't set global loading here to avoid "faltu loader" on initial load
    try {
      await Promise.all([
        fetchResource('inventory', 1, 50, true),
        fetchResource('catalogue', 1, 50, true),
        fetchResource('vendors', 1, 50, true),
        fetchResource('pos', 1, 50, true),
        fetchResource('planning', 1, 50, true),
        fetchResource('grn', 1, 50, true),
        fetchResource('inward', 1, 50, true),
        fetchResource('outward', 1, 50, true),
        fetchResource('material-transfer-outward', 1, 50, true),
        fetchResource('material-transfer-inward', 1, 50, true),
        fetchResource('inward-returns', 1, 50, true),
        fetchResource('outward-returns', 1, 50, true),
        fetchResource('writeoffs', 1, 50, true),
        fetchResource('stock-check-reports', 1, 50, true),
        fetchResource('settings', 1, 1, true),
        fetchStats(),
      ]);

      // If database is empty, seed it
      const res = await api.get('inventory', { limit: 1 });
      if (res.success && res.pagination.total === 0) {
        await api.seed({
          SEED_INVENTORY,
          SEED_CATALOGUE,
          SEED_VENDORS,
          SEED_POS
        });
        await refreshData();
      }
    } catch (error) {
      console.error("Failed to refresh data:", error);
    }
  }, [fetchResource]);

  const fetchStats = async () => {
    try {
      const res = await api.get('stats');
      if (res.success) {
        setStats(res.data);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const updateInventory = async (sku: string, data: Partial<InventoryItem>) => {
    setActionLoading(true);
    try {
      const updated = await api.put('inventory', sku, data);
      setInventory(prev => prev.map(item => item.sku === sku ? { ...item, ...updated } : item));
    } finally {
      setActionLoading(false);
    }
  };

  const addInventory = async (data: InventoryItem) => {
    setActionLoading(true);
    try {
      await api.post('inventory', data);
      await fetchResource('inventory', 1, 50, true);
    } finally {
      setActionLoading(false);
    }
  };

  const deleteInventory = async (sku: string) => {
    setActionLoading(true);
    try {
      await api.delete('inventory', sku);
      await fetchResource('inventory', 1, 50, true);
    } finally {
      setActionLoading(false);
    }
  };

  const updateCatalogue = async (sku: string, data: Partial<CatalogueEntry>) => {
    setActionLoading(true);
    try {
      const updated = await api.put('catalogue', sku, data);
      setCatalogue(prev => prev.map(item => item.sku === sku ? { ...item, ...updated } : item));
    } finally {
      setActionLoading(false);
    }
  };

  const addCatalogue = async (data: CatalogueEntry) => {
    setActionLoading(true);
    try {
      await api.post('catalogue', data);
      await fetchResource('catalogue', 1, 50, true);
    } finally {
      setActionLoading(false);
    }
  };

  const deleteCatalogue = async (sku: string) => {
    setActionLoading(true);
    try {
      await api.delete('catalogue', sku);
      await fetchResource('catalogue', 1, 50, true);
    } finally {
      setActionLoading(false);
    }
  };

  const updateVendor = async (id: string, data: Partial<Vendor>) => {
    setActionLoading(true);
    try {
      const updated = await api.put('vendors', id, data);
      setVendors(prev => prev.map(item => item.id === id ? { ...item, ...updated } : item));
    } finally {
      setActionLoading(false);
    }
  };

  const addVendor = async (data: Vendor) => {
    setActionLoading(true);
    try {
      await api.post('vendors', data);
      await fetchResource('vendors');
    } finally {
      setActionLoading(false);
    }
  };

  const deleteVendor = async (id: string) => {
    setActionLoading(true);
    try {
      await api.delete('vendors', id);
      await fetchResource('vendors');
    } finally {
      setActionLoading(false);
    }
  };

  const updatePO = async (id: string, data: Partial<PurchaseOrder>) => {
    setActionLoading(true);
    try {
      const updated = await api.put('pos', id, data);
      setPos(prev => prev.map(item => item.id === id ? { ...item, ...updated } : item));
    } finally {
      setActionLoading(false);
    }
  };

  const addPO = async (data: PurchaseOrder) => {
    setActionLoading(true);
    try {
      await api.post('pos', data);
      await fetchResource('pos');
    } finally {
      setActionLoading(false);
    }
  };

  const deletePO = async (id: string) => {
    setActionLoading(true);
    try {
      await api.delete('pos', id);
      await fetchResource('pos');
    } finally {
      setActionLoading(false);
    }
  };

  const updatePlan = async (id: string, data: Partial<MaterialPlan>) => {
    setActionLoading(true);
    try {
      const updated = await api.put('planning', id, data);
      setPlans(prev => prev.map(item => item.id === id ? { ...item, ...updated } : item));
    } finally {
      setActionLoading(false);
    }
  };

  const addPlan = async (data: MaterialPlan) => {
    setActionLoading(true);
    try {
      await api.post('planning', data);
      await fetchResource('planning');
    } finally {
      setActionLoading(false);
    }
  };

  const deletePlan = async (id: string) => {
    setActionLoading(true);
    try {
      await api.delete('planning', id);
      await fetchResource('planning');
    } finally {
      setActionLoading(false);
    }
  };

  const updateGRN = async (id: string, data: Partial<GRN>) => {
    setActionLoading(true);
    try {
      const updated = await api.put('grn', id, data);
      setGrns(prev => prev.map(item => item.id === id ? { ...item, ...updated } : item));
    } finally {
      setActionLoading(false);
    }
  };

  const addGRN = async (data: GRN) => {
    setActionLoading(true);
    try {
      await api.post('grn', data);
      await fetchResource('grn');
    } finally {
      setActionLoading(false);
    }
  };

  const deleteGRN = async (id: string) => {
    setActionLoading(true);
    try {
      await api.delete('grn', id);
      await fetchResource('grn');
    } finally {
      setActionLoading(false);
    }
  };

  const addInward = async (data: Inward) => {
    setActionLoading(true);
    try {
      await api.post('inward', data);
      await fetchResource('inward', 1, 50, true);
    } finally {
      setActionLoading(false);
    }
  };

  const deleteInward = async (id: string) => {
    setActionLoading(true);
    try {
      await api.delete('inward', id);
      await fetchResource('inward', 1, 50, true);
    } finally {
      setActionLoading(false);
    }
  };

  const updateOutward = async (id: string, data: Partial<Outward>) => {
    setActionLoading(true);
    try {
      const updated = await api.put('outward', id, data);
      setOutwards(prev => prev.map(item => item.id === id ? { ...item, ...updated } : item));
    } finally {
      setActionLoading(false);
    }
  };

  const addOutward = async (data: Outward) => {
    setActionLoading(true);
    try {
      await api.post('outward', data);
      await fetchResource('outward');
    } finally {
      setActionLoading(false);
    }
  };

  const deleteOutward = async (id: string) => {
    setActionLoading(true);
    try {
      await api.delete('outward', id);
      await fetchResource('outward');
    } finally {
      setActionLoading(false);
    }
  };
  
  const addMaterialTransferOutward = async (data: MaterialTransferOutward) => {
    setActionLoading(true);
    try {
      await api.post('material-transfer-outward', data);
      await fetchResource('material-transfer-outward');
    } finally {
      setActionLoading(false);
    }
  };

  const deleteMaterialTransferOutward = async (id: string) => {
    setActionLoading(true);
    try {
      await api.delete('material-transfer-outward', id);
      await fetchResource('material-transfer-outward');
    } finally {
      setActionLoading(false);
    }
  };

  const updateMaterialTransferOutward = async (id: string, data: Partial<MaterialTransferOutward>) => {
    setActionLoading(true);
    try {
      await api.put('material-transfer-outward', id, data);
      await fetchResource('material-transfer-outward');
    } finally {
      setActionLoading(false);
    }
  };

  const addMaterialTransferInward = async (data: MaterialTransferInward) => {
    setActionLoading(true);
    try {
      await api.post('material-transfer-inward', data);
      await fetchResource('material-transfer-inward');
    } finally {
      setActionLoading(false);
    }
  };

  const deleteMaterialTransferInward = async (id: string) => {
    setActionLoading(true);
    try {
      await api.delete('material-transfer-inward', id);
      await fetchResource('material-transfer-inward');
    } finally {
      setActionLoading(false);
    }
  };

  const updateMaterialTransferInward = async (id: string, data: Partial<MaterialTransferInward>) => {
    setActionLoading(true);
    try {
      await api.put('material-transfer-inward', id, data);
      await fetchResource('material-transfer-inward');
    } finally {
      setActionLoading(false);
    }
  };

  const addInwardReturn = async (data: InwardReturn) => {
    setActionLoading(true);
    try {
      await api.post('inward-returns', data);
      await fetchResource('inward-returns');
    } finally {
      setActionLoading(false);
    }
  };

  const deleteInwardReturn = async (id: string) => {
    setActionLoading(true);
    try {
      await api.delete('inward-returns', id);
      await fetchResource('inward-returns');
    } finally {
      setActionLoading(false);
    }
  };

  const addOutwardReturn = async (data: OutwardReturn) => {
    setActionLoading(true);
    try {
      await api.post('outward-returns', data);
      await fetchResource('outward-returns');
    } finally {
      setActionLoading(false);
    }
  };

  const deleteOutwardReturn = async (id: string) => {
    setActionLoading(true);
    try {
      await api.delete('outward-returns', id);
      await fetchResource('outward-returns');
    } finally {
      setActionLoading(false);
    }
  };

  const updateWriteOff = async (id: string, data: Partial<WriteOff>) => {
    setActionLoading(true);
    try {
      const updated = await api.put('writeoffs', id, data);
      setWriteOffs(prev => prev.map(item => item.id === id ? { ...item, ...updated } : item));
    } finally {
      setActionLoading(false);
    }
  };

  const addWriteOff = async (data: WriteOff) => {
    setActionLoading(true);
    try {
      await api.post('writeoffs', data);
      await fetchResource('writeoffs');
    } finally {
      setActionLoading(false);
    }
  };

  const deleteWriteOff = async (id: string) => {
    setActionLoading(true);
    try {
      await api.delete('writeoffs', id);
      await fetchResource('writeoffs');
    } finally {
      setActionLoading(false);
    }
  };

  const submitStockCheck = async (report: Partial<StockCheckReport>) => {
    setActionLoading(true);
    try {
      await api.post('stock-check', { report });
      await Promise.all([
        fetchResource('inventory'),
        fetchResource('stock-check-reports')
      ]);
    } finally {
      setActionLoading(false);
    }
  };

  const uploadImage = async (file: File) => {
    return await api.upload(file);
  };

  const fetchPublicInventory = async () => {
    const res = await api.get('public/inventory');
    return res.data;
  };

  const fetchPublicVendors = async () => {
    const res = await api.get('public/vendors');
    return res.data;
  };

  const fetchPublicCatalogue = async () => {
    const res = await api.get('public/catalogue');
    return res.data;
  };

  const submitPublicPO = async (data: any) => {
    setActionLoading(true);
    try {
      await api.post('public/po', data);
    } finally {
      setActionLoading(false);
    }
  };

  const submitPublicInward = async (data: any) => {
    setActionLoading(true);
    try {
      await api.post('public/inward', data);
    } finally {
      setActionLoading(false);
    }
  };

  const submitPublicOutward = async (data: any) => {
    setActionLoading(true);
    try {
      await api.post('public/outward', data);
    } finally {
      setActionLoading(false);
    }
  };

  const submitPublicMaterialTransferOutward = async (data: any) => {
    setActionLoading(true);
    try {
      await api.post('public/material-transfer-outward', data);
    } finally {
      setActionLoading(false);
    }
  };

  const submitPublicMaterialTransferInward = async (data: any) => {
    setActionLoading(true);
    try {
      await api.post('public/material-transfer-inward', data);
    } finally {
      setActionLoading(false);
    }
  };

  const uploadPublicImage = async (file: File) => {
    try {
      return await api.publicUpload(file);
    } catch (error: any) {
      console.error('Public upload error:', error);
      throw new Error(error.response?.data?.message || 'Failed to upload image');
    }
  };

  useEffect(() => {
    checkAuth();
    document.documentElement.classList.toggle('dark', theme === 'dark');

    // Set up WebSocket for real-time updates
    let socket: WebSocket;
    let reconnectTimeout: any;

    const connectWS = () => {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}`;
      socket = new WebSocket(wsUrl);

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'DATA_UPDATED') {
            console.log('Data updated remotely, refreshing...', data.path);
            if (data.path === 'all') {
              refreshData();
            } else {
              // Use silent: true to avoid "faltu loader" on real-time updates
              fetchResource(data.path, 1, 50, true);
            }
          } else if (data.type === 'NOTIFICATION') {
            const { message, severity, path, senderId } = data;
            
            // Add to notifications list
            const newNotification: Notification = {
              id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              message,
              severity: severity || 'info',
              timestamp: new Date().toISOString(),
              read: false,
              senderId,
              path: path || (message.toLowerCase().includes('po') || message.toLowerCase().includes('purchase order') ? 'pos' : 
                     message.toLowerCase().includes('grn') ? 'grn' : 
                     message.toLowerCase().includes('inventory') ? 'inventory' : 
                     message.toLowerCase().includes('stock check') ? 'stockcheck-reports' : 'dashboard')
            };
            
            addNotification(newNotification);

            // Only show toast if it's not from the current user
            // (Current user already gets a local success toast from the action)
            if (senderId !== user?.id) {
              switch (severity) {
                case 'success':
                  toast.success(message, { duration: 5000 });
                  break;
                case 'warning':
                  toast.error(message, { duration: 6000, icon: '⚠️' });
                  break;
                case 'error':
                  toast.error(message, { duration: 8000 });
                  break;
                default:
                  toast(message, { duration: 5000, icon: 'ℹ️' });
              }
            }
          }
        } catch (err) {
          console.error('Failed to parse WebSocket message:', err);
        }
      };

      socket.onclose = () => {
        console.log('WebSocket connection closed. Reconnecting in 5s...');
        reconnectTimeout = setTimeout(connectWS, 5000);
      };

      socket.onerror = (err) => {
        console.error('WebSocket error:', err);
        socket.close();
      };
    };

    connectWS();

    return () => {
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (socket) socket.close();
    };
  }, []);

  return (
    <AppContext.Provider
      value={{
        user,
        isAuthenticated,
        login,
        logout,
        checkAuth,
        theme,
        toggleTheme,
        role,
        setRole,
        inventory,
        setInventory,
        inventoryPagination,
        catalogue,
        cataloguePagination,
        vendors,
        vendorsPagination,
        pos,
        posPagination,
        plans,
        plansPagination,
        grns,
        grnsPagination,
        inwards,
        inwardsPagination,
        outwards,
        outwardsPagination,
        materialTransferOutwards,
        materialTransferOutwardsPagination,
        materialTransferInwards,
        materialTransferInwardsPagination,
        inwardReturns,
        inwardReturnsPagination,
        outwardReturns,
        outwardReturnsPagination,
        writeOffs,
        writeOffsPagination,
        stockCheckReports,
        stockCheckReportsPagination,
        settings,
        setSettings,
        saveSettings,
        loading,
        isAuthLoading,
        actionLoading,
        setActionLoading,
        refreshData,
        fetchResource,
        updateInventory,
        addInventory,
        deleteInventory,
        updateCatalogue,
        addCatalogue,
        deleteCatalogue,
        updateVendor,
        addVendor,
        deleteVendor,
        updatePO,
        addPO,
        deletePO,
        updatePlan,
        addPlan,
        deletePlan,
        updateGRN,
        addGRN,
        deleteGRN,
        addInward,
        deleteInward,
        updateOutward,
        addOutward,
        deleteOutward,
        addMaterialTransferOutward,
        deleteMaterialTransferOutward,
        updateMaterialTransferOutward,
        addMaterialTransferInward,
        deleteMaterialTransferInward,
        updateMaterialTransferInward,
        addInwardReturn,
        deleteInwardReturn,
        addOutwardReturn,
        deleteOutwardReturn,
        updateWriteOff,
        addWriteOff,
        deleteWriteOff,
        submitStockCheck,
        uploadImage,
        fetchPublicInventory,
        fetchPublicVendors,
        fetchPublicCatalogue,
        submitPublicPO,
        submitPublicInward,
        submitPublicOutward,
        submitPublicMaterialTransferOutward,
        submitPublicMaterialTransferInward,
        uploadPublicImage,
        stats,
        fetchStats,
        notifications,
        unreadCount,
        addNotification,
        markAsRead,
        markAllAsRead,
        clearNotifications,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppStore = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useAppStore must be used within AppProvider");
  return context;
};
