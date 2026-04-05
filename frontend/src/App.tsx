import React, { useEffect, useState } from "react";
import { AppProvider, useAppStore } from "./store";
import { Layout } from "./components/Layout";
import { Toaster } from "react-hot-toast";
import { Login } from "./pages/Login";
import { Dashboard } from "./pages/Dashboard";
import { Inventory } from "./pages/Inventory";
import { PurchaseOrders } from "./pages/PurchaseOrders";
import { MaterialPlanning } from "./pages/MaterialPlanning";
import { GRNPage } from "./pages/GRN";
import { Vendors } from "./pages/Vendors";
import { Catalogue } from "./pages/Catalogue";
import { SuperAdmin } from "./pages/SuperAdmin";
import { OutwardPage } from "./pages/Outward";
import { InwardReturns } from "./pages/InwardReturns";
import { OutwardReturns } from "./pages/OutwardReturns";
import { WriteOffPage } from "./pages/WriteOff";
import { StockCheck } from "./pages/StockCheck";
import { StockCheckReports } from "./pages/StockCheckReports";
import { Archive } from "./pages/Archive";
import { InwardPage } from "./pages/Inward";
import { PublicInward } from "./pages/PublicInward";
import { PublicOutward } from "./pages/PublicOutward";
import { MaterialTransferOutwardPage } from "./pages/MaterialTransferOutward";
import { PublicMaterialTransferOutward } from "./pages/PublicMaterialTransferOutward";
import { MaterialTransferInwardPage } from "./pages/MaterialTransferInward";
import { PublicMaterialTransferInward } from "./pages/PublicMaterialTransferInward";
import { ROUTES } from "./routes";

const AppContent = () => {
  const { isAuthenticated, role, isAuthLoading } = useAppStore();
  const [hash, setHash] = useState(
    window.location.hash.replace("#", "") || "dashboard",
  );

  useEffect(() => {
    if (!isAuthLoading && isAuthenticated && !hash.startsWith("public-")) {
      // Check if current hash is allowed for this role
      const currentRoute = ROUTES.find(r => r.id === hash);
      if (currentRoute && !currentRoute.roles.includes(role || "")) {
        window.location.hash = "dashboard";
        setHash("dashboard");
      }
    }
  }, [isAuthenticated, role, hash, isAuthLoading]);

  useEffect(() => {
    const handleHashChange = () => {
      setHash(window.location.hash.replace("#", "") || "dashboard");
    };
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  // Handle public routes before authentication check
  if (hash === "public-inward") {
    return <PublicInward />;
  }
  if (hash === "public-outward") {
    return <PublicOutward />;
  }
  if (hash === "public-material-transfer-outward") {
    return <PublicMaterialTransferOutward />;
  }
  if (hash === "public-material-transfer-inward") {
    return <PublicMaterialTransferInward />;
  }

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#0F172A] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-500 dark:text-gray-400 font-medium animate-pulse">
            Initializing System...
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login />;
  }

  const renderPage = () => {
    // Public routes are handled before auth check
    
    const currentRoute = ROUTES.find(r => r.id === hash);
    
    // If route exists and user doesn't have role, redirect to dashboard
    if (currentRoute && !currentRoute.roles.includes(role || "")) {
      // Force update hash to dashboard
      if (window.location.hash !== "#dashboard") {
        window.location.hash = "dashboard";
      }
      return <Dashboard />;
    }

    switch (hash) {
      case "dashboard":
        return <Dashboard />;
      case "superadmin":
        return <SuperAdmin />;
      case "catalogue":
        return <Catalogue />;
      case "vendors":
        return <Vendors />;
      case "inventory":
        return <Inventory />;
      case "planning":
        return <MaterialPlanning />;
      case "pos":
        return <PurchaseOrders />;
      case "grn":
        return <GRNPage />;
      case "inward":
        return <InwardPage />;
      case "outward":
        return <OutwardPage />;
      case "material-transfer-outward":
        return <MaterialTransferOutwardPage />;
      case "material-transfer-inward":
        return <MaterialTransferInwardPage />;
      case "inward-returns":
        return <InwardReturns />;
      case "outward-returns":
        return <OutwardReturns />;
      case "writeoffs":
        return <WriteOffPage />;
      case "stockcheck":
        return <StockCheck />;
      case "stockcheck-reports":
        return <StockCheckReports />;
      case "archive":
        return <Archive />;
      default:
        return <Dashboard />;
    }
  };

  return <Layout>{renderPage()}</Layout>;
};

export default function App() {
  return (
    <AppProvider>
      <Toaster position="top-right" />
      <AppContent />
    </AppProvider>
  );
}
