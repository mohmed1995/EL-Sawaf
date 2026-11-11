import type { Cm, QirshPerMeter, Id } from './units.js';

export type FabricCategory =
  | 'CURTAIN'     // ستائر وبلاك آوت وشيفون
  | 'BEDDING'     // ملايات وفرش سراير
  | 'BALADI'      // أقمشة جلاليب بلدي وسداري
  | 'ABAYA'       // أقمشة عبايات حريمي
  | 'SUITING'     // بدل وجوخ
  | 'UPHOLSTERY'  // تنجيد وصالونات
  | 'BRIDAL'      // سواريهات وجهاز عروسة
  | 'OTHER';

export interface Product {
  id: Id;
  sku: string;                    // كود الصنف
  nameAr: string;                 // اسم القماش بالعربي
  category: FabricCategory;
  fabricWidthCm: Cm;              // عرض القماش (مثلاً 140، 150، أو 240 للملايات)
  pricePerMeter: QirshPerMeter;   // سعر المتر بالقرش
  minSaleCm: Cm;                  // أقل طول يمكن قصه (مثلاً 25 سم)
  remnantThresholdCm: Cm;         // عتبة الهادر (أقل منها يعتبر فضلة/عضمة توب)
  isActive: boolean;
}

export interface DyeLot {
  id: Id;
  productId: Id;
  lotCode: string;                // رقم تشغيلة الصباغة
  receivedAt: string;             // تاريخ الاستلام ISO
}
