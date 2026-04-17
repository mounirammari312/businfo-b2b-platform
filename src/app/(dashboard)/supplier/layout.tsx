'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useLocaleStore } from '@/lib/store';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  FileText,
  Star,
  Award,
  Megaphone,
  MessageCircle,
  Store,
  User,
  Menu,
  Bell,
  LogOut,
  Settings,
  ChevronLeft,
} from 'lucide-react';
import { getInitials } from '@/lib/utils';

const navItems = [
  { href: '/supplier', labelAr: 'الرئيسية', labelEn: 'Overview', icon: LayoutDashboard },
  { href: '/supplier/products', labelAr: 'إدارة المنتجات', labelEn: 'Products', icon: Package },
  { href: '/supplier/orders', labelAr: 'الطلبات', labelEn: 'Orders', icon: ShoppingCart },
  { href: '/supplier/quotes', labelAr: 'طلبات العروض', labelEn: 'Quotes', icon: FileText },
  { href: '/supplier/reviews', labelAr: 'التقييمات', labelEn: 'Reviews', icon: Star },
  { href: '/supplier/badges', labelAr: 'طلب شارة', labelEn: 'Badges', icon: Award },
  { href: '/supplier/ads', labelAr: 'طلب إعلان', labelEn: 'Ads', icon: Megaphone },
  { href: '/supplier/messages', labelAr: 'المراسلة', labelEn: 'Messages', icon: MessageCircle },
  { href: '/supplier/store-settings', labelAr: 'إعدادات المتجر', labelEn: 'Store Settings', icon: Store },
  { href: '/supplier/profile', labelAr: 'الملف الشخصي', labelEn: 'Profile', icon: User },
];

function SidebarContent({ pathname, locale, onClose }: { pathname: string; locale: string; onClose?: () => void }) {
  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gold/20 flex items-center justify-center">
            <Store className="w-5 h-5 text-gold" />
          </div>
          <div>
            <h2 className="text-white font-bold text-sm">BUSINFO</h2>
            <p className="text-white/60 text-xs">{locale === 'ar' ? 'لوحة المورد' : 'Supplier Panel'}</p>
          </div>
        </div>
      </div>
      <ScrollArea className="flex-1 py-3 px-3">
        <nav className="space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/supplier' && pathname.startsWith(item.href));
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'bg-white/15 text-white shadow-sm'
                    : 'text-white/70 hover:bg-white/10 hover:text-white'
                )}
              >
                <Icon className="w-4.5 h-4.5 shrink-0" />
                <span>{locale === 'ar' ? item.labelAr : item.labelEn}</span>
              </Link>
            );
          })}
        </nav>
      </ScrollArea>
      <div className="p-3 border-t border-white/10">
        <div className="bg-white/5 rounded-lg p-3 text-center">
          <p className="text-white/50 text-xs">{locale === 'ar' ? 'خطة المورد الاحترافي' : 'Pro Supplier Plan'}</p>
          <p className="text-gold text-xs font-semibold mt-1">{locale === 'ar' ? 'ترقية الآن' : 'Upgrade Now'}</p>
        </div>
      </div>
    </div>
  );
}

export default function SupplierLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { locale } = useLocaleStore();
  const { user, profile, supplier, signOut, loading } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const displayName = profile?.displayName || supplier?.name || (locale === 'ar' ? 'المورد' : 'Supplier');
  const avatarUrl = profile?.avatar_url || supplier?.logoUrl;

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 bg-[#1B3A5C] flex-col shrink-0">
        <SidebarContent pathname={pathname} locale={locale} />
      </aside>

      {/* Main Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="h-16 border-b bg-white flex items-center justify-between px-4 lg:px-6 shrink-0">
          <div className="flex items-center gap-3">
            {/* Mobile menu button */}
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side={locale === 'ar' ? 'right' : 'left'} className="w-72 p-0 bg-[#1B3A5C] border-none">
                <SheetHeader className="sr-only">
                  <SheetTitle>{locale === 'ar' ? 'القائمة' : 'Menu'}</SheetTitle>
                </SheetHeader>
                <SidebarContent
                  pathname={pathname}
                  locale={locale}
                  onClose={() => setMobileOpen(false)}
                />
              </SheetContent>
            </Sheet>

            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm">
              <Link href="/supplier" className="text-muted-foreground hover:text-foreground transition-colors">
                {locale === 'ar' ? 'لوحة التحكم' : 'Dashboard'}
              </Link>
              {pathname !== '/supplier' && (
                <>
                  <ChevronLeft className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium text-foreground">
                    {navItems.find(item => item.href !== '/supplier' && pathname.startsWith(item.href))
                      ? (locale === 'ar' ? navItems.find(item => item.href !== '/supplier' && pathname.startsWith(item.href))!.labelAr : navItems.find(item => item.href !== '/supplier' && pathname.startsWith(item.href))!.labelEn)
                      : ''}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {/* Notifications */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="w-5 h-5" />
                  <span className="absolute top-1.5 end-1.5 w-2 h-2 bg-red-500 rounded-full" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-72">
                <div className="p-3 border-b">
                  <p className="font-semibold text-sm">{locale === 'ar' ? 'الإشعارات' : 'Notifications'}</p>
                </div>
                <div className="p-4 text-center text-sm text-muted-foreground">
                  {locale === 'ar' ? 'لا توجد إشعارات جديدة' : 'No new notifications'}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* User Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2 px-2">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={avatarUrl} />
                    <AvatarFallback className="bg-navy text-white text-xs font-semibold">
                      {loading ? '...' : getInitials(displayName)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden sm:block text-sm font-medium max-w-24 truncate">{displayName}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="p-2">
                  <p className="text-sm font-semibold">{displayName}</p>
                  <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/supplier/profile" className="flex items-center gap-2 cursor-pointer">
                    <User className="w-4 h-4" />
                    <span>{locale === 'ar' ? 'الملف الشخصي' : 'Profile'}</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/supplier/store-settings" className="flex items-center gap-2 cursor-pointer">
                    <Settings className="w-4 h-4" />
                    <span>{locale === 'ar' ? 'إعدادات المتجر' : 'Store Settings'}</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOut} className="flex items-center gap-2 cursor-pointer text-red-600">
                  <LogOut className="w-4 h-4" />
                  <span>{locale === 'ar' ? 'تسجيل الخروج' : 'Sign Out'}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto bg-[var(--bg-light)] p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
