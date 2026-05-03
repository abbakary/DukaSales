import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { User, Company, BusinessType } from '@/lib/types';
import { getMeApi, loginApi } from '@/lib/api/auth';
import { syncTenantDataFromApi } from '@/lib/services/sync-from-api';

interface AuthState {
  user: User | null;
  company: Company | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

interface AuthActions {
  login: (email: string, password: string) => Promise<{ success: boolean; role?: string }>;
  logout: () => void;
  setLoading: (loading: boolean) => void;
  clearError: () => void;
  updateCompany: (company: Partial<Company>) => void;
  updateUser: (user: Partial<User>) => void;
}

export const useAuthStore = create<AuthState & AuthActions>()(
  persist(
    (set, get) => ({
      user: null,
      company: null,
      token: null,
      isAuthenticated: false,
      isLoading: true,
      error: null,

      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });

        try {
          const loginResponse = await loginApi(email, password);
          const meResponse = await getMeApi(loginResponse.access_token);

          set({
            user: meResponse.user,
            company: meResponse.company,
            token: loginResponse.access_token,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
          // Non-blocking initial sync. Avoid delaying app start on slow networks.
          if (loginResponse.role !== 'super_admin') {
            syncTenantDataFromApi(loginResponse.access_token).catch(() => {});
          }
          return { success: true, role: loginResponse.role };
        } catch (err) {
          console.error('[auth] Login error:', err);
          // Check if it's a network error
          if (err instanceof Error && err.message.includes('Network error')) {
            set({ error: 'Tafadhali hakikisha seva ya backend inaendeshwa. Jaribu kuanza seva kwenye port 8000.', isLoading: false });
          } else {
            set({ error: 'Barua pepe au nenosiri si sahihi', isLoading: false });
          }
          return { success: false };
        }
      },

      logout: () => {
        set({
          user: null,
          company: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
        });
      },

      setLoading: (loading: boolean) => set({ isLoading: loading }),
      clearError: () => set({ error: null }),

      updateCompany: (companyUpdate: Partial<Company>) => {
        const { company } = get();
        if (company) {
          set({ company: { ...company, ...companyUpdate, updatedAt: new Date() } });
        }
      },

      updateUser: (userUpdate: Partial<User>) => {
        const { user } = get();
        if (user) {
          set({ user: { ...user, ...userUpdate, updatedAt: new Date() } });
        }
      },
    }),
    {
      name: 'pos-auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: state => ({
        user: state.user,
        company: state.company,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => state => {
        if (!state) return;
        if (!state.token) {
          state.isLoading = false;
          return;
        }
        getMeApi(state.token)
          .then((me) => {
            state.user = me.user;
            state.company = me.company;
            state.isAuthenticated = true;
            state.isLoading = false;
            if (me.user.role !== 'super_admin') {
              // Delay heavy sync slightly to keep first paint fast.
              setTimeout(() => {
                syncTenantDataFromApi(state.token as string).catch(() => {
                  // Non-blocking hydration failure; local data may still exist.
                });
              }, 800);
            }
          })
          .catch(() => {
            state.user = null;
            state.company = null;
            state.token = null;
            state.isAuthenticated = false;
            state.isLoading = false;
          });
      },
    }
  )
);
