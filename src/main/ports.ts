import type { Mm, Piasters } from '../shared/cashier-types';

/** حدود الاعتماد على النواة: كل ما يخص core/* يمر من هنا فقط. */
export interface PricingPort {
  lineTotal(unitPerMeter: Piasters, qtyMm: Mm): Piasters;
}

export interface BoltBusterInput {
  readonly remainingMm: Mm;
  readonly requestedMm: Mm;
  readonly unitPerMeter: Piasters;
}

export interface BoltBusterResult {
  readonly extraMm: Mm;
  readonly discount: Piasters;
}

export interface BoltBusterPort {
  /** يرجع null إذا لا يوجد عرض لإنهاء التوب. */
  evaluate(input: BoltBusterInput): BoltBusterResult | null;
}
