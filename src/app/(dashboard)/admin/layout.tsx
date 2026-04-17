'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import {
  LayoutDashboard,
  Users,
  Building2,
  Package,
  Award,
  Megaphone,
  FolderTree,
  MessageCircle,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  ShieldCheck,
  ChevronLeft,
  Loader2,
} from 'lucide-react';

const sidebarNav = [
  { href: '/admin', label: 'الرئيسية', icon: LayoutDashboard },
  { href: '/admin/users', label: 'المستخدمين', icon: Users },
  { href: '/admin/suppliers', label: 'الموردين', icon: Building2 },
  { href: '/admin/products', label: 'المنتجات', icon: Package },
  { href: '/admin/badges', label: 'الشارات', icon: Award },
  { href: '/admin/ads', label: 'الإعلانات', icon: Megaphone },
  { href: '/admin/categories', label: 'التصنيفات', icon: FolderTree },
  { href: '/admin/messages', label: 'المراسلات', icon: MessageCircle },
  { href: '/admin/reports', label: 'التقارير', icon: BarChart3 },
  { href: '/admin/settings', label: 'الإعدادات', icon: Settings },
];

function SidebarContent({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-white/10">
        <div className="w-9 h-9 rounded-lg bg-white/15 flex items-center justify-center">
          <ShieldCheck className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-white font-bold text-base leading-tight">BUSINFO</h1>
          <p className="text-white/50 text-[11px]">لوحة الإدارة</p>
        </div>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 py-4">
        <nav className="space-y-1 px-3">
          {sidebarNav.map((item) => {
            const isActive = item.href === '/admin'
              ? pathname === '/admin'
              : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'bg-white/15 text-white shadow-sm'
                    : 'text-white/60 hover:bg-white/8 hover:text-white/90'
                )}
              >
                <item.icon className={cn('w-[18px] h-[18px] shrink-0', isActive && 'text-[#E8A838]')} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </ScrollArea>

      {/* Footer */}
      <div className="border-t border-white/10 px-3 py-4">
        <Link
          href="/"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-white/50 hover:bg-white/8 hover:text-white/70 transition-colors"
        >
          <ChevronLeft className="w-[18px] h-[18px]" />
          <span>العودة للموقع</span>
        </Link>
      </div>
    </div>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { profile, loading, signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!loading && (!profile || profile.role !== 'admin')) {
      router.push('/');
    }
  }, [loading, profile, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-[#1B3A5C]" />
      </div>
    );
  }

  if (!profile || profile.role !== 'admin') {
    return null;
  }

  return (
    <div className="min-h-screen flex bg-[#f8f9fb]">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-[#1B3A5C] min-h-screen sticky top-0 shrink-0">
        <SidebarContent pathname={pathname} />
      </aside>

      {/* Main Content */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top Bar */}
        <header className="sticky top-0 z-40 bg-white border-b border-gray-200/80 px-4 sm:px-6 h-14 flex items-center justify-between shrink-0">
          {/* Mobile Menu */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden -mr-2">
                <Menu className="w-5 h-5 text-gray-600" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72 p-0 bg-[#1B3A5C] border-none">
              <SheetTitle className="sr-only">القائمة الجانبية</SheetTitle>
              <SidebarContent pathname={pathname} onNavigate={() => setMobileOpen(false)} />
            </SheetContent>
          </Sheet>

          {/* Page Title */}
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-gray-800">
              {sidebarNav.find(n =>
                n.href === '/admin' ? pathname === '/admin' : pathname.startsWith(n.href)
              )?.label || 'لوحة الإدارة'}
            </h2>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-2 text-sm">
              <div className="w-8 h-8 rounded-full bg-[#1B3A5C] flex items-center justify-center">
                <ShieldCheck className="w-4 h-4 text-white" />
              </div>
              <div className="text-end">
                <p className="text-xs font-semibold text-gray-700 leading-tight">{profile.displayName}</p>
                <p className="text-[10px] text-gray-400">مسؤول النظام</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="text-gray-400 hover:text-red-500 hover:bg-red-50"
              onClick={() => signOut()}
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
