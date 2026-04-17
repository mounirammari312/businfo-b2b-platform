# Businfo B2B Platform - دليل النشر

## المتطلبات
- Node.js 18+ أو Bun
- حساب Supabase (مشروع جديد أو موجود)

## خطوات النشر

### 1. إعداد قاعدة البيانات
1. اذهب إلى https://supabase.com وافتح مشروعك
2. اذهب إلى SQL Editor
3. انسخ محتوى ملف `supabase/schema.sql`
4. الصقه في المحرر واضغط Run
5. انتظر حتى تكتمل العملية

### 2. إعداد المتغيرات البيئية
1. انسخ ملف `.env.example` إلى `.env.local`
2. عدّل القيم التالية:
   - `NEXT_PUBLIC_SUPABASE_URL`: رابط مشروع Supabase
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: مفتاح Anon من Supabase Settings > API

### 3. تثبيت الحزم وتشغيل
```bash
bun install
bun run dev
```

### 4. النشر على Vercel
1. ارفع المشروع إلى GitHub
2. اذهب إلى https://vercel.com
3. استورد المشروع من GitHub
4. أضف المتغيرات البيئية في Vercel Settings
5. اضغط Deploy

### 5. إنشاء حساب المسؤول
بعد تفعيل قاعدة البيانات:
1. أنشئ حساب مسؤول من Supabase Auth Dashboard
2. أو استخدم seed data (المستخدمين التجريبيين موجودون)

## هيكل المشروع
- `src/app/` - الصفحات
- `src/components/` - المكونات
- `src/lib/` - المكتبات والوظائف المساعدة
- `supabase/schema.sql` - مخطط قاعدة البيانات

## التقنيات المستخدمة
- Next.js 16, TypeScript, Tailwind CSS 4
- Supabase (Auth, Database, Storage)
- shadcn/ui, Lucide Icons, Recharts
- Zustand, React Hook Form, Zod
