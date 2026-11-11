import type { Mm, Piasters } from '../shared/cashier-types';

const meters = new Intl.NumberFormat('ar-EG', { maximumFractionDigits: 2 });
const money = new Intl.NumberFormat('ar-EG', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const fmtMeters = (mm: Mm): string => `${meters.format(mm / 1000)} م`;
export const fmtMoney = (p: Piasters): string => `${money.format(Number(p) / 100)} ج.م`;
