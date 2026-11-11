import type { Mm } from './cashier-types';

export type BoltLevel = 'healthy' | 'low' | 'critical';

/** أقل من 10% من طول التوب = حرج (برتقالي)، أقل من 30% = منخفض (أصفر). مقارنة صحيحة بدون كسور عشرية. */
export function boltLevel(remainingAfterSaleMm: Mm, boltLengthMm: Mm): BoltLevel {
  if (boltLengthMm <= 0) return 'critical';
  const scaled = remainingAfterSaleMm * 100;
  if (scaled < boltLengthMm * 10) return 'critical';
  if (scaled < boltLengthMm * 30) return 'low';
  return 'healthy';
}
