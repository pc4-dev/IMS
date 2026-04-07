import React from "react";
import { X, Loader2, Sun, Moon, AlertCircle, Camera, Upload } from "lucide-react";
import { cn } from "../lib/utils";
import { motion, AnimatePresence } from "motion/react";

export const Card = ({
  children,
  className = "",
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "bg-white dark:bg-[#1E293B] rounded-xl border border-[#E8ECF0] dark:border-[#334155] shadow-[0_1px_4px_rgba(0,0,0,0.08)] dark:shadow-none transition-colors duration-200",
      className
    )}
    {...props}
  >
    {children}
  </div>
);

export const Badge = ({
  text,
  color = "blue",
}: {
  text: string;
  color?: "green" | "red" | "blue" | "yellow" | "purple" | "gray";
}) => {
  const colors = {
    green: "bg-[#ECFDF5] text-[#10B981] dark:bg-[#064E3B] dark:text-[#34D399]",
    red: "bg-[#FEF2F2] text-[#EF4444] dark:bg-[#450A0A] dark:text-[#F87171]",
    blue: "bg-[#EFF6FF] text-[#3B82F6] dark:bg-[#1E3A8A] dark:text-[#60A5FA]",
    yellow: "bg-[#FFFBEB] text-[#F59E0B] dark:bg-[#451A03] dark:text-[#FBBF24]",
    purple: "bg-[#F5F3FF] text-[#8B5CF6] dark:bg-[#2E1065] dark:text-[#A78BFA]",
    gray: "bg-gray-100 text-gray-600 dark:bg-[#334155] dark:text-[#94A3B8]",
  };
  return (
    <span
      className={cn(
        "px-2 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider",
        colors[color]
      )}
    >
      {text}
    </span>
  );
};

export const StatusBadge = ({ status }: { status: string }) => {
  let color: "green" | "red" | "blue" | "yellow" | "purple" | "gray" = "gray";
  if (["Approved", "Active", "Confirmed", "Good", "New", "Fulfilled"].includes(status))
    color = "green";
  else if (
    ["Pending L1", "Pending L2", "Pending Account", "Pending", "Partial", "Needs Repair"].includes(
      status,
    )
  )
    color = "yellow";
  else if (["Blocked", "Damaged", "Rejected"].includes(status)) color = "red";
  else if (["Open"].includes(status)) color = "blue";
  else if (["PO Raised", "Draft"].includes(status)) color = "purple";

  return <Badge text={status} color={color} />;
};

export const Btn = ({
  label,
  onClick,
  color = "primary",
  icon: Icon,
  outline,
  small,
  disabled,
  loading,
  className,
  type = "button",
}: any) => {
  const base =
    "inline-flex items-center justify-center font-semibold rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95";
  const size = small ? "px-3 py-1.5 text-xs" : "px-4 py-2 text-sm";

  let colors = "";
  if (outline) {
    colors = "border border-gray-300 dark:border-[#334155] text-gray-700 dark:text-[#CBD5E1] hover:bg-gray-50 dark:hover:bg-[#334155] bg-white dark:bg-transparent";
  } else if (color === "primary") {
    colors = "bg-[#F97316] text-white hover:bg-[#ea580c] shadow-sm shadow-orange-200 dark:shadow-none";
  } else if (color === "purple") {
    colors = "bg-[#8B5CF6] text-white hover:bg-[#7c3aed] shadow-sm shadow-purple-200 dark:shadow-none";
  } else if (color === "red") {
    colors = "bg-[#EF4444] text-white hover:bg-[#dc2626] shadow-sm shadow-red-200 dark:shadow-none";
  } else if (color === "green") {
    colors = "bg-[#10B981] text-white hover:bg-[#059669] shadow-sm shadow-green-200 dark:shadow-none";
  } else {
    colors = "bg-gray-800 dark:bg-[#334155] text-white hover:bg-gray-900 dark:hover:bg-[#475569]";
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={cn(base, size, colors, className)}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin mr-2" />
      ) : Icon ? (
        <Icon className={cn("w-4 h-4", label ? "mr-2" : "")} />
      ) : null}
      {label}
    </button>
  );
};

export const Field = ({
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  disabled,
  required,
  error,
  className,
}: any) => (
  <div className={cn("mb-4", className)}>
    {label && (
      <label className="block text-[11px] font-bold text-[#6B7280] dark:text-[#94A3B8] uppercase tracking-wider mb-1.5">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
    )}
    <input
      type={type}
      value={value ?? ""}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      className={cn(
        "w-full px-3 py-2.5 bg-white dark:bg-[#0F172A] border border-[#E8ECF0] dark:border-[#334155] rounded-lg text-[13px] text-[#1A1A2E] dark:text-[#F1F5F9] transition-all duration-200 focus:outline-none focus:border-[#F97316] focus:ring-2 focus:ring-[#F97316]/20 disabled:bg-gray-50 dark:disabled:bg-[#1E293B] disabled:text-gray-500",
        error && "border-red-500 focus:border-red-500 focus:ring-red-500/20"
      )}
    />
    {error && <p className="text-[11px] text-red-500 mt-1 font-medium">{error}</p>}
  </div>
);

export const SField = ({
  label,
  value,
  onChange,
  options,
  disabled,
  required,
  error,
  placeholder = "Select...",
  className,
}: any) => (
  <div className={cn("mb-4", className)}>
    {label && (
      <label className="block text-[11px] font-bold text-[#6B7280] dark:text-[#94A3B8] uppercase tracking-wider mb-1.5">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
    )}
    <select
      value={value ?? ""}
      onChange={onChange}
      disabled={disabled}
      className={cn(
        "w-full px-3 py-2.5 bg-white dark:bg-[#0F172A] border border-[#E8ECF0] dark:border-[#334155] rounded-lg text-[13px] text-[#1A1A2E] dark:text-[#F1F5F9] transition-all duration-200 focus:outline-none focus:border-[#F97316] focus:ring-2 focus:ring-[#F97316]/20 disabled:bg-gray-50 dark:disabled:bg-[#1E293B] disabled:text-gray-500",
        error && "border-red-500 focus:border-red-500 focus:ring-red-500/20"
      )}
    >
      <option value="">{placeholder}</option>
      {options.map((opt: any) => (
        <option key={opt.value || opt} value={opt.value || opt}>
          {opt.label || opt}
        </option>
      ))}
    </select>
    {error && <p className="text-[11px] text-red-500 mt-1 font-medium">{error}</p>}
  </div>
);

export const Modal = ({ title, onClose, wide, children, footer }: any) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="fixed inset-0 z-[60] flex items-center justify-center p-2 sm:p-4 bg-[#0F172A]/80 backdrop-blur-sm"
  >
    <motion.div
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.95, opacity: 0 }}
      className={cn(
        "bg-white dark:bg-[#1E293B] rounded-2xl shadow-2xl w-full max-h-[95vh] sm:max-h-[90vh] flex flex-col transition-colors duration-200",
        wide ? "max-w-4xl" : "max-w-xl"
      )}
    >
      <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-[#E8ECF0] dark:border-[#334155]">
        <h2 className="text-base sm:text-lg font-bold text-[#1A1A2E] dark:text-[#F1F5F9] truncate pr-4">{title}</h2>
        <button
          onClick={onClose}
          className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#334155] rounded-lg transition-colors shrink-0"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
      <div className="p-4 sm:p-6 overflow-y-auto flex-1">{children}</div>
      {footer && (
        <div className="px-4 sm:px-6 py-4 border-t border-[#E8ECF0] dark:border-[#334155] bg-gray-50/50 dark:bg-gray-800/50 rounded-b-2xl">
          {footer}
        </div>
      )}
    </motion.div>
  </motion.div>
);

export const ConfirmModal = ({ title, message, onConfirm, onCancel, loading }: any) => (
  <Modal title={title} onClose={onCancel}>
    <div className="flex flex-col items-center text-center">
      <div className="w-12 h-12 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center mb-4">
        <AlertCircle className="w-6 h-6 text-red-500" />
      </div>
      <p className="text-[#6B7280] dark:text-[#94A3B8] text-[14px] leading-relaxed mb-8">
        {message}
      </p>
      <div className="flex gap-3 w-full">
        <Btn label="Cancel" onClick={onCancel} outline className="flex-1" disabled={loading} />
        <Btn label="Confirm" onClick={onConfirm} color="red" className="flex-1" loading={loading} />
      </div>
    </div>
  </Modal>
);

export const Skeleton = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("animate-pulse bg-gray-200 dark:bg-[#334155] rounded", className)} {...props} />
);

export const ThemeToggle = ({ theme, toggleTheme }: any) => (
  <button
    onClick={toggleTheme}
    className="p-2 rounded-lg bg-gray-100 dark:bg-[#334155] text-gray-600 dark:text-[#94A3B8] hover:bg-gray-200 dark:hover:bg-[#475569] transition-all duration-500 relative overflow-hidden flex items-center justify-center w-10 h-10"
    title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
  >
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={theme}
        initial={{ y: 20, opacity: 0, rotate: 90 }}
        animate={{ y: 0, opacity: 1, rotate: 0 }}
        exit={{ y: -20, opacity: 0, rotate: -90 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
      >
        {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
      </motion.div>
    </AnimatePresence>
  </button>
);

export const PageHeader = ({ title, sub, actions }: any) => (
  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8">
    <div className="min-w-0">
      <h1 className="text-2xl sm:text-[26px] font-extrabold text-[#1A1A2E] dark:text-[#F1F5F9] tracking-tight">{title}</h1>
      {sub && <p className="text-[13px] text-[#6B7280] dark:text-[#94A3B8] mt-1.5 font-medium">{sub}</p>}
    </div>
    {actions && <div className="flex flex-wrap items-center gap-2.5">{actions}</div>}
  </div>
);

export const KPICard = ({
  label,
  value,
  sub,
  color = "blue",
  icon: Icon,
}: any) => {
  const colors = {
    orange: "bg-[#FFF7ED] text-[#F97316] dark:bg-[#451A03] dark:text-[#F97316]",
    blue: "bg-[#EFF6FF] text-[#3B82F6] dark:bg-[#1E3A8A] dark:text-[#60A5FA]",
    green: "bg-[#ECFDF5] text-[#10B981] dark:bg-[#064E3B] dark:text-[#34D399]",
    purple: "bg-[#F5F3FF] text-[#8B5CF6] dark:bg-[#2E1065] dark:text-[#A78BFA]",
    red: "bg-[#FEF2F2] text-[#EF4444] dark:bg-[#450A0A] dark:text-[#F87171]",
  };

  return (
    <Card className="p-6 flex items-start gap-5 hover:border-[#F97316]/30 dark:hover:border-[#F97316]/30 transition-all duration-300">
      <div className={cn("p-3.5 rounded-2xl", colors[color as keyof typeof colors])}>
        <Icon className="w-7 h-7" />
      </div>
      <div>
        <p className="text-[11px] font-bold text-[#6B7280] dark:text-[#94A3B8] uppercase tracking-widest">
          {label}
        </p>
        <p className="text-2xl font-black text-[#1A1A2E] dark:text-[#F1F5F9] mt-1.5">{value}</p>
        {sub && <p className="text-[11px] text-[#9CA3AF] dark:text-[#64748B] mt-1.5 font-medium">{sub}</p>}
      </div>
    </Card>
  );
};

export const Pagination = ({
  data,
  onPageChange,
}: {
  data: { page: number; pages: number; total: number } | null;
  onPageChange: (page: number) => void;
}) => {
  if (!data || data.pages <= 1) return null;

  return (
    <div className="flex items-center justify-between px-4 py-4 bg-white dark:bg-[#1E293B] border-t border-[#E8ECF0] dark:border-[#334155] sm:px-6 rounded-b-xl transition-colors duration-200">
      <div className="flex justify-between flex-1 sm:hidden">
        <Btn label="Previous" onClick={() => onPageChange(data.page - 1)} disabled={data.page === 1} outline small />
        <Btn label="Next" onClick={() => onPageChange(data.page + 1)} disabled={data.page === data.pages} outline small />
      </div>
      <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-gray-700 dark:text-[#94A3B8]">
            Showing page <span className="font-bold text-[#1A1A2E] dark:text-[#F1F5F9]">{data.page}</span> of{" "}
            <span className="font-bold text-[#1A1A2E] dark:text-[#F1F5F9]">{data.pages}</span> (
            <span className="font-bold text-[#1A1A2E] dark:text-[#F1F5F9]">{data.total}</span> total results)
          </p>
        </div>
        <div>
          <nav className="relative z-0 inline-flex rounded-lg shadow-sm -space-x-px" aria-label="Pagination">
            <button
              onClick={() => onPageChange(data.page - 1)}
              disabled={data.page === 1}
              className="relative inline-flex items-center px-3 py-2 rounded-l-lg border border-gray-300 dark:border-[#334155] bg-white dark:bg-[#0F172A] text-sm font-medium text-gray-500 dark:text-[#94A3B8] hover:bg-gray-50 dark:hover:bg-[#1E293B] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              &lt;
            </button>
            {[...Array(data.pages)].map((_, i) => (
              <button
                key={i + 1}
                onClick={() => onPageChange(i + 1)}
                className={cn(
                  "relative inline-flex items-center px-4 py-2 border text-sm font-bold transition-all duration-200",
                  data.page === i + 1
                    ? "z-10 bg-[#F97316] border-[#F97316] text-white"
                    : "bg-white dark:bg-[#0F172A] border-gray-300 dark:border-[#334155] text-gray-500 dark:text-[#94A3B8] hover:bg-gray-50 dark:hover:bg-[#1E293B]"
                )}
              >
                {i + 1}
              </button>
            ))}
            <button
              onClick={() => onPageChange(data.page + 1)}
              disabled={data.page === data.pages}
              className="relative inline-flex items-center px-3 py-2 rounded-r-lg border border-gray-300 dark:border-[#334155] bg-white dark:bg-[#0F172A] text-sm font-medium text-gray-500 dark:text-[#94A3B8] hover:bg-gray-50 dark:hover:bg-[#1E293B] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              &gt;
            </button>
          </nav>
        </div>
      </div>
    </div>
  );
};

export const ImageUpload = ({
  label,
  value,
  onChange,
  error,
  required,
  loading,
  id,
  small,
}: {
  label?: string;
  value?: string;
  onChange: (file: File) => void;
  error?: string;
  required?: boolean;
  loading?: boolean;
  id: string;
  small?: boolean;
}) => {
  return (
    <div className={cn("space-y-2", small ? "space-y-0" : "space-y-2")}>
      {label && !small && (
        <label className="block text-[11px] font-bold text-[#6B7280] dark:text-[#94A3B8] uppercase tracking-wider">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <div className="relative">
        <input
          type="file"
          className="hidden"
          id={id}
          accept="image/*"
          onChange={(e) => e.target.files?.[0] && onChange(e.target.files[0])}
          disabled={loading}
        />
        <label
          htmlFor={id}
          className={cn(
            "flex flex-col items-center justify-center gap-2 w-full border-2 border-dashed rounded-xl cursor-pointer transition-all duration-200 overflow-hidden relative group",
            small ? "aspect-square w-12 h-12 rounded-lg gap-0" : "aspect-[16/9]",
            value 
              ? "border-green-200 dark:border-green-900/30 bg-green-50/30 dark:bg-green-900/10" 
              : error 
                ? "border-red-200 dark:border-red-900/30 bg-red-50/30 dark:bg-red-900/10" 
                : "border-[#E8ECF0] dark:border-[#334155] hover:border-[#F97316] dark:hover:border-[#F97316] bg-gray-50/50 dark:bg-[#0F172A]"
          )}
        >
          {loading ? (
            <div className="flex flex-col items-center gap-1">
              <Loader2 className={cn("animate-spin text-[#F97316]", small ? "w-3 h-3" : "w-6 h-6")} />
              {!small && <span className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wider">Uploading...</span>}
            </div>
          ) : value ? (
            <>
              <img src={value} alt={label} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Camera className={cn("text-white", small ? "w-3 h-3" : "w-6 h-6")} />
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center gap-1">
              <Camera className={cn(error ? "text-red-400" : "text-[#6B7280] dark:text-[#475569]", small ? "w-3 h-3" : "w-8 h-8")} />
              {!small && (
                <span className={cn("text-[11px] font-bold uppercase tracking-wider", error ? "text-red-500" : "text-[#6B7280] dark:text-[#94A3B8]")}>
                  Upload
                </span>
              )}
            </div>
          )}
        </label>
        {error && !small && <p className="text-[11px] text-red-500 mt-1.5 font-medium">{error}</p>}
      </div>
    </div>
  );
};
