import { useCallback, useState } from 'react';
import type { CustomerHit } from '../shared/cashier-types';
import type { CartState } from './cart.reducer';

export interface HeldInvoice {
  readonly id: string;
  readonly heldAt: number;
  readonly cart: CartState;
  readonly customer: CustomerHit | null;
}

const STORAGE_KEY = 'sawwaf.held-invoices.v1';

// BigInt لا يُسلسل في JSON، فنحوّله إلى كائن موسوم ونعيده عند القراءة.
const replacer = (_k: string, v: unknown): unknown => (typeof v === 'bigint' ? { __big: v.toString() } : v);
const reviver = (_k: string, v: unknown): unknown =>
  v && typeof v === 'object' && '__big' in v ? BigInt((v as { __big: string }).__big) : v;

function load(): HeldInvoice[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw, reviver) as HeldInvoice[]) : [];
  } catch {
    return [];
  }
}

function persist(list: readonly HeldInvoice[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list, replacer));
  } catch {
    /* التخزين ممتلئ أو غير متاح: نتجاهل ولا نوقف الكاشير */
  }
}

/** الفواتير المجمّدة (F4) تبقى بعد إعادة التشغيل وانقطاع الكهرباء. */
export function useHeldInvoices() {
  const [held, setHeld] = useState<readonly HeldInvoice[]>(load);

  const hold = useCallback((cart: CartState, customer: CustomerHit | null) => {
    setHeld((prev) => {
      const next = [...prev, { id: crypto.randomUUID(), heldAt: Date.now(), cart, customer }];
      persist(next);
      return next;
    });
  }, []);

  const take = useCallback(
    (id: string): HeldInvoice | undefined => {
      const found = held.find((h) => h.id === id);
      if (!found) return undefined;
      const next = held.filter((h) => h.id !== id);
      persist(next);
      setHeld(next);
      return found;
    },
    [held],
  );

  return { held, hold, take };
}
