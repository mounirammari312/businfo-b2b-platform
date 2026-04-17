import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// ============================================
// cn() - Class name utility (clsx + tailwind-merge)
// ============================================

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ============================================
// formatPrice() - Format price with currency symbol
// ============================================

const currencyConfig: Record<string, { symbol: string; position: 'before' | 'after'; locale: string }> = {
  DZD: { symbol: 'DA', position: 'after', locale: 'ar-DZ' },
  EUR: { symbol: '\u20ac', position: 'before', locale: 'fr-FR' },
  USD: { symbol: '$', position: 'before', locale: 'en-US' },
};

export function formatPrice(amount: number, currency: string = 'DZD'): string {
  const config = currencyConfig[currency] || currencyConfig.DZD;
  const formatted = new Intl.NumberFormat(config.locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);

  if (config.position === 'before') {
    return `${config.symbol}${formatted}`;
  }
  return `${formatted} ${config.symbol}`;
}

// ============================================
// formatDate() - Format date in Arabic/French locale
// ============================================

export function formatDate(date: string | Date, locale: string = 'ar'): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const localeCode = locale === 'fr' ? 'fr-DZ' : 'ar-DZ';

  return d.toLocaleDateString(localeCode, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function formatDateShort(date: string | Date, locale: string = 'ar'): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const localeCode = locale === 'fr' ? 'fr-DZ' : 'ar-DZ';

  return d.toLocaleDateString(localeCode, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatRelativeTime(date: string | Date, locale: string = 'ar'): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);

  if (locale === 'fr') {
    if (diffSeconds < 60) return "\u00e0 l'instant";
    if (diffMinutes < 60) return `il y a ${diffMinutes} min`;
    if (diffHours < 24) return `il y a ${diffHours}h`;
    if (diffDays < 7) return `il y a ${diffDays}j`;
    if (diffWeeks < 4) return `il y a ${diffWeeks} sem`;
    if (diffMonths < 12) return `il y a ${diffMonths} mois`;
    return formatDateShort(d, 'fr');
  }

  // Arabic
  if (diffSeconds < 60) return '\u0627\u0644\u0622\u0646';
  if (diffMinutes < 60) return `منذ ${diffMinutes} دقيقة`;
  if (diffHours < 24) return `منذ ${diffHours} ساعة`;
  if (diffDays < 7) return `منذ ${diffDays} يوم`;
  if (diffWeeks < 4) return `منذ ${diffWeeks} أسبوع`;
  if (diffMonths < 12) return `منذ ${diffMonths} شهر`;
  return formatDateShort(d, 'ar');
}

// ============================================
// generateSlug() - URL slug generator
// ============================================

export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[\u0600-\u06FF]/g, (match) => {
      const arabicToLatin: Record<string, string> = {
        '\u0627': 'a', '\u0628': 'b', '\u062a': 't', '\u062b': 'th',
        '\u062c': 'j', '\u062d': 'h', '\u062e': 'kh', '\u062f': 'd',
        '\u0630': 'dh', '\u0631': 'r', '\u0632': 'z', '\u0633': 's',
        '\u0634': 'sh', '\u0635': 's', '\u0636': 'd', '\u0637': 't',
        '\u0638': 'z', '\u0639': 'a', '\u063a': 'gh', '\u0641': 'f',
        '\u0642': 'q', '\u0643': 'k', '\u0644': 'l', '\u0645': 'm',
        '\u0646': 'n', '\u0647': 'h', '\u0648': 'w', '\u064a': 'y',
      };
      return arabicToLatin[match] || match;
    })
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

// ============================================
// truncateText() - Text truncation
// ============================================

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  const truncated = text.slice(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');
  if (lastSpace > maxLength * 0.7) {
    return truncated.slice(0, lastSpace) + '...';
  }
  return truncated + '...';
}

// ============================================
// getInitials() - Get first letters for avatar
// ============================================

export function getInitials(name: string): string {
  if (!name || !name.trim()) return '?';
  const cleaned = name.trim();

  // Check for Arabic name
  const arabicRegex = /[\u0600-\u06FF]/;
  if (arabicRegex.test(cleaned)) {
    const words = cleaned.split(/\s+/);
    if (words.length >= 2) {
      return (words[0][0] + words[words.length - 1][0]).toUpperCase();
    }
    return cleaned.slice(0, 2).toUpperCase();
  }

  // Latin name
  const words = cleaned.split(/\s+/);
  if (words.length >= 2) {
    return (words[0][0] + words[words.length - 1][0]).toUpperCase();
  }
  return cleaned.slice(0, 2).toUpperCase();
}

// ============================================
// formatRating() - Format star rating
// ============================================

export function formatRating(rating: number): string {
  return rating.toFixed(1);
}

export function getRatingColor(rating: number): string {
  if (rating >= 4.5) return 'text-green-600';
  if (rating >= 4.0) return 'text-green-500';
  if (rating >= 3.0) return 'text-yellow-500';
  if (rating >= 2.0) return 'text-orange-500';
  return 'text-red-500';
}

// ============================================
// formatNumber() - Format numbers with locale
// ============================================

export function formatNumber(num: number, locale: string = 'ar'): string {
  const localeCode = locale === 'fr' ? 'fr-DZ' : 'ar-DZ';
  return new Intl.NumberFormat(localeCode).format(num);
}

// ============================================
// isValidEmail() - Email validation
// ============================================

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// ============================================
// sleep() - Promise delay
// ============================================

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
