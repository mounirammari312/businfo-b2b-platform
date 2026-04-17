import { ar } from './ar';
import { fr } from './fr';
import type { TranslationKeys } from './ar';

export type Locale = 'ar' | 'fr';

const translations: Record<Locale, TranslationKeys> = { ar, fr };

export function getTranslation(locale: Locale): TranslationKeys {
  return translations[locale] || translations.ar;
}

export { ar, fr };
export type { TranslationKeys };
