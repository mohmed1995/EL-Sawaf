/**
 * منظومة الصواف للأقمشة — الوحدات الحسابية الصارمة (Branded Types)
 * القاعدة الذهبية: لا أرقام عشرية نهائياً.
 * الأمتار تخزن بالسنتيمتر (1 متر = 100 سم)
 * الأموال تخزن بالقرش (1 جنيه = 100 قرش)
 */

declare const brand: unique symbol;
export type Brand<T, B> = T & { readonly [brand]: B };

/** سنتيمتر صحيح (INTEGER) */
export type Cm = Brand<number, 'Cm'>;

/** قرش مصري صحيح (INTEGER) */
export type Qirsh = Brand<number, 'Qirsh'>;

/** سعر المتر بالقرش (INTEGER) */
export type QirshPerMeter = Brand<number, 'QirshPerMeter'>;

export type Id = number;

/** تحويل والتحقق من أن القيمة سنتيمتر صحيح */
export const toCm = (n: number): Cm => {
  if (!Number.isSafeInteger(n) || n < 0) {
    throw new RangeError(`قيمة السنتيمتر يجب أن تكون رقماً صحيحاً غير سالب: ${n}`);
  }
  return n as Cm;
};

/** تحويل والتحقق من أن القيمة قرش صحيح */
export const toQirsh = (n: number): Qirsh => {
  if (!Number.isSafeInteger(n) || n < 0) {
    throw new RangeError(`قيمة القرش يجب أن تكون رقماً صحيحاً غير سالب: ${n}`);
  }
  return n as Qirsh;
};

/** تحويل سعر المتر بالقرش */
export const toQirshPerMeter = (n: number): QirshPerMeter => {
  if (!Number.isSafeInteger(n) || n < 0) {
    throw new RangeError(`سعر المتر يجب أن يكون رقماً صحيحاً غير سالب: ${n}`);
  }
  return n as QirshPerMeter;
};
