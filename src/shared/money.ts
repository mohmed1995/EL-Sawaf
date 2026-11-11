import type { Mm, Piasters } from './cashier-types';

const MM_PER_METER = 1000n;

/** (a × b) ÷ d بتقريب نصف لأعلى لأعداد غير سالبة. استبدل الجسم بتفويض إلى core/pricing عند الربط. */
export function mulDivRound(a: bigint, b: bigint, d: bigint): bigint {
  return (a * b + d / 2n) / d;
}

export function lineTotal(unitPerMeter: Piasters, qtyMm: Mm): Piasters {
  return mulDivRound(unitPerMeter, BigInt(qtyMm), MM_PER_METER);
}
