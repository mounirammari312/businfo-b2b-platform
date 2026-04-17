'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useLocaleStore } from '@/lib/store';
import { getTranslation } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Building2,
  Mail,
  Phone,
  MapPin,
  Send,
  Facebook,
  Twitter,
  Linkedin,
  Instagram,
  Youtube,
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  Headphones,
  Truck,
} from 'lucide-react';

export default function Footer() {
  const { locale } = useLocaleStore();
  const t = getTranslation(locale);
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const isRtl = locale === 'ar';

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setSubscribed(true);
      setEmail('');
      setTimeout(() => setSubscribed(false), 4000);
    }
  };

  const ArrowIcon = isRtl ? ArrowLeft : ArrowRight;

  const categoryLinks = [
    { href: '/suppliers?category=construction', label: t.categories.construction },
    { href: '/suppliers?category=electronics', label: t.categories.electronics },
    { href: '/suppliers?category=food', label: t.categories.food },
    { href: '/suppliers?category=textiles', label: t.categories.textiles },
    { href: '/suppliers?category=chemicals', label: t.categories.chemicals },
    { href: '/suppliers?category=technology', label: t.categories.technology },
  ];

  const quickLinks = [
    { href: '/', label: t.nav.home },
    { href: '/suppliers', label: t.nav.suppliers },
    { href: '/products', label: t.nav.products },
    { href: '/register', label: locale === 'ar' ? 'سجّل كمورد' : "S'inscrire comme fournisseur" },
    { href: '/login', label: t.nav.login },
    { href: '/help', label: t.footer.helpCenter },
  ];

  const socialLinks = [
    { icon: Facebook, href: '#', label: 'Facebook' },
    { icon: Twitter, href: '#', label: 'Twitter' },
    { icon: Linkedin, href: '#', label: 'LinkedIn' },
    { icon: Instagram, href: '#', label: 'Instagram' },
    { icon: Youtube, href: '#', label: 'YouTube' },
  ];

  return (
    <footer className="bg-navy-dark text-white mt-auto">
      {/* Features Bar */}
      <div className="border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: ShieldCheck,
                title: locale === 'ar' ? 'موردون معتمدون' : 'Fournisseurs certifi\u00e9s',
                desc: locale === 'ar'
                  ? 'جميع الموردين المعلنين موثقون ومتحقق منهم'
                  : 'Tous les fournisseurs sont v\u00e9rifi\u00e9s et certifi\u00e9s',
              },
              {
                icon: Truck,
                title: locale === 'ar' ? 'توصيل في جميع أنحاء الجزائر' : 'Livraison partout en Alg\u00e9rie',
                desc: locale === 'ar'
                  ? 'شبكة توصيل واسعة تغطي جميع الولايات'
                  : 'R\u00e9seau de livraison couvrant toutes les wilayas',
              },
              {
                icon: Headphones,
                title: locale === 'ar' ? 'دعم فني متواصل' : 'Support client 24/7',
                desc: locale === 'ar'
                  ? 'فريق دعم متخصص لمساعدتك على مدار الساعة'
                  : '\u00c9quipe de support d\u00e9di\u00e9e disponible 24h/24',
              },
            ].map((feature, i) => (
              <div key={i} className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                  <feature.icon className="w-5.5 h-5.5 text-gold" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-white mb-1">{feature.title}</h3>
                  <p className="text-xs text-white/60 leading-relaxed">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* About Businfo */}
          <div className="lg:col-span-1">
            <Link href="/" className="flex items-center gap-2.5 mb-5">
              <div className="w-10 h-10 gradient-gold rounded-xl flex items-center justify-center">
                <Building2 className="w-5.5 h-5.5 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-bold text-white leading-tight">
                  {locale === 'ar' ? 'بزنس إنفو' : 'BUSINFO'}
                </span>
                <span className="text-[10px] text-white/50 leading-tight">
                  {locale === 'ar' ? 'منصة الأعمال' : 'Business Platform'}
                </span>
              </div>
            </Link>
            <p className="text-sm text-white/60 leading-relaxed mb-5">
              {t.footer.aboutDesc}
            </p>
            {/* Social Links */}
            <div className="flex items-center gap-2">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  aria-label={social.label}
                  className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center text-white/60 hover:bg-gold hover:text-white transition-colors"
                >
                  <social.icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-semibold text-sm mb-5 flex items-center gap-2">
              <div className="w-1 h-4 bg-gold rounded-full" />
              {t.footer.quickLinks}
            </h3>
            <ul className="space-y-3">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-white/60 hover:text-gold transition-colors flex items-center gap-2 group"
                  >
                    <ArrowIcon className="w-3.5 h-3.5 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                    <span>{link.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h3 className="text-white font-semibold text-sm mb-5 flex items-center gap-2">
              <div className="w-1 h-4 bg-gold rounded-full" />
              {t.footer.categories}
            </h3>
            <ul className="space-y-3">
              {categoryLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-white/60 hover:text-gold transition-colors flex items-center gap-2 group"
                  >
                    <ArrowIcon className="w-3.5 h-3.5 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                    <span>{link.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact + Newsletter */}
          <div>
            <h3 className="text-white font-semibold text-sm mb-5 flex items-center gap-2">
              <div className="w-1 h-4 bg-gold rounded-full" />
              {t.footer.contact}
            </h3>
            <ul className="space-y-3 mb-6">
              <li className="flex items-center gap-2.5 text-sm text-white/60">
                <Mail className="w-4 h-4 text-gold shrink-0" />
                <span>{t.nav.topBar.email}</span>
              </li>
              <li className="flex items-center gap-2.5 text-sm text-white/60">
                <Phone className="w-4 h-4 text-gold shrink-0" />
                <span dir="ltr">{t.nav.topBar.phone}</span>
              </li>
              <li className="flex items-center gap-2.5 text-sm text-white/60">
                <MapPin className="w-4 h-4 text-gold shrink-0" />
                <span>{t.footer.address}</span>
              </li>
            </ul>

            {/* Newsletter */}
            <div>
              <p className="text-sm text-white/60 mb-3">{t.footer.newsletterDesc}</p>
              <form onSubmit={handleSubscribe} className="flex gap-2">
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t.footer.emailPlaceholder}
                  className="flex-1 h-10 bg-white/10 border-white/20 text-white text-sm placeholder:text-white/40 rounded-lg focus-visible:ring-gold/30 focus-visible:border-gold/50"
                  dir="ltr"
                />
                <Button
                  type="submit"
                  size="icon"
                  className="h-10 w-10 bg-gold hover:bg-gold-dark text-white rounded-lg shrink-0"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </form>
              {subscribed && (
                <p className="text-xs text-gold mt-2">{t.footer.subscribeSuccess}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Copyright Bar */}
      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-white/40">
              &copy; {new Date().getFullYear()}{' '}
              {locale === 'ar' ? 'بزنس إنفو' : 'BUSINFO'}. {t.footer.rights}.
            </p>
            <div className="flex items-center gap-4">
              <Link href="/terms" className="text-xs text-white/40 hover:text-white/70 transition-colors">
                {t.footer.terms}
              </Link>
              <Separator orientation="vertical" className="h-3 bg-white/20" />
              <Link href="/privacy" className="text-xs text-white/40 hover:text-white/70 transition-colors">
                {t.footer.privacy}
              </Link>
              <Separator orientation="vertical" className="h-3 bg-white/20" />
              <Link href="/faq" className="text-xs text-white/40 hover:text-white/70 transition-colors">
                {t.footer.faq}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
