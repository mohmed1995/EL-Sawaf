import { ipcMain } from 'electron';
import type { CheckoutRequest, CheckoutResult, EvaluateInput, PaymentMethod } from '../../shared/cashier-types';
import type { CustomerRepo } from '../repos/customer.repo';
import type { ProductRepo } from '../repos/product.repo';
import type { CheckoutService } from '../services/checkout.service';
import { CASHIER_CHANNELS } from '../../shared/cashier-channels.js';

const MAX_QTY_MM = 1_000_000;
const MAX_LINES = 200;
const MAX_QUERY = 100;

class ValidationError extends Error {}

/* ---------- محللات المدخلات: لا نثق بأي شيء قادم من الـ Renderer ---------- */
const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null;
const posInt = (v: unknown, max = Number.MAX_SAFE_INTEGER): number => {
  if (typeof v !== 'number' || !Number.isSafeInteger(v) || v <= 0 || v > max) throw new ValidationError('رقم غير صالح');
  return v;
};

function parseQuery(raw: unknown): string {
  if (typeof raw !== 'string' || raw.length > MAX_QUERY) throw new ValidationError('نص البحث غير صالح');
  return raw;
}

function parseEvaluate(raw: unknown): EvaluateInput[] {
  if (!Array.isArray(raw) || raw.length > MAX_LINES) throw new ValidationError('طلب غير صالح');
  return raw.map((r) => {
    if (!isRecord(r) || typeof r.lineKey !== 'string') throw new ValidationError('سطر غير صالح');
    return { lineKey: r.lineKey, productId: posInt(r.productId), boltId: posInt(r.boltId), qtyMm: posInt(r.qtyMm, MAX_QTY_MM) };
  });
}

function parseCheckout(raw: unknown): CheckoutRequest {
  if (!isRecord(raw) || !Array.isArray(raw.lines) || raw.lines.length > MAX_LINES) throw new ValidationError('طلب غير صالح');
  const method = raw.method;
  if (method !== 'cash' && method !== 'credit') throw new ValidationError('طريقة الدفع غير صالحة');
  const customerId = raw.customerId === null ? null : posInt(raw.customerId);
  const lines = raw.lines.map((r: unknown) => {
    if (!isRecord(r) || typeof r.acceptBust !== 'boolean') throw new ValidationError('سطر غير صالح');
    return { productId: posInt(r.productId), boltId: posInt(r.boltId), qtyMm: posInt(r.qtyMm, MAX_QTY_MM), acceptBust: r.acceptBust };
  });
  return { lines, customerId, method: method as PaymentMethod };
}

interface Deps {
  readonly products: ProductRepo;
  readonly customers: CustomerRepo;
  readonly checkout: CheckoutService;
}

export function registerCashierIpc({ products, customers, checkout }: Deps): void {
  ipcMain.handle(CASHIER_CHANNELS.searchProducts, (_e, raw: unknown) => products.search(parseQuery(raw)));

  ipcMain.handle(CASHIER_CHANNELS.searchCustomers, (_e, raw: unknown) => customers.search(parseQuery(raw)));

  ipcMain.handle(CASHIER_CHANNELS.evaluateBolt, (_e, raw: unknown) => checkout.evaluateOffers(parseEvaluate(raw)));

  // الدفع لا يرمي استثناءات للواجهة: يرجع CheckoutResult دائماً.
  ipcMain.handle(CASHIER_CHANNELS.checkout, (_e, raw: unknown): CheckoutResult => {
    try {
      return checkout.checkout(parseCheckout(raw));
    } catch (error) {
      if (error instanceof ValidationError) return { ok: false, code: 'INVALID_REQUEST', message: error.message };
      throw error;
    }
  });
}
