'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useLocaleStore } from '@/lib/store';
import { getTranslation } from '@/lib/i18n';
import { cn, getInitials } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import {
  LayoutDashboard,
  ShoppingCart,
  FileText,
  Heart,
  GitCompareArrows,
  MessageCircle,
  Settings,
  Menu,
  Bell,
  LogOut,
  User,
  ChevronLeft,
} from 'lucide-react';

const sidebarItems = [
  { key: 'overview', icon: LayoutDashboard, href: '/buyer' },
  { key: 'orders', icon: ShoppingCart, href: '/buyer/orders' },
  { key: 'quotes', icon: FileText, href: '/buyer/quotes' },
  { key: 'favorites', icon: Heart, href: '/buyer/favorites' },
  { key: 'compare', icon: GitCompareArrows, href: '/buyer/compare' },
  { key: 'messages', icon: MessageCircle, href: '/buyer/messages' },
  { key: 'settings', icon: Settings, href: '/buyer/settings' },
];

const sidebarLabels: Record<string, Record<string, string>> = {
  ar: {
    overview: 'الرئيسية',
    orders: 'طلباتي',
    quotes: 'طلبات عروض الأسعار',
    favorites: 'المفضلة',
    compare: 'المقارنات',
    messages: 'المراسلة',
    settings: 'الإعدادات',
  },
  fr: {
    overview: 'Accueil',
    orders: 'Mes commandes',
    quotes: 'Demandes de devis',
    favorites: 'Favoris',
    compare: 'Comparaisons',
    messages: 'Messages',
    settings: 'Parametres',
  },
};

interface SidebarContentProps {
  locale: string;
  pathname: string;
  labels: Record<string, string>;
  profile: { displayName?: string; email?: string; supplierProfile?: { logoUrl?: string } } | null;
  user: { email?: string; user_metadata?: { display_name?: string; avatar_url?: string } } | null;
  onClose?: () => void;
}

function SidebarContent({ locale, pathname, labels, profile, user, onClose }: SidebarContentProps) {
  const getIsActive = (href: string) => {
    if (href === '/buyer') return pathname === '/buyer';
    return pathname.startsWith(href);
  };

  return (
    <div className="flex flex-col h-full bg-[#1B3A5C] text-white">
      {/* Logo */}
      <div className="p-5 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
          <svg
            viewBox="0 0 24 24"
            className="w-6 h-6 text-white"
            fill="currentColor"
          >
            <rect x="2" y="2" width="20" height="20" rx="4" fill="none" stroke="currentColor" strokeWidth="2" />
            <text x="12" y="16" textAnchor="middle" fill="currentColor" fontSize="10" fontWeight="bold">B</text>
          </svg>
        </div>
        <div>
          <h1 className="text-lg font-bold tracking-tight">Businfo</h1>
          <p className="text-[10px] text-white/50 tracking-wide uppercase">
            {locale === 'ar' ? 'لوحة المشتري' : 'Buyer Dashboard'}
          </p>
        </div>
      </div>

      <Separator className="bg-white/10 mx-3" />

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-1">
          {sidebarItems.map((item) => {
            const isActive = getIsActive(item.href);
            return (
              <Link
                key={item.key}
                href={item.href}
                onClick={onClose}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'bg-white/15 text-white shadow-sm'
                    : 'text-white/70 hover:bg-white/10 hover:text-white'
                )}
              >
                <item.icon className={cn('w-5 h-5 shrink-0', isActive && 'text-[#E8A838]')} />
                <span>{labels[item.key]}</span>
                {item.key === 'messages' && (
                  <Badge className="ms-auto bg-red-500 text-white text-[10px] px-1.5 py-0 min-w-5 h-5 flex items-center justify-center border-0">
                    3
                  </Badge>
                )}
              </Link>
            );
          })}
        </nav>
      </ScrollArea>

      {/* User Info at Bottom */}
      <div className="p-4 border-t border-white/10">
        <div className="flex items-center gap-3">
          <Avatar className="w-9 h-9 border-2 border-white/20">
            <AvatarImage src={profile?.supplierProfile?.logoUrl || user?.user_metadata?.avatar_url} />
            <AvatarFallback className="bg-white/15 text-xs text-white font-semibold">
              {getInitials(profile?.displayName || user?.email || 'U')}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">
              {profile?.displayName || user?.user_metadata?.display_name || 'User'}
            </p>
            <p className="text-[11px] text-white/50 truncate">
              {profile?.email || user?.email || ''}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function BuyerDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { profile, user, signOut } = useAuth();
  const { locale } = useLocaleStore();
  const t = getTranslation(locale);
  const [sheetOpen, setSheetOpen] = useState(false);

  const labels = sidebarLabels[locale] || sidebarLabels.ar;

  const getIsActive = (href: string) => {
    if (href === '/buyer') return pathname === '/buyer';
    return pathname.startsWith(href);
  };

  const currentPageTitle = sidebarItems.find((item) => getIsActive(item.href))?.key || 'overview';

  const profileData = profile as SidebarContentProps['profile'];
  const userData = user as SidebarContentProps['user'];

  return (
    <div className="min-h-screen bg-[var(--bg-light)] flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-64 shrink-0 sticky top-0 h-screen">
        <SidebarContent
          locale={locale}
          pathname={pathname}
          labels={labels}
          profile={profileData}
          user={userData}
        />
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="sticky top-0 z-40 bg-white border-b border-border shadow-[var(--shadow-sm)]">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6">
            {/* Left: Mobile menu + Page title */}
            <div className="flex items-center gap-3">
              {/* Mobile Menu Button */}
              <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="lg:hidden">
                    <Menu className="w-5 h-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="p-0 w-72 bg-transparent border-none">
                  <SheetTitle className="sr-only">Menu</SheetTitle>
                  <SidebarContent
                    locale={locale}
                    pathname={pathname}
                    labels={labels}
                    profile={profileData}
                    user={userData}
                    onClose={() => setSheetOpen(false)}
                  />
                </SheetContent>
              </Sheet>

              <h2 className="text-lg font-semibold text-foreground hidden sm:block">
                {labels[currentPageTitle]}
              </h2>
            </div>

            {/* Right: Notifications + User Dropdown */}
            <div className="flex items-center gap-2">
              {/* Notification Bell */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative">
                    <Bell className="w-5 h-5 text-muted-foreground" />
                    <span className="absolute top-1.5 end-1.5 w-2 h-2 bg-red-500 rounded-full" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-72">
                  <div className="px-3 py-2.5 border-b border-border">
                    <p className="text-sm font-semibold">
                      {locale === 'ar' ? 'الإشعارات' : 'Notifications'}
                    </p>
                  </div>
                  <div className="py-1">
                    <DropdownMenuItem className="flex items-start gap-3 py-3 px-3 cursor-pointer">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0 mt-0.5">
                        <FileText className="w-4 h-4 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium leading-snug">
                          {locale === 'ar'
                            ? 'تم الرد على طلب عرض السعر الخاص بك'
                            : 'Reponse a votre demande de devis'}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {locale === 'ar' ? 'منذ 5 دقائق' : 'Il y a 5 min'}
                        </p>
                      </div>
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 shrink-0" />
                    </DropdownMenuItem>
                    <DropdownMenuItem className="flex items-start gap-3 py-3 px-3 cursor-pointer">
                      <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center shrink-0 mt-0.5">
                        <ShoppingCart className="w-4 h-4 text-green-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium leading-snug">
                          {locale === 'ar'
                            ? 'تم شحن طلبك #1234'
                            : 'Commande #1234 expediee'}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {locale === 'ar' ? 'منذ ساعة' : 'Il y a 1h'}
                        </p>
                      </div>
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2 shrink-0" />
                    </DropdownMenuItem>
                    <DropdownMenuItem className="flex items-start gap-3 py-3 px-3 cursor-pointer">
                      <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center shrink-0 mt-0.5">
                        <MessageCircle className="w-4 h-4 text-purple-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium leading-snug">
                          {locale === 'ar'
                            ? 'رسالة جديدة من مورد'
                            : 'Nouveau message du fournisseur'}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {locale === 'ar' ? 'منذ 3 ساعات' : 'Il y a 3h'}
                        </p>
                      </div>
                    </DropdownMenuItem>
                  </div>
                  <div className="border-t border-border px-3 py-2">
                    <Button variant="ghost" size="sm" className="w-full text-navy text-xs">
                      {locale === 'ar' ? 'عرض جميع الإشعارات' : 'Voir toutes les notifications'}
                    </Button>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* User Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2 px-2">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={profile?.supplierProfile?.logoUrl || user?.user_metadata?.avatar_url} />
                      <AvatarFallback className="bg-navy/10 text-xs text-navy font-semibold">
                        {getInitials(profile?.displayName || user?.email || 'U')}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden md:block text-sm font-medium max-w-32 truncate">
                      {profile?.displayName || user?.user_metadata?.display_name || 'User'}
                    </span>
                    <ChevronLeft className="w-4 h-4 text-muted-foreground hidden md:block" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-3 py-2.5 border-b border-border">
                    <p className="text-sm font-semibold">
                      {profile?.displayName || user?.user_metadata?.display_name || 'User'}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {profile?.email || user?.email || ''}
                    </p>
                  </div>
                  <div className="py-1">
                    <DropdownMenuItem asChild className="cursor-pointer">
                      <Link href="/buyer/settings" className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        <span>{locale === 'ar' ? 'الملف الشخصي' : 'Profil'}</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="cursor-pointer">
                      <Link href="/buyer/settings" className="flex items-center gap-2">
                        <Settings className="w-4 h-4" />
                        <span>{locale === 'ar' ? 'الإعدادات' : 'Parametres'}</span>
                      </Link>
                    </DropdownMenuItem>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={signOut}
                    className="text-red-600 focus:text-red-600 cursor-pointer"
                  >
                    <LogOut className="w-4 h-4 me-2" />
                    <span>{t.nav.logout}</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
