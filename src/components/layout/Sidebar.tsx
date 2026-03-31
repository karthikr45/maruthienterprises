'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Building2,
  Users,
  Briefcase,
  UserCheck,
  MapPin,
  Calendar,
  ShieldCheck,
  Wallet,
  Receipt,
  Menu,
  X,
} from 'lucide-react';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/banks', label: 'Banks', icon: Building2 },
  { href: '/employees', label: 'Employees', icon: Users },
  { href: '/portfolios', label: 'Portfolios', icon: Briefcase },
  { href: '/customers', label: 'Customers', icon: UserCheck },
  { href: '/visits', label: 'Visits', icon: MapPin },
  { href: '/attendance', label: 'Attendance', icon: Calendar },
  { href: '/compliance', label: 'Compliance', icon: ShieldCheck },
  { href: '/salaries', label: 'Salaries', icon: Wallet },
  { href: '/expenses', label: 'Expenses', icon: Receipt },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + '/');

  const navContent = (
    <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
      {navItems.map((item) => {
        const Icon = item.icon;
        const active = isActive(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setMobileOpen(false)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              active
                ? 'bg-indigo-700 text-white'
                : 'text-indigo-100 hover:bg-indigo-700/50 hover:text-white'
            }`}
          >
            <Icon className="h-5 w-5 flex-shrink-0" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-md bg-indigo-800 text-white shadow-lg"
        aria-label="Open sidebar"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/50"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={`lg:hidden fixed inset-y-0 left-0 z-50 w-64 bg-indigo-900 transform transition-transform duration-200 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-4 py-5 border-b border-indigo-700">
          <span className="text-lg font-bold text-white">ME Recovery</span>
          <button
            onClick={() => setMobileOpen(false)}
            className="p-1 rounded-md text-indigo-300 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        {navContent}
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-indigo-900">
        <div className="flex items-center px-6 py-5 border-b border-indigo-700">
          <span className="text-lg font-bold text-white tracking-wide">
            ME Recovery
          </span>
        </div>
        {navContent}
      </aside>
    </>
  );
}
