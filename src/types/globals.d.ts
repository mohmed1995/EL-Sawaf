import type { CashierApi } from '../shared/cashier-types';

declare global {
  interface Window {
    /** يُعرَّف في preload عبر contextBridge. */
    readonly sawwaf: { readonly cashier: CashierApi };
  }
}
export {};
