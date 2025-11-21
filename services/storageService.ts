
import { KickSession } from '../types';

const GUEST_KEY = 'babykicks_history'; // Legacy key for guest/default
const getAccountKey = (id: string) => `babykicks_history_${id}`;

export const storageService = {
  // Load history based on account ID. If ID is 'guest' or undefined, uses default local key.
  loadHistory: (accountId?: string): KickSession[] => {
    const key = (!accountId || accountId === 'guest') ? GUEST_KEY : getAccountKey(accountId);
    const json = localStorage.getItem(key);
    return json ? JSON.parse(json) : [];
  },

  // Save history to the specific account's storage key
  saveHistory: (history: KickSession[], accountId?: string) => {
    const key = (!accountId || accountId === 'guest') ? GUEST_KEY : getAccountKey(accountId);
    localStorage.setItem(key, JSON.stringify(history));
  },

  // Mock Cloud Sync: Merge local (guest) history into target account history
  // This simulates what would happen on a backend when a user links a device.
  syncHistory: async (localHistory: KickSession[], targetAccountId: string): Promise<KickSession[]> => {
    // 1. Load "Remote" Data (Simulated by loading from that account's unique storage key)
    const remoteHistory = storageService.loadHistory(targetAccountId);
    
    // 2. Merge: Add local sessions that aren't in remote (avoid duplicates by ID)
    const merged = [...remoteHistory];
    const existingIds = new Set(remoteHistory.map(s => s.id));
    
    localHistory.forEach(session => {
      if (!existingIds.has(session.id)) {
        merged.push(session);
        existingIds.add(session.id);
      }
    });
    
    // 3. Save back to "Remote" (target account)
    storageService.saveHistory(merged, targetAccountId);
    
    return merged;
  }
};
