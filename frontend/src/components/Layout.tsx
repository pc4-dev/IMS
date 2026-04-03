import React, { useState } from "react";
import { useAppStore } from "../store";
import {
  LayoutDashboard,
  ShieldAlert,
  BookOpen,
  Users,
  Package,
  ClipboardList,
  ShoppingCart,
  ArrowDownToLine,
  ArrowUpFromLine,
  Undo2,
  Trash2,
  CheckSquare,
  FileText,
  Archive,
  LogOut,
  Menu,
  X,
  Bell,
  Check,
  CheckCircle2,
  AlertCircle,
  Info,
} from "lucide-react";
import { ROUTES } from "../routes";
import { ThemeToggle } from "./ui";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "motion/react";

export const Layout = ({ children }: { children: React.ReactNode }) => {
  const { 
    user, 
    logout, 
    theme, 
    toggleTheme, 
    notifications, 
    unreadCount, 
    markAsRead, 
    markAllAsRead, 
    clearNotifications 
  } = useAppStore();
  const role = user?.role;
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const handleNotificationClick = (notification: any) => {
    markAsRead(notification.id);
    if (notification.path) {
      window.location.hash = notification.path;
    }
    setShowNotifications(false);
  };

  const handleLogout = async () => {
    try {
      await logout();
      toast.success("Logged out successfully");
    } catch (error) {
      toast.error("Logout failed");
    }
  };

  const visibleNav = ROUTES.filter((item) => item.roles.includes(role || ""));

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-950 font-sans text-gray-900 dark:text-gray-100 overflow-hidden transition-colors duration-300">
      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 lg:relative lg:flex flex-col bg-gray-900 dark:bg-black text-white transition-all duration-300 shrink-0
          ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
          ${collapsed ? "lg:w-16" : "lg:w-[230px] w-[260px]"}
        `}
      >
        <div className="h-14 flex items-center px-4 border-b border-white/10 shrink-0">
          <div className="w-8 h-8 bg-primary rounded flex items-center justify-center font-bold text-lg shrink-0">
            N
          </div>
          {(!collapsed || mobileMenuOpen) && (
            <span className="ml-3 font-bold truncate">Garden City</span>
          )}
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="ml-auto lg:hidden p-2 text-gray-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-4 custom-scrollbar">
          {visibleNav.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center px-4 py-3 text-gray-300 hover:bg-white/5 hover:text-white border-l-2 border-transparent hover:border-primary transition-colors"
            >
              <item.icon className="w-5 h-5 shrink-0" />
              {(!collapsed || mobileMenuOpen) && (
                <span className="ml-3 text-[13px] font-medium truncate">
                  {item.label}
                </span>
              )}
            </a>
          ))}
        </div>

        <div className="p-4 border-t border-white/10 shrink-0">
          <button
            onClick={handleLogout}
            className="flex items-center w-full text-gray-400 hover:text-white transition-colors"
          >
            <LogOut className="w-5 h-5 shrink-0" />
            {(!collapsed || mobileMenuOpen) && (
              <span className="ml-3 text-[13px] font-medium">Sign Out</span>
            )}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-14 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-4 shrink-0 transition-colors duration-300">
          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                if (window.innerWidth < 1024) {
                  setMobileMenuOpen(true);
                } else {
                  setCollapsed(!collapsed);
                }
              }}
              className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="text-[13px] text-gray-500 dark:text-gray-400 hidden sm:block">
              Garden City /{" "}
              <span className="text-gray-900 dark:text-white font-medium capitalize">
                {ROUTES.find(r => r.id === window.location.hash.replace("#", ""))?.label || "Dashboard"}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors relative"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white dark:border-gray-900">
                    {unreadCount}
                  </span>
                )}
              </button>

              <AnimatePresence>
                {showNotifications && (
                  <>
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setShowNotifications(false)} 
                    />
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-xl z-50 overflow-hidden"
                    >
                      <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between bg-gray-50/50 dark:bg-gray-800/50">
                        <h3 className="font-bold text-sm">Notifications</h3>
                        <div className="flex gap-2">
                          {unreadCount > 0 && (
                            <button
                              onClick={markAllAsRead}
                              className="text-[11px] text-primary hover:underline font-medium"
                            >
                              Mark all read
                            </button>
                          )}
                          <button
                            onClick={clearNotifications}
                            className="text-[11px] text-gray-500 hover:text-red-500 font-medium"
                          >
                            Clear
                          </button>
                        </div>
                      </div>
                      <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                        {notifications.length === 0 ? (
                          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                            <Bell className="w-8 h-8 mx-auto mb-2 opacity-20" />
                            <p className="text-[13px]">No notifications yet</p>
                          </div>
                        ) : (
                          notifications.map((n) => (
                            <button
                              key={n.id}
                              onClick={() => handleNotificationClick(n)}
                              className={`w-full p-4 text-left border-b border-gray-100 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors flex gap-3 ${!n.read ? "bg-primary/5 dark:bg-primary/10" : ""}`}
                            >
                              <div className={`mt-1 w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                                n.severity === 'success' ? 'bg-green-100 text-green-600 dark:bg-green-900/30' :
                                n.severity === 'warning' ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/30' :
                                n.severity === 'error' ? 'bg-red-100 text-red-600 dark:bg-red-900/30' :
                                'bg-blue-100 text-blue-600 dark:bg-blue-900/30'
                              }`}>
                                {n.severity === 'success' ? <CheckCircle2 className="w-4 h-4" /> :
                                 n.severity === 'warning' ? <AlertCircle className="w-4 h-4" /> :
                                 n.severity === 'error' ? <X className="w-4 h-4" /> :
                                 <Info className="w-4 h-4" />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className={`text-[13px] leading-snug ${!n.read ? "font-semibold text-gray-900 dark:text-white" : "text-gray-600 dark:text-gray-400"}`}>
                                  {n.message}
                                </p>
                                <p className="text-[11px] text-gray-400 mt-1">
                                  {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                              </div>
                              {!n.read && (
                                <div className="w-2 h-2 bg-primary rounded-full mt-2 shrink-0" />
                              )}
                            </button>
                          ))
                        )}
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
            <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <div className="text-[13px] font-bold text-gray-900 dark:text-white">
                  {user?.name}
                </div>
                <div className="text-[11px] text-gray-500 dark:text-gray-400">
                  {role}
                </div>
              </div>
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${role === "Super Admin" ? "bg-gradient-to-br from-purple-600 to-purple-800" : "bg-primary"}`}
              >
                {user?.name?.charAt(0)}
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 bg-gray-50 dark:bg-gray-950 transition-colors duration-300">
          {children}
        </main>
      </div>
    </div>
  );
};
