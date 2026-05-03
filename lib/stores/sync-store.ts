import { create } from 'zustand';
import { db, getPendingSync, clearSyncedOperations } from '@/lib/db/dexie';

interface SyncState {
  isOnline: boolean;
  isSyncing: boolean;
  pendingCount: number;
  lastSyncTime: Date | null;
  syncError: string | null;
}

interface SyncActions {
  setOnline: (online: boolean) => void;
  checkConnection: () => void;
  syncPending: () => Promise<void>;
  updatePendingCount: () => Promise<void>;
}

export const useSyncStore = create<SyncState & SyncActions>((set, get) => ({
  isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
  isSyncing: false,
  pendingCount: 0,
  lastSyncTime: null,
  syncError: null,

  setOnline: (online: boolean) => {
    set({ isOnline: online });
    if (online) {
      // Trigger sync when coming back online
      get().syncPending();
    }
  },

  checkConnection: () => {
    if (typeof navigator !== 'undefined') {
      set({ isOnline: navigator.onLine });
    }
  },

  updatePendingCount: async () => {
    try {
      const pending = await getPendingSync();
      set({ pendingCount: pending.length });
    } catch (error) {
      console.error('[v0] Failed to get pending count:', error);
    }
  },

  syncPending: async () => {
    const { isOnline, isSyncing } = get();
    
    if (!isOnline || isSyncing) return;
    
    set({ isSyncing: true, syncError: null });
    
    try {
      const pendingOps = await getPendingSync();
      
      if (pendingOps.length === 0) {
        set({ isSyncing: false, lastSyncTime: new Date() });
        return;
      }
      
      // In production, this would make API calls to sync data
      // For now, we just mark them as synced
      for (const op of pendingOps) {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Mark as synced
        await db.syncQueue.update(op.id, { status: 'synced' });
      }
      
      // Clean up synced operations
      await clearSyncedOperations();
      
      set({
        isSyncing: false,
        lastSyncTime: new Date(),
        pendingCount: 0,
      });
    } catch (error) {
      console.error('[v0] Sync failed:', error);
      set({
        isSyncing: false,
        syncError: 'Failed to sync data. Will retry when online.',
      });
    }
  },
}));

// Set up online/offline listeners
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    useSyncStore.getState().setOnline(true);
  });
  
  window.addEventListener('offline', () => {
    useSyncStore.getState().setOnline(false);
  });
}
