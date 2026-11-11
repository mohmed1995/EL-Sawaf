/** أضف هذه القنوات إلى IpcContract الحالي (src/shared/ipc-contract.ts) بنفس الأسماء. */
export const CASHIER_CHANNELS = {
  searchProducts: 'cashier:search-products',
  searchCustomers: 'cashier:search-customers',
  evaluateBolt: 'cashier:evaluate-bolt',
  checkout: 'cashier:checkout',
} as const;
