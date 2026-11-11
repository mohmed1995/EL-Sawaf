import { toQirsh, type Cm, type Qirsh, type QirshPerMeter } from '../../shared/types/units.js';
import { mulDivRoundHalfUp } from '../measure/money.js';
import { DiscountExceedsTotalError, InvalidMeasureError } from '../errors.js';

export interface FabricLinePrice {
  gross: Qirsh;
  net: Qirsh;
}

/**
 * تسعير سطر القماش على إجمالي الأمتار المطلوبة دفعة واحدة
 * لمنع تراكم فروق التقريب عند تعدد الأتواب المقصوصة
 */
export function priceFabricLine(input: {
  requestedCm: Cm;
  unitPrice: QirshPerMeter;
  discount: Qirsh;
}): FabricLinePrice {
  if (input.requestedCm <= 0) {
    throw new InvalidMeasureError('طول القماش المطلوب يجب أن يكون أكبر من الصفر');
  }

  const gross = toQirsh(mulDivRoundHalfUp(Number(input.requestedCm), Number(input.unitPrice), 100));

  if (input.discount < 0) {
    throw new DiscountExceedsTotalError('الخصم لا يمكن أن يكون سالباً');
  }

  if (input.discount > gross) {
    throw new DiscountExceedsTotalError('الخصم لا يمكن أن يتجاوز إجمالي السعر');
  }

  return {
    gross,
    net: toQirsh(gross - input.discount)
  };
}
