/**
 * Hook to get the current WABA ID
 * This hook detects the environment and returns the appropriate WABA ID
 */

import { useWabaContext } from '../context/WabaContext';

export function useWabaId(): string | null {
  // First, try to get WABA ID from context (if provided by parent app)
  const context = useWabaContext();
  if (context.wabaId) {
    return context.wabaId;
  }
  
  // Check if we're in a product environment by looking for WABA data
  // First, try to get WABA ID from session storage (cached by product app)
  try {
    const cachedWabaData = sessionStorage.getItem('waba_data_cache');
    if (cachedWabaData) {
      const data = JSON.parse(cachedWabaData);
      if (data.accounts && data.accounts.length > 0) {
        // Return the first available WABA ID
        return data.accounts[0].wabaId;
      }
    }
  } catch (error) {
    // Ignore session storage errors
  }
  
  // Check if we're in a product environment by looking for WABA store in localStorage
  try {
    const wabaStoreData = localStorage.getItem('waba-store');
    if (wabaStoreData) {
      const storeData = JSON.parse(wabaStoreData);
      if (storeData.state && storeData.state.wabaDetails && storeData.state.wabaDetails.waba_id) {
        return storeData.state.wabaDetails.waba_id;
      }
    }
  } catch (error) {
    // Ignore localStorage errors
  }
  
  // Check if we have any WABA-related data in the current window context
  if (typeof window !== 'undefined') {
    // Look for WABA data in window object (if set by product app)
    const windowWabaData = (window as any).__WABA_DATA__;
    if (windowWabaData && windowWabaData.wabaId) {
      return windowWabaData.wabaId;
    }
  }
  
  // In open source mode, WABA functionality is not available
  return null;
}

export function useWabaIdRequired(): string {
  const wabaId = useWabaId();
  if (!wabaId) {
    throw new Error('WABA functionality is not available in open source mode. Please use direct file URLs instead.');
  }
  return wabaId;
}
