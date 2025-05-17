import { motion } from "framer-motion";
import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  Share2,
  CreditCard,
  Coins,
  ShoppingCart,
  Users,
} from "lucide-react";

const Sidebar = () => {
  const location = useLocation();
  const currentPath = location.pathname;

  const isActive = (path: string) => currentPath === path;

  const navItems = [
    {
      path: "/dashboard",
      label: "Dashboard",
      icon: <LayoutDashboard size={18} />,
    },
    {
      path: "/products",
      label: "Products",
      icon: <Package size={18} />,
    },
    {
      path: "/social-media",
      label: "Social Media",
      icon: <Share2 size={18} />,
    },
    { path: "/payment", label: "Payment", icon: <CreditCard size={18} /> },
    // { path: "/solana", label: "Solana", icon: <Coins size={18} /> },
    { path: "/order", label: "Order", icon: <ShoppingCart size={18} /> },
    { path: "/customer", label: "Customers", icon: <Users size={18} /> },
  ];

  return (
    <motion.div
      initial={{ x: -80, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className=" relative w-64 h-screen p-6 bg-white text-black border-r border-gray-200 shadow-md"
    >
      <h2 className="text-2xl font-bold mb-8 border-b">Admin</h2>
      <ul className="space-y-3">
        {navItems.map((item) => (
          <li key={item.path}>
            <Link
              to={item.path}
              className={`flex items-center gap-3 px-4 py-2 rounded-lg transition duration-200 ${
                isActive(item.path)
                  ? "bg-black text-white font-semibold"
                  : "hover:bg-gray-100"
              }`}
            >
              <span
                className={`${
                  isActive(item.path) ? "text-white" : "text-gray-700"
                }`}
              >
                {item.icon}
              </span>
              <span>{item.label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </motion.div>
  );
};

export default Sidebar;
