/** أنواع مشتركة بين الـ Main والـ Renderer. المقاسات بالمليمتر (أعداد صحيحة) والمال بالقرش (BigInt). */
export type Mm = number;
export type Piasters = bigint;
export type PaymentMethod = 'cash' | 'credit';

export interface ProductHit {
  readonly productId: number;
  readonly name: string;
  readonly unitPerMeter: Piasters;
  readonly boltId: number;
  readonly boltLengthMm: Mm;
  readonly boltRemainingMm: Mm;
}

export interface CustomerHit {
  readonly id: number;
  readonly name: string;
  readonly phone: string | null;
}

/** عرض Bolt-Buster بعد قبوله: متر إضافي من باقي التوب وخصم على السطر. */
export interface BustApplied {
  readonly extraMm: Mm;
  readonly discount: Piasters;
}

export interface CartLine {
  readonly key: string;
  readonly productId: number;
  readonly boltId: number;
  readonly name: string;
  readonly unitPerMeter: Piasters;
  readonly qtyMm: Mm;
  readonly boltLengthMm: Mm;
  readonly boltRemainingMm: Mm;
  readonly bust: BustApplied | null;
}

export interface BoltBusterOffer {
  readonly lineKey: string;
  readonly extraMm: Mm;
  readonly discount: Piasters;
}

export interface EvaluateInput {
  readonly lineKey: string;
  readonly productId: number;
  readonly boltId: number;
  readonly qtyMm: Mm;
}

export interface CheckoutLineInput {
  readonly productId: number;
  readonly boltId: number;
  /** الكمية المطلوبة الأصلية، والسيرفر يعيد حساب عرض Bolt-Buster بنفسه. */
  readonly qtyMm: Mm;
  readonly acceptBust: boolean;
}

export interface CheckoutRequest {
  readonly lines: readonly CheckoutLineInput[];
  readonly customerId: number | null;
  readonly method: PaymentMethod;
}

export type CheckoutErrorCode =
  | 'EMPTY_CART'
  | 'CUSTOMER_REQUIRED'
  | 'INSUFFICIENT_BOLT'
  | 'OFFER_EXPIRED'
  | 'INVALID_REQUEST'
  | 'INTERNAL';

export type CheckoutResult =
  | { readonly ok: true; readonly invoiceId: number; readonly total: Piasters }
  | { readonly ok: false; readonly code: CheckoutErrorCode; readonly message: string };

export interface CashierApi {
  searchProducts(query: string): Promise<ProductHit[]>;
  searchCustomers(query: string): Promise<CustomerHit[]>;
  evaluateBolt(lines: readonly EvaluateInput[]): Promise<BoltBusterOffer[]>;
  checkout(request: CheckoutRequest): Promise<CheckoutResult>;
}

/** الأحداث الصوتية: اربطها بالمؤثرات الثمانية في محرك Web Audio. */
export type SfxEvent = 'add' | 'adjust' | 'remove' | 'bust' | 'accept' | 'hold' | 'checkout' | 'error';
