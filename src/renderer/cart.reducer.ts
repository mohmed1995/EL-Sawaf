import type { BustApplied, CartLine, Mm, ProductHit } from '../shared/cashier-types';
import { lineTotal } from '../shared/money';

export interface CartState {
  readonly lines: readonly CartLine[];
  readonly activeKey: string | null;
}

export const EMPTY_CART: CartState = { lines: [], activeKey: null };

export type CartAction =
  | { type: 'ADD'; key: string; hit: ProductHit; qtyMm: Mm }
  | { type: 'ADJUST'; key: string; deltaMm: Mm }
  | { type: 'SET_ACTIVE'; key: string }
  | { type: 'REMOVE'; key: string }
  | { type: 'ACCEPT_BUST'; key: string; bust: BustApplied }
  | { type: 'CLEAR' }
  | { type: 'RESTORE'; state: CartState };

const clamp = (v: number, lo: number, hi: number): number => Math.min(Math.max(v, lo), hi);

function removeLine(state: CartState, key: string): CartState {
  const lines = state.lines.filter((l) => l.key !== key);
  const activeKey = state.activeKey === key ? (lines[lines.length - 1]?.key ?? null) : state.activeKey;
  return { lines, activeKey };
}

function adjust(state: CartState, key: string, deltaMm: Mm): CartState {
  const line = state.lines.find((l) => l.key === key);
  if (!line) return state;
  const qtyMm = clamp(line.qtyMm + deltaMm, 0, line.boltRemainingMm);
  if (qtyMm === line.qtyMm) return { ...state, activeKey: key };
  if (qtyMm === 0) return removeLine(state, key);
  // أي تغيير في الكمية يُبطل عرض Bolt-Buster المقبول ويُعاد تقييمه.
  const lines = state.lines.map((l) => (l.key === key ? { ...l, qtyMm, bust: null } : l));
  return { lines, activeKey: key };
}

export function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'ADD': {
      const existing = state.lines.find((l) => l.boltId === action.hit.boltId);
      if (existing) return adjust(state, existing.key, action.qtyMm);
      const qtyMm = clamp(action.qtyMm, 0, action.hit.boltRemainingMm);
      if (qtyMm === 0) return state;
      const { hit } = action;
      const line: CartLine = {
        key: action.key,
        productId: hit.productId,
        boltId: hit.boltId,
        name: hit.name,
        unitPerMeter: hit.unitPerMeter,
        qtyMm,
        boltLengthMm: hit.boltLengthMm,
        boltRemainingMm: hit.boltRemainingMm,
        bust: null,
      };
      return { lines: [...state.lines, line], activeKey: line.key };
    }
    case 'ADJUST':
      return adjust(state, action.key, action.deltaMm);
    case 'SET_ACTIVE':
      return state.lines.some((l) => l.key === action.key) ? { ...state, activeKey: action.key } : state;
    case 'REMOVE':
      return removeLine(state, action.key);
    case 'ACCEPT_BUST':
      return {
        ...state,
        lines: state.lines.map((l) => (l.key === action.key ? { ...l, bust: action.bust } : l)),
      };
    case 'CLEAR':
      return EMPTY_CART;
    case 'RESTORE':
      return action.state;
  }
}

/* ---------- Selectors ---------- */

export const effectiveQtyMm = (l: CartLine): Mm => l.qtyMm + (l.bust?.extraMm ?? 0);
export const remainingAfterSaleMm = (l: CartLine): Mm => l.boltRemainingMm - effectiveQtyMm(l);
export const lineGross = (l: CartLine): bigint => lineTotal(l.unitPerMeter, effectiveQtyMm(l));
export const lineNet = (l: CartLine): bigint => lineGross(l) - (l.bust?.discount ?? 0n);

export function cartTotals(lines: readonly CartLine[]): { gross: bigint; discount: bigint; net: bigint } {
  let gross = 0n;
  let discount = 0n;
  for (const l of lines) {
    gross += lineGross(l);
    discount += l.bust?.discount ?? 0n;
  }
  return { gross, discount, net: gross - discount };
}
