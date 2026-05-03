'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type AppLanguage = 'en' | 'sw';

interface LanguageState {
  language: AppLanguage;
  setLanguage: (language: AppLanguage) => void;
}

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set) => ({
      language: 'en',
      setLanguage: (language) => set({ language }),
    }),
    {
      name: 'app-language-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
