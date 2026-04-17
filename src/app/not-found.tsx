import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { FileQuestion, Home, ArrowRight } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <div className="max-w-lg mx-auto px-4 sm:px-6 text-center py-20">
        {/* Icon */}
        <div className="w-24 h-24 mx-auto mb-8 rounded-3xl bg-navy/5 flex items-center justify-center">
          <FileQuestion className="w-12 h-12 text-navy/40" />
        </div>

        {/* 404 Text */}
        <h1 className="text-7xl md:text-8xl font-bold text-navy/10 mb-4">404</h1>

        {/* Message */}
        <h2 className="text-xl md:text-2xl font-bold text-foreground mb-3">
          الصفحة غير موجودة
        </h2>
        <p className="text-muted-foreground text-base leading-relaxed mb-8 max-w-sm mx-auto">
          عذراً، الصفحة التي تبحث عنها غير موجودة أو تم نقلها إلى عنوان آخر.
          يرجى التحقق من الرابط أو العودة إلى الصفحة الرئيسية.
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button
            asChild
            size="lg"
            className="bg-navy hover:bg-navy-light text-white rounded-lg"
          >
            <Link href="/">
              <Home className="w-4 h-4 me-2" />
              العودة للرئيسية
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            size="lg"
            className="rounded-lg"
          >
            <Link href="/contact">
              <ArrowRight className="w-4 h-4 me-2" />
              تواصل معنا
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
