import type { Cm, Qirsh, QirshPerMeter, Id } from './units.js';

export interface CutAllocation {
  boltId: Id;
  boltBarcode: string;
  lengthCm: Cm;
  closesBolt: boolean;       // هل سينهي التوب بالكامل؟
  isRemnantOffer?: boolean;  // هل بيع كعرض إنهاء توب مخفض؟
}

export type CartLineKind = 'FABRIC' | 'ACCESSORY' | 'SERVICE';

export interface CartLineBase {
  lineId: string;            // معرف فريد في سلة الواجهة
  kind: CartLineKind;
  discount: Qirsh;
  note?: string;
}

export interface FabricCartLine extends CartLineBase {
  kind: 'FABRIC';
  productId: Id;
  productName: string;
  dyeLotId: Id;
  lotCode: string;
  requestedCm: Cm;
  unitPrice: QirshPerMeter;
  allocations: CutAllocation[];
  lineTotal: Qirsh;          // المحسوب بالقرش
}

export interface AccessoryCartLine extends CartLineBase {
  kind: 'ACCESSORY';
  accessoryId: Id;
  name: string;
  quantity: number;
  unitPrice: Qirsh;
  lineTotal: Qirsh;
}

export type CartLine = FabricCartLine | AccessoryCartLine;

export type PaymentMethod = 'CASH' | 'CREDIT' | 'PARTIAL';

export interface CartPayment {
  method: PaymentMethod;
  amount: Qirsh;
  dueDate?: string;          // للآجل
  seasonRef?: 'SUGARCANE' | 'WHEAT' | 'FEAST' | 'CUSTOM';
}

export interface Cart {
  id: string;
  customerId?: Id;
  customerName?: string;
  villageName?: string;      // القرية / النجع
  tailorId?: Id;             // كود الترزي الشريك
  bridalPackageId?: Id;      // ربط بجهاز عروسة
  lines: CartLine[];
  payments: CartPayment[];
  subtotal: Qirsh;
  discountTotal: Qirsh;
  grandTotal: Qirsh;
}
