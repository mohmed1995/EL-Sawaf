import { contextBridge, ipcRenderer } from 'electron';
import type { CashierApi } from '../shared/cashier-types';
import { CASHIER_CHANNELS } from '../shared/cashier-channels';

const cashier: CashierApi = {
  searchProducts: (q) => ipcRenderer.invoke(CASHIER_CHANNELS.searchProducts, q),
  searchCustomers: (q) => ipcRenderer.invoke(CASHIER_CHANNELS.searchCustomers, q),
  evaluateBolt: (lines) => ipcRenderer.invoke(CASHIER_CHANNELS.evaluateBolt, lines),
  checkout: (req) => ipcRenderer.invoke(CASHIER_CHANNELS.checkout, req),
};

contextBridge.exposeInMainWorld('sawwaf', { cashier });
