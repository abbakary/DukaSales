'use client';

import { useLanguageStore } from '@/lib/stores/language-store';
import { t } from '@/lib/i18n/translations';

export function useI18n() {
  const { language, setLanguage } = useLanguageStore();
  const translate = (key: string) => t(language, key);
  return {
    language,
    setLanguage,
    t: translate,
  };
}
