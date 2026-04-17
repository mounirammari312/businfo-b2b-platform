import type { Metadata } from 'next';
import { Cairo, Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/sonner';
import { AuthProvider } from '@/lib/auth-context';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

const cairo = Cairo({
  variable: '--font-cairo',
  subsets: ['arabic', 'latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  display: 'swap',
});

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'بزنس إنفو | BUSINFO - منصة ربط الموردين والشركات',
  description: 'منصة بزنس إنفو لربط الموردين والشركات الكبرى. ابحث عن أفضل الموردين والمنتجات في الجزائر والشرق الأوسط.',
  icons: {
    icon: 'https://z-cdn.chatglm.cn/z-ai/static/logo.svg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body
        className={`${cairo.variable} ${inter.variable} font-[family-name:var(--font-cairo)] antialiased bg-[var(--bg-light)] text-foreground min-h-screen flex flex-col`}
      >
        <AuthProvider>
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
        </AuthProvider>
        <Toaster position="top-center" dir="rtl" />
      </body>
    </html>
  );
}
