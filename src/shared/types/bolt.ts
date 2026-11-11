import type { Cm, Id } from './units.js';

export type BoltStatus = 
  | 'ACTIVE'        // توب ساري متاح للقص
  | 'REMNANT'       // فضلة / عضمة توب متبقية
  | 'CLOSED'        // منتهي ومصفى بالكامل
  | 'WRITTEN_OFF';  // تالف أو مرتجع للمورد

export interface Bolt {
  id: Id;
  productId: Id;
  dyeLotId: Id;
  barcode: string;           // باركود فريد لكل توب
  initialLengthCm: Cm;       // طول التوب عند الاستلام بالسنتيمتر
  remainingCm: Cm;           // المتبقي الحالي بالسنتيمتر
  status: BoltStatus;
  shelfLocation?: string;    // موقع الرف في المحل (مثلاً: استاند أ - رف 2)
  version: number;           // للـ Optimistic Lock
}

export type MovementKind =
  | 'RECEIVE'       // استلام توب جديد
  | 'CUT_SALE'      // قص بيع عادي
  | 'CUT_TAILOR'    // قص بون ترزي
  | 'CUT_BRIDAL'    // قص جهاز عروسة
  | 'DEFECT_COMP'   // تعويض عيب نسيجي
  | 'ADJUST'        // تسوية جردية
  | 'WASTE'         // هادر طبيعي عند الإغلاق
  | 'RETURN';       // مرتجع رسمي

export interface BoltMovement {
  id: Id;
  boltId: Id;
  kind: MovementKind;
  deltaCm: number;          // سالب للقص والإخراج، موجب للإضافة
  balanceAfterCm: Cm;       // رصيد التوب بعد الحركة مباشرة للتدقيق
  saleLineId?: Id;
  reason?: string;
  createdAt: string;
  createdBy?: Id;
}
