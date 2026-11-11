import type { Bolt } from '../../shared/types/bolt.js';
import { toCm, type Cm } from '../../shared/types/units.js';
import type { CutAllocation } from '../../shared/types/cart.js';

export interface BoltBusterSuggestion {
  allocations: CutAllocation[];
  canFulfill: boolean;
  wasteCm: Cm;
  remnantUpsell?: {
    boltId: number;
    extraLengthCm: Cm;
    discountPercent: number;
    message: string;
  };
  warning?: string;
}

/**
 * خوارزمية Bolt-Buster لتوزيع القص الذكي وتصفية بواقي الأتواب
 * مع حماية لوت الصباغة التامة (Dye-Lot Protection)
 */
export function suggestBoltCut(
  requestedCm: Cm,
  candidateBolts: Bolt[],
  remnantThresholdCm: Cm = toCm(150),
  allowSplitCut: boolean = false
): BoltBusterSuggestion {
  if (candidateBolts.length === 0) {
    return {
      allocations: [],
      canFulfill: false,
      wasteCm: toCm(0),
      warning: 'لا توجد أتواب متاحة من هذا الصنف'
    };
  }

  // التحقق من وحدة لوت الصباغة للأتواب المرشحة
  const firstDyeLot = candidateBolts[0].dyeLotId;
  const sameLotBolts = candidateBolts.filter(b => b.dyeLotId === firstDyeLot);

  // تصفية الأتواب النشطة وترتيبها من الأصغر للأكبر لإنهاء الأتواب القديمة
  const activeBolts = sameLotBolts
    .filter(b => (b.status === 'ACTIVE' || b.status === 'REMNANT') && b.remainingCm > 0)
    .sort((a, b) => a.remainingCm - b.remainingCm);

  if (activeBolts.length === 0) {
    return {
      allocations: [],
      canFulfill: false,
      wasteCm: toCm(0),
      warning: 'لا توجد أتواب نشطة في هذا اللوت'
    };
  }

  // 1. البحث عن توب مفرد يغطي كامل المطلوب (الأولوية القصوى لمنع الوصلات)
  for (const bolt of activeBolts) {
    if (bolt.remainingCm >= requestedCm) {
      const remainingAfterCut = bolt.remainingCm - requestedCm;

      // أ. التوب ينتهي بالضبط (0 سم)
      if (remainingAfterCut === 0) {
        return {
          allocations: [{
            boltId: bolt.id,
            boltBarcode: bolt.barcode,
            lengthCm: requestedCm,
            closesBolt: true
          }],
          canFulfill: true,
          wasteCm: toCm(0)
        };
      }

      // ب. المتبقي فضلة حرجة (أقل من حد الهادر) -> عرض إنهاء التوب
      if (remainingAfterCut < remnantThresholdCm) {
        return {
          allocations: [{
            boltId: bolt.id,
            boltBarcode: bolt.barcode,
            lengthCm: requestedCm,
            closesBolt: false
          }],
          canFulfill: true,
          wasteCm: toCm(remainingAfterCut),
          remnantUpsell: {
            boltId: bolt.id,
            extraLengthCm: toCm(remainingAfterCut),
            discountPercent: 45,
            message: `متبقي في التوب ${remainingAfterCut} سم فقط (فضلة). اعرضها على الزبون بخصم 45% لإنهاء التوب.`
          }
        };
      }

      // ج. المتبقي كافٍ للاستمرار
      return {
        allocations: [{
          boltId: bolt.id,
          boltBarcode: bolt.barcode,
          lengthCm: requestedCm,
          closesBolt: false
        }],
        canFulfill: true,
        wasteCm: toCm(0)
      };
    }
  }

  // 2. إذا لم يكفِ أي توب مفرد، هل مسموح بالقص الموصول؟
  if (!allowSplitCut) {
    const maxSingle = Math.max(...activeBolts.map(b => b.remainingCm));
    return {
      allocations: [],
      canFulfill: false,
      wasteCm: toCm(0),
      warning: `أكبر توب متاح في هذا اللوت به (${maxSingle} سم) فقط. لا يمكن القص من توبين إلا بعد تفعيل خيار (القص الموصول).`
    };
  }

  // 3. التجميع من عدة أتواب من نفس اللوت
  const totalAvailable = activeBolts.reduce((sum, b) => sum + b.remainingCm, 0);
  if (totalAvailable < requestedCm) {
    return {
      allocations: [],
      canFulfill: false,
      wasteCm: toCm(0),
      warning: `إجمالي الرصيد في اللوت (${totalAvailable} سم) غير كافٍ للكمية المطلوبة (${requestedCm} سم)`
    };
  }

  let accumulated = 0;
  const allocations: CutAllocation[] = [];

  for (const bolt of activeBolts) {
    if (accumulated >= requestedCm) break;
    const needed = requestedCm - accumulated;
    const cutAmount = Math.min(bolt.remainingCm, needed);

    allocations.push({
      boltId: bolt.id,
      boltBarcode: bolt.barcode,
      lengthCm: toCm(cutAmount),
      closesBolt: cutAmount === bolt.remainingCm
    });

    accumulated += cutAmount;
  }

  return {
    allocations,
    canFulfill: true,
    wasteCm: toCm(0),
    warning: 'تنبيه: سيتم القص من أكثر من توب (وصلة قماش)، يرجى التأكد من موافقة الزبون والترزي.'
  };
}
