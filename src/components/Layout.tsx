"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { LayoutDashboard, Package, ShoppingCart, Store, Users, Settings, DollarSign, LogOut, Menu, Home, Receipt } from 'lucide-react';

const menuItems = [
  {
    name: "Dashboard",
    path: "/dashboard",
    roles: ["admin", "manager", "staff"],
    icon: <LayoutDashboard className="w-5 h-5" />
  },
  {
    name: "Inventory",
    path: "/inventory",
    roles: ["admin", "manager"],
    icon: <Package className="w-5 h-5" />
  },
  { 
    name: "POS", 
    path: "/pos", 
    roles: ["admin", "staff"],
    icon: <ShoppingCart className="w-5 h-5" />
  },
  {
    name: "Orders",
    path: "/orders",
    roles: ["admin", "manager"],
    icon: <Receipt className="w-5 h-5" />
  },
  {
    name: "CRM",
    path: "/crm",
    roles: ["admin", "manager", "staff"],
    icon: <Users className="w-5 h-5" />
  },
  {
    name: "Products",
    path: "/products",
    roles: ["admin", "manager"],
    icon: <Store className="w-5 h-5" />
  },
  {
    name: "Reports",
    path: "/reports",
    roles: ["admin", "manager"],
    icon: <Store className="w-5 h-5" />
  },
  { 
    name: "Users", 
    path: "/users", 
    roles: ["admin"],
    icon: <Users className="w-5 h-5" />
  },
  { 
    name: "Settings", 
    path: "/settings", 
    roles: ["admin"],
    icon: <Settings className="w-5 h-5" />
  },
  {
    name: "Expenses",
    path: "/expenses",
    roles: ["admin", "manager"],
    icon: <DollarSign className="w-5 h-5" />
  },
];

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  if (!user) return <>{children}</>;

  return (
    <div className="flex h-screen-93 bg-gray-100">
      {/* Mobile menu button */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="md:hidden fixed top-4 left-4 z-20 p-2 rounded-md bg-[#005A8D] text-white hover:bg-blue-600"
      >
        <Menu className="w-6 h-6" />
      </button>

      {/* Overlay for mobile */}
      {isMobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-10"
          onClick={() => setIsMobileMenuOpen(false)}
        ></div>
      )}

      {/* Sidebar */}
      <aside className={`
        w-64 bg-[#005A8D] text-white p-4
        md:block
        ${isMobileMenuOpen ? 'fixed inset-y-0 left-0 z-20' : 'hidden'}
      `}>
        <h2 className="text-lg font-bold">📚 BookStore</h2>
        <nav className="mt-6">
          <ul className="space-y-1">
            {menuItems
              .filter((item) => item.roles.includes(user?.role))
              .map((item) => (
                <li key={item.path}>
                  <Link 
                    href={item.path} 
                    className="flex items-center px-4 py-2.5 text-sm font-medium transition-colors rounded-lg hover:bg-blue-600 group"
                    onClick={() => {
                      if (window.innerWidth < 768) { // Close menu on mobile after clicking
                        setIsMobileMenuOpen(false);
                      }
                    }}
                  >
                    <span className="flex items-center justify-center w-5 h-5 mr-3 text-gray-100 group-hover:text-white">
                      {item.icon}
                    </span>
                    <span className="text-gray-100 group-hover:text-white">{item.name}</span>
                  </Link>
                </li>
              ))}
          </ul>
          <div className="mt-6 border-t border-blue-700 pt-4">
            <button
              onClick={logout}
              className="flex w-full items-center px-4 py-2.5 text-sm font-medium text-gray-100 rounded-lg hover:bg-blue-600 group"
            >
              <span className="flex items-center justify-center w-5 h-5 mr-3 text-gray-100 group-hover:text-white">
                <LogOut className="w-5 h-5" />
              </span>
              <span className="group-hover:text-white">Logout</span>
            </button>
          </div>
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-6 md:p-6 mt-16 md:mt-0 max-h-[93vh] overflow-auto">
        {children}
      </main>
    </div>
  );
}
