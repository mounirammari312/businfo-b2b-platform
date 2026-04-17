export const CATEGORIES = [
  { key: 'all', icon: '🏢', labelAr: 'الكل', labelEn: 'All' },
  { key: 'construction', icon: '🏗️', labelAr: 'البناء والتشييد', labelEn: 'Construction' },
  { key: 'electronics', icon: '⚡', labelAr: 'الكهرباء والإلكترونيات', labelEn: 'Electronics' },
  { key: 'food', icon: '🍽️', labelAr: 'الأغذية والمشروبات', labelEn: 'Food & Beverages' },
  { key: 'textiles', icon: '🧵', labelAr: 'المنسوجات والأقمشة', labelEn: 'Textiles' },
  { key: 'chemicals', icon: '🧪', labelAr: 'المواد الكيميائية', labelEn: 'Chemicals' },
  { key: 'technology', icon: '💻', labelAr: 'التقنية والبرمجيات', labelEn: 'Technology' },
  { key: 'healthcare', icon: '🏥', labelAr: 'المستلزمات الطبية', labelEn: 'Healthcare' },
  { key: 'automotive', icon: '🚗', labelAr: 'قطع الغيار والسيارات', labelEn: 'Automotive' },
  { key: 'furniture', icon: '🪑', labelAr: 'الأثاث والمفروشات', labelEn: 'Furniture' },
] as const;

export const BADGE_LABELS: Record<string, { ar: string; en: string; color: string }> = {
  gold: { ar: 'مميز ذهبي', en: 'Gold Featured', color: 'bg-yellow-500 text-white' },
  blue: { ar: 'مميز أزرق', en: 'Blue Featured', color: 'bg-blue-500 text-white' },
  none: { ar: '', en: '', color: '' },
};

export const STATUS_LABELS: Record<string, { ar: string; en: string; color: string }> = {
  pending: { ar: 'قيد المراجعة', en: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
  approved: { ar: 'مقبول', en: 'Approved', color: 'bg-green-100 text-green-800' },
  active: { ar: 'نشط', en: 'Active', color: 'bg-green-100 text-green-800' },
  rejected: { ar: 'مرفوض', en: 'Rejected', color: 'bg-red-100 text-red-800' },
  expired: { ar: 'منتهي', en: 'Expired', color: 'bg-gray-100 text-gray-800' },
  paused: { ar: 'متوقف', en: 'Paused', color: 'bg-orange-100 text-orange-800' },
};

export const PLACEMENT_LABELS: Record<string, { ar: string; en: string }> = {
  top: { ar: 'إعلان رئيسي', en: 'Top Banner' },
  featured: { ar: 'مميز', en: 'Featured' },
  highlighted: { ar: 'مُبرز', en: 'Highlighted' },
};

export const ITEMS_PER_PAGE = 9;

export const SUPPLIER_CATEGORIES = CATEGORIES.filter(c => c.key !== 'all');
