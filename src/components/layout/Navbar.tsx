'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useLocaleStore } from '@/lib/store';
import { useSearchStore } from '@/lib/store';
import { getTranslation, type Locale } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import {
  Menu,
  X,
  LogIn,
  UserPlus,
  LogOut,
  LayoutDashboard,
  ShieldCheck,
  Search,
  Phone,
  Mail,
  Globe,
  User,
  ChevronDown,
  Building2,
  Package,
  Grid3X3,
  FileText,
  ShoppingCart,
  Heart,
} from 'lucide-react';

export default function Navbar() {
  const { user, profile, signOut } = useAuth();
  const pathname = usePathname();
  const { locale, setLocale } = useLocaleStore();
  const { query, setQuery } = useSearchStore();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [searchInput, setSearchInput] = useState(query);

  const t = getTranslation(locale);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setSearchInput(query);
  }, [query]);

  const isActive = (path: string) => {
    if (path === '/') return pathname === '/';
    return pathname.startsWith(path);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      setQuery(searchInput.trim());
      window.location.href = `/suppliers?search=${encodeURIComponent(searchInput.trim())}`;
    }
  };

  const handleLocaleChange = (newLocale: Locale) => {
    setLocale(newLocale);
  };

  const navLinks = [
    { href: '/', label: t.nav.home, icon: Building2 },
    { href: '/suppliers', label: t.nav.suppliers, icon: Grid3X3 },
    { href: '/products', label: t.nav.products, icon: Package },
    { href: '/categories', label: t.nav.categories, icon: Grid3X3 },
    { href: '/quote', label: t.nav.quoteRequest, icon: FileText },
  ];

  const renderNavLinks = (onClick?: () => void) =>
    navLinks.map((link) => (
      <Link
        key={link.href}
        href={link.href}
        onClick={onClick}
        className={cn(
          'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-nav',
          isActive(link.href)
            ? 'bg-navy/5 text-navy'
            : 'text-[var(--text-secondary)] hover:text-navy hover:bg-muted'
        )}
      >
        <link.icon className="w-4 h-4 shrink-0" />
        <span>{link.label}</span>
      </Link>
    ));

  return (
    <header className="sticky top-0 z-50 w-full">
      {/* Top Bar */}
      <div className="bg-navy text-white/90 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-9">
            <div className="hidden sm:flex items-center gap-4">
              <a
                href={`tel:${t.nav.topBar.phone}`}
                className="flex items-center gap-1.5 hover:text-gold transition-colors"
              >
                <Phone className="w-3.5 h-3.5" />
                <span dir="ltr">{t.nav.topBar.phone}</span>
              </a>
              <Separator orientation="vertical" className="h-4 bg-white/20" />
              <a
                href={`mailto:${t.nav.topBar.email}`}
                className="flex items-center gap-1.5 hover:text-gold transition-colors"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>{t.nav.topBar.email}</span>
              </a>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/register"
                className="hidden sm:flex items-center gap-1 text-gold font-medium hover:text-gold-light transition-colors"
              >
                {t.nav.topBar.joinFree}
              </Link>
              <Separator orientation="vertical" className="h-4 bg-white/20 hidden sm:block" />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-1 hover:text-gold transition-colors">
                    <Globe className="w-3.5 h-3.5" />
                    <span>{locale === 'ar' ? 'العربية' : 'Fran\u00e7ais'}</span>
                    <ChevronDown className="w-3 h-3" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                  <DropdownMenuItem
                    onClick={() => handleLocaleChange('ar')}
                    className={cn(locale === 'ar' && 'bg-muted font-medium')}
                  >
                    العربية
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleLocaleChange('fr')}
                    className={cn(locale === 'fr' && 'bg-muted font-medium')}
                  >
                    Fran\u00e7ais
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <div
        className={cn(
          'bg-white/95 backdrop-blur-md border-b border-border transition-shadow',
          scrolled && 'shadow-[var(--shadow-md)]'
        )}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-4">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5 shrink-0">
              <div className="w-10 h-10 gradient-navy rounded-xl flex items-center justify-center shadow-sm">
                <Building2 className="w-5.5 h-5.5 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-bold text-navy leading-tight tracking-tight">
                  {locale === 'ar' ? 'بزنس إنفو' : 'BUSINFO'}
                </span>
                <span className="text-[10px] text-[var(--text-secondary)] leading-tight hidden sm:block">
                  {locale === 'ar' ? 'منصة الأعمال' : 'Business Platform'}
                </span>
              </div>
            </Link>

            {/* Desktop Search Bar */}
            <form
              onSubmit={handleSearch}
              className="hidden md:flex flex-1 max-w-xl mx-4"
            >
              <div className="relative w-full flex items-center">
                <Search className="absolute end-3 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-[var(--text-secondary)] pointer-events-none" />
                <Input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder={t.nav.search}
                  className="w-full h-10 pe-11 ps-4 bg-muted/50 border-border rounded-xl text-sm focus-visible:ring-navy/20 focus-visible:border-navy/40"
                />
              </div>
            </form>

            {/* Desktop Nav Links */}
            <nav className="hidden lg:flex items-center gap-0.5">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    'px-3 py-2 rounded-lg text-sm font-medium transition-nav',
                    isActive(link.href)
                      ? 'text-navy bg-navy/5'
                      : 'text-[var(--text-secondary)] hover:text-navy hover:bg-muted'
                  )}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* Desktop Auth + Actions */}
            <div className="hidden lg:flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="text-[var(--text-secondary)] hover:text-navy shrink-0"
                asChild
              >
                <Link href="/favorites">
                  <Heart className="w-5 h-5" />
                </Link>
              </Button>

              {user && profile ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-muted transition-colors">
                      <Avatar className="w-8 h-8">
                        <AvatarFallback className="bg-navy/10 text-navy text-xs font-semibold">
                          {profile.displayName.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium text-foreground max-w-20 truncate">
                        {profile.displayName}
                      </span>
                      <ChevronDown className="w-4 h-4 text-[var(--text-secondary)]" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard" className="flex items-center gap-2 cursor-pointer">
                        <User className="w-4 h-4" />
                        <span>{t.dashboard.profile}</span>
                      </Link>
                    </DropdownMenuItem>
                    {profile.role === 'admin' && (
                      <DropdownMenuItem asChild>
                        <Link href="/admin" className="flex items-center gap-2 cursor-pointer">
                          <ShieldCheck className="w-4 h-4" />
                          <span>{t.nav.adminPanel}</span>
                        </Link>
                      </DropdownMenuItem>
                    )}
                    {(profile.role === 'supplier' || profile.role === 'user') && (
                      <DropdownMenuItem asChild>
                        <Link href="/dashboard" className="flex items-center gap-2 cursor-pointer">
                          <LayoutDashboard className="w-4 h-4" />
                          <span>{t.nav.dashboard}</span>
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={signOut}
                      className="text-red-600 focus:text-red-600 cursor-pointer"
                    >
                      <LogOut className="w-4 h-4 ms-2" />
                      <span>{t.nav.logout}</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/login" className="flex items-center gap-1.5">
                      <LogIn className="w-4 h-4" />
                      <span>{t.nav.login}</span>
                    </Link>
                  </Button>
                  <Button
                    size="sm"
                    asChild
                    className="bg-navy hover:bg-navy-light text-white rounded-lg"
                  >
                    <Link href="/register" className="flex items-center gap-1.5">
                      <UserPlus className="w-4 h-4" />
                      <span>{t.nav.register}</span>
                    </Link>
                  </Button>
                </div>
              )}
            </div>

            {/* Mobile Menu */}
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild className="lg:hidden">
                <Button variant="ghost" size="icon" className="shrink-0">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent
                side="left"
                className="w-80 p-0 overflow-y-auto"
              >
                <SheetTitle className="sr-only">القائمة الرئيسية</SheetTitle>
                <div className="flex flex-col h-full">
                  {/* Mobile Header */}
                  <div className="flex items-center justify-between p-4 border-b border-border">
                    <Link
                      href="/"
                      className="flex items-center gap-2.5"
                      onClick={() => setMobileOpen(false)}
                    >
                      <div className="w-9 h-9 gradient-navy rounded-xl flex items-center justify-center">
                        <Building2 className="w-5 h-5 text-white" />
                      </div>
                      <span className="text-lg font-bold text-navy">
                        {locale === 'ar' ? 'بزنس إنفو' : 'BUSINFO'}
                      </span>
                    </Link>
                  </div>

                  {/* Mobile Search */}
                  <div className="p-4 border-b border-border">
                    <form onSubmit={handleSearch} className="relative">
                      <Search className="absolute end-3 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-[var(--text-secondary)] pointer-events-none" />
                      <Input
                        type="text"
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        placeholder={t.nav.search}
                        className="w-full h-10 pe-11 ps-4 bg-muted/50 border-border rounded-xl text-sm"
                      />
                    </form>
                  </div>

                  {/* Mobile Nav Links */}
                  <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
                    {renderNavLinks(() => setMobileOpen(false))}

                    {user && profile && (
                      <>
                        <Separator className="my-3" />
                        {profile.role === 'admin' && (
                          <Link
                            href="/admin"
                            onClick={() => setMobileOpen(false)}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-[var(--text-secondary)] hover:bg-muted transition-nav"
                          >
                            <ShieldCheck className="w-5 h-5" />
                            {t.nav.adminPanel}
                          </Link>
                        )}
                        {(profile.role === 'supplier' || profile.role === 'user') && (
                          <Link
                            href="/dashboard"
                            onClick={() => setMobileOpen(false)}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-[var(--text-secondary)] hover:bg-muted transition-nav"
                          >
                            <LayoutDashboard className="w-5 h-5" />
                            {t.nav.dashboard}
                          </Link>
                        )}
                        <Link
                          href="/favorites"
                          onClick={() => setMobileOpen(false)}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-[var(--text-secondary)] hover:bg-muted transition-nav"
                        >
                          <Heart className="w-5 h-5" />
                          {locale === 'ar' ? 'المفضلة' : 'Favoris'}
                        </Link>
                      </>
                    )}
                  </nav>

                  {/* Mobile Footer Actions */}
                  <div className="p-4 border-t border-border">
                    {/* Language Switcher Mobile */}
                    <div className="flex items-center gap-2 mb-3">
                      <Globe className="w-4 h-4 text-[var(--text-secondary)]" />
                      <div className="flex rounded-lg border border-border overflow-hidden">
                        <button
                          onClick={() => handleLocaleChange('ar')}
                          className={cn(
                            'px-3 py-1.5 text-xs font-medium transition-colors',
                            locale === 'ar'
                              ? 'bg-navy text-white'
                              : 'text-[var(--text-secondary)] hover:bg-muted'
                          )}
                        >
                          العربية
                        </button>
                        <button
                          onClick={() => handleLocaleChange('fr')}
                          className={cn(
                            'px-3 py-1.5 text-xs font-medium transition-colors',
                            locale === 'fr'
                              ? 'bg-navy text-white'
                              : 'text-[var(--text-secondary)] hover:bg-muted'
                          )}
                        >
                          Fran\u00e7ais
                        </button>
                      </div>
                    </div>

                    {user && profile ? (
                      <Button
                        variant="outline"
                        className="w-full border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                        onClick={() => {
                          signOut();
                          setMobileOpen(false);
                        }}
                      >
                        <LogOut className="w-4 h-4 me-2" />
                        {t.nav.logout}
                      </Button>
                    ) : (
                      <div className="space-y-2">
                        <Button
                          asChild
                          className="w-full bg-navy hover:bg-navy-light text-white rounded-lg"
                          onClick={() => setMobileOpen(false)}
                        >
                          <Link href="/login">
                            <LogIn className="w-4 h-4 me-2" />
                            {t.nav.login}
                          </Link>
                        </Button>
                        <Button
                          variant="outline"
                          asChild
                          className="w-full rounded-lg"
                          onClick={() => setMobileOpen(false)}
                        >
                          <Link href="/register">
                            <UserPlus className="w-4 h-4 me-2" />
                            {t.nav.register}
                          </Link>
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
