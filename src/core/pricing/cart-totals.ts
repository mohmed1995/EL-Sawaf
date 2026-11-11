import { toQirsh, type Qirsh } from '../../shared/types/units.js';
import { allocateByWeights } from '../measure/money.js';
import { DiscountExceedsTotalError } from '../errors.js';

export interface PricedLine {
  gross: Qirsh;
  lineDiscount: Qirsh;
}

export interface CartTotals {
  subtotal: Qirsh;
  discountTotal: Qirsh;
  grandTotal: Qirsh;
  /** نصيب كل سطر من خصم الفاتورة الإجمالي (مفيد للمرتجعات) */
  cartDiscountShare: Qirsh[];
}

/**
 * حساب إجماليات السلة وتوزيع خصم الفاتورة العام على البنود بأكبر باقي
 */
export function computeCartTotals(
  lines: readonly PricedLine[],
  cartDiscount: Qirsh = toQirsh(0)
): CartTotals {
  const subtotal = lines.reduce((s, l) => s + Number(l.gross), 0);
  const lineDisc = lines.reduce((s, l) => s + Number(l.lineDiscount), 0);
  const net = subtotal - lineDisc;

  const discountNum = Number(cartDiscount);
  if (discountNum < 0 || discountNum > net) {
    throw new DiscountExceedsTotalError('خصم الفاتورة لا يمكن أن يتجاوز الصافي');
  }

  const nets = lines.map((l) => Number(l.gross) - Number(l.lineDiscount));
  const share = discountNum === 0 || net === 0
    ? lines.map(() => toQirsh(0))
    : allocateByWeights(cartDiscount, nets);

  return {
    subtotal: toQirsh(subtotal),
    discountTotal: toQirsh(lineDisc + discountNum),
    grandTotal: toQirsh(net - discountNum),
    cartDiscountShare: share,
  };
}
