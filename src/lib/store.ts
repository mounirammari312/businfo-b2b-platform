import { create } from 'zustand';
import type { Locale } from './i18n';

// ============================================
// Locale Store
// ============================================

interface LocaleState {
  locale: Locale;
  dir: 'rtl' | 'ltr';
  setLocale: (locale: Locale) => void;
}

export const useLocaleStore = create<LocaleState>((set) => ({
  locale: 'ar',
  dir: 'rtl',
  setLocale: (locale: Locale) => {
    set({
      locale,
      dir: locale === 'ar' ? 'rtl' : 'ltr',
    });
    // Update HTML attributes for RTL/LTR
    if (typeof document !== 'undefined') {
      document.documentElement.lang = locale;
      document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr';
    }
  },
}));

// ============================================
// Currency Store
// ============================================

export type Currency = 'DZD' | 'EUR' | 'USD';

interface CurrencyState {
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  formatPrice: (amount: number) => string;
}

const currencySymbols: Record<Currency, { symbol: string; position: 'before' | 'after'; locale: string }> = {
  DZD: { symbol: 'DA', position: 'after', locale: 'ar-DZ' },
  EUR: { symbol: '\u20ac', position: 'before', locale: 'fr-FR' },
  USD: { symbol: '$', position: 'before', locale: 'en-US' },
};

export const useCurrencyStore = create<CurrencyState>((set, get) => ({
  currency: 'DZD',
  setCurrency: (currency: Currency) => set({ currency }),
  formatPrice: (amount: number) => {
    const { currency } = get();
    const config = currencySymbols[currency];
    const formatted = new Intl.NumberFormat(config.locale, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);

    if (config.position === 'before') {
      return `${config.symbol}${formatted}`;
    }
    return `${formatted} ${config.symbol}`;
  },
}));

// ============================================
// Search Store
// ============================================

export interface SearchFilters {
  category: string;
  minPrice: number | null;
  maxPrice: number | null;
  sortBy: 'newest' | 'priceLow' | 'priceHigh' | 'rating';
  inStock: boolean;
}

const defaultFilters: SearchFilters = {
  category: 'all',
  minPrice: null,
  maxPrice: null,
  sortBy: 'newest',
  inStock: false,
};

interface SearchState {
  query: string;
  filters: SearchFilters;
  setQuery: (query: string) => void;
  setFilters: (filters: Partial<SearchFilters>) => void;
  clearFilters: () => void;
  resetSearch: () => void;
}

export const useSearchStore = create<SearchState>((set) => ({
  query: '',
  filters: { ...defaultFilters },
  setQuery: (query: string) => set({ query }),
  setFilters: (filters: Partial<SearchFilters>) =>
    set((state) => ({ filters: { ...state.filters, ...filters } })),
  clearFilters: () => set({ filters: { ...defaultFilters } }),
  resetSearch: () => set({ query: '', filters: { ...defaultFilters } }),
}));

// ============================================
// UI State Store (keep existing)
// ============================================

interface UIState {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: false,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
}));
