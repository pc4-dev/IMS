import React, { useState } from "react";
import { useAppStore } from "../store";
import {
  ShieldAlert,
  Briefcase,
  Users,
  ClipboardList,
  Package,
  Lock,
  Mail,
  ArrowRight,
  ChevronLeft,
  CheckCircle2,
} from "lucide-react";
import { Role } from "../types";
import { Btn, ThemeToggle } from "../components/ui";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "motion/react";

export const Login = () => {
  const { login, theme, toggleTheme } = useAppStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showRoles, setShowRoles] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please fill in all fields");
      return;
    }

    setLoading(true);
    try {
      const success = await login(email, password);
      if (success) {
        toast.success("Welcome back!");
      } else {
        toast.error("Invalid credentials");
      }
    } catch (error) {
      toast.error("Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const roles: { role: Role; icon: any; desc: string; color: string; bg: string }[] = [
    {
      role: "Director",
      icon: Briefcase,
      desc: "L2 approval, cancel/edit POs",
      color: "text-orange-600 dark:text-orange-400",
      bg: "bg-orange-50 dark:bg-orange-900/20",
    },
    {
      role: "AGM",
      icon: Users,
      desc: "L1 approval, vendor selection",
      color: "text-purple-600 dark:text-purple-400",
      bg: "bg-purple-50 dark:bg-purple-900/20",
    },
    {
      role: "Project Manager",
      icon: ClipboardList,
      desc: "Material planning, RFQ, PO creation",
      color: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-50 dark:bg-blue-900/20",
    },
    {
      role: "Store Incharge",
      icon: Package,
      desc: "GRN, inward, outward, inward return, outward return",
      color: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-50 dark:bg-emerald-900/20",
    },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-[#0F172A] flex overflow-hidden">
      {/* Left Side: Visual/Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-[#1E293B] items-center justify-center p-12 overflow-hidden">
        {/* Background Decorative Elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-20">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-orange-500 blur-[120px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-500 blur-[120px]" />
        </div>
        
        <div className="relative z-10 max-w-lg text-center lg:text-left">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="w-20 h-20 bg-orange-500 rounded-3xl flex items-center justify-center font-black text-5xl text-white mb-8 shadow-2xl shadow-orange-500/20">
              N
            </div>
            <h1 className="text-5xl font-black text-white tracking-tight mb-6 leading-tight">
              Neoteric <span className="text-orange-500">Properties</span>
            </h1>
            <p className="text-xl text-gray-400 font-medium mb-12 leading-relaxed">
              The next generation of property management. Streamlining inventory, procurement, and site operations for Garden City.
            </p>
            
            <div className="space-y-4">
              {[
                "Real-time Inventory Tracking",
                "Automated Purchase Orders",
                "Multi-level Approval Workflow",
                "Site-wise Material Planning"
              ].map((feature, i) => (
                <motion.div
                  key={feature}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.4 + (i * 0.1) }}
                  className="flex items-center gap-3 text-gray-300"
                >
                  <CheckCircle2 className="w-5 h-5 text-orange-500" />
                  <span className="font-medium">{feature}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
        
        {/* Abstract Shape */}
        <div className="absolute bottom-0 left-0 w-full h-1/3 bg-gradient-to-t from-[#0F172A] to-transparent opacity-50" />
      </div>

      {/* Right Side: Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative">
        <div className="absolute top-6 right-6">
          <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
        </div>
        <div className="w-full max-w-md">
          <AnimatePresence mode="wait">
            <motion.div
              key="login-form"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.4 }}
            >
              <div className="lg:hidden flex justify-center mb-8">
                 <div className="w-12 h-12 bg-orange-500 rounded-2xl flex items-center justify-center font-black text-2xl text-white shadow-lg shadow-orange-500/20">
                  N
                </div>
              </div>
              
              <div className="mb-10 text-center lg:text-left">
                <h2 className="text-3xl font-black text-[#1A1A2E] dark:text-white tracking-tight mb-2">
                  Welcome Back
                </h2>
                <p className="text-gray-500 dark:text-gray-400 font-medium">
                  Please enter your details to sign in.
                </p>
              </div>

              <form onSubmit={handleLogin} className="space-y-5" autoComplete="off">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-1">Email Address</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Mail className="h-5 w-5 text-gray-400 group-focus-within:text-orange-500 transition-colors" />
                      </div>
                      <input
                        type="email"
                        placeholder="admin@neoteric.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        autoComplete="off"
                        className="block w-full pl-10 pr-3 py-3 bg-gray-50 dark:bg-[#1E293B] border border-gray-200 dark:border-gray-700 rounded-xl text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all text-[#1A1A2E] dark:text-white"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between px-1">
                      <label className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Password</label>
                      <button type="button" className="text-[11px] font-bold text-orange-500 hover:text-orange-600 uppercase tracking-widest transition-colors">Forgot Password?</button>
                    </div>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-orange-500 transition-colors" />
                      </div>
                      <input
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        autoComplete="new-password"
                        className="block w-full pl-10 pr-3 py-3 bg-gray-50 dark:bg-[#1E293B] border border-gray-200 dark:border-gray-700 rounded-xl text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all text-[#1A1A2E] dark:text-white"
                      />
                    </div>
                  </div>

                  <Btn
                    type="submit"
                    className="w-full py-3.5 text-base font-bold rounded-xl shadow-lg shadow-orange-500/20 mt-2"
                    loading={loading}
                    label="Sign In"
                  />
                </form>
              </motion.div>
          </AnimatePresence>
          
          <div className="mt-12 text-center">
            <p className="text-[11px] text-gray-400 font-medium uppercase tracking-widest">
              &copy; 2026 Neoteric Properties &bull; Garden City Portal
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
