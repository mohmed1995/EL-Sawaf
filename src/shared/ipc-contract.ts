/**
 * عقد IPC: المصدر الوحيد لأسماء القنوات وأنواع الطلب/الرد.
 * - الواجهة (renderer) و preload و main كلهم يستوردون من هنا.
 * - أي قناة جديدة تُضاف في IpcInvokeMap + IPC_CHANNELS معاً (TypeScript يفرض ذلك).
 * - لا منطق هنا: أنواع وثوابت فقط.
 */
import type { Cm, Id, Qirsh, QirshPerMeter } from './types/units.js';
import type { CartPayment, CutAllocation } from './types/cart.js';
import type { FabricCategory } from './types/product.js';

/* ───────────────────────── النتيجة والأخطاء ───────────────────────── */

export type IpcErrorCode =
  | 'VALIDATION'
  | 'INSUFFICIENT_LENGTH'
  | 'LOT_MISMATCH'
  | 'DISCOUNT_EXCEEDS_TOTAL'
  | 'CREDIT_LIMIT'
  | 'STALE_BOLT'
  | 'DUPLICATE_SALE'
  | 'DB_BUSY'
  | 'INTERNAL';

export interface IpcError {
  readonly code: IpcErrorCode;
  readonly message: string;
  readonly details?: unknown;
}

/** لا نرمي استثناءات عبر IPC أبداً: كل رد إما data أو error. */
export type IpcResult<T> =
  | { readonly ok: true; readonly data: T }
  | { readonly ok: false; readonly error: IpcError };

/* ───────────────────────── DTOs ───────────────────────── */

export interface ProductHit {
  readonly id: Id;
  readonly sku: string;
  readonly nameAr: string;
  readonly category: FabricCategory;
  readonly pricePerMeter: QirshPerMeter;
  readonly minSaleCm: Cm;
  readonly totalRemainingCm: Cm;
}

export interface LotAvailability {
  readonly dyeLotId: Id;
  readonly lotCode: string;
  readonly totalRemainingCm: Cm;
  readonly boltCount: number;
}

export type PartyKind = 'CUSTOMER' | 'TAILOR' | 'BRIDAL_LEDGER';

export interface PartySummary {
  readonly id: Id;
  readonly name: string;
  readonly phone?: string;
  /** المديونية الحالية (موجب = عليه) */
  readonly balance?: Qirsh;
  readonly subtitle?: string;
}

export interface CutQuoteRequest {
  readonly productId: Id;
  readonly dyeLotId: Id;
  readonly requestedCm: Cm;
}

/** نتيجة خوارزمية Bolt-Buster التي تحتاج قرار الكاشير */
export type BoltBusterAdvice =
  | {
      readonly kind: 'REMNANT_LEFT';
      readonly boltId: Id;
      readonly barcode: string;
      /** ما سيتبقى في التوب لو نفّذنا الطلب كما هو */
      readonly remnantAfterCm: Cm;
      /** الطول الذي يُنهي التوب كاملاً = الطلب + الباقي */
      readonly finishRequestedCm: Cm;
      /** الفرق في السعر لو باع التوب كله */
      readonly finishExtraPrice: Qirsh;
    }
  | { readonly kind: 'SPLIT_ACROSS_BOLTS'; readonly boltCount: number };

export interface CutQuote {
  readonly unitPrice: QirshPerMeter;
  readonly allocations: readonly CutAllocation[];
  readonly gross: Qirsh;
  readonly advice: BoltBusterAdvice | null;
}

export interface CheckoutLineInput {
  readonly lineId: string;
  readonly productId: Id;
  readonly dyeLotId: Id;
  readonly requestedCm: Cm;
  readonly discount: Qirsh;
  readonly allocations: readonly CutAllocation[];
}

export interface CheckoutRequest {
  /** مفتاح Idempotency = cartId. إعادة الإرسال بعد انقطاع لا تُنشئ فاتورة مكررة. */
  readonly saleKey: string;
  readonly customerId?: Id;
  readonly tailorId?: Id;
  readonly bridalLedgerId?: Id;
  readonly lines: readonly CheckoutLineInput[];
  readonly cartDiscount: Qirsh;
  readonly payments: readonly CartPayment[];
  readonly cashTendered?: Qirsh;
}

export interface CheckoutReceipt {
  readonly saleId: Id;
  readonly invoiceNo: string;
  readonly subtotal: Qirsh;
  readonly discountTotal: Qirsh;
  readonly grandTotal: Qirsh;
  readonly changeDue: Qirsh;
  readonly openDrawer: boolean;
  readonly closedBoltIds: readonly Id[];
  readonly replayed: boolean;
}

export interface CreditSeasonOption {
  readonly code: 'SUGARCANE' | 'WHEAT' | 'FEAST' | 'CUSTOM';
  readonly labelAr: string;
  readonly suggestedDueDate: string; // YYYY-MM-DD
}

export interface HeldCartSummary {
  readonly cartKey: string;
  readonly label: string;
  readonly createdAt: string;
  readonly linesCount: number;
  readonly total: Qirsh;
}

export interface BackupStatus {
  readonly state: 'OK' | 'WARN' | 'FAILED';
  readonly lastOkAt?: string;
  readonly message?: string;
}

/* ───────────────────────── خريطة القنوات ───────────────────────── */

export interface IpcInvokeMap {
  'pos:search-products': { req: { query: string; limit: number }; res: readonly ProductHit[] };
  'pos:list-lots': { req: { productId: Id }; res: readonly LotAvailability[] };
  'pos:quote-cut': { req: CutQuoteRequest; res: CutQuote };
  'pos:checkout': { req: CheckoutRequest; res: CheckoutReceipt };
  'pos:search-parties': { req: { kind: PartyKind; query: string }; res: readonly PartySummary[] };
  'pos:hold-cart': { req: { cartKey: string; label: string; payload: string; linesCount: number; total: Qirsh }; res: null };
  'pos:list-held-carts': { req: undefined; res: readonly HeldCartSummary[] };
  'pos:resume-cart': { req: { cartKey: string }; res: { payload: string } };
  'credit:list-seasons': { req: undefined; res: readonly CreditSeasonOption[] };
}

export type IpcChannel = keyof IpcInvokeMap;
export type IpcRequest<C extends IpcChannel> = IpcInvokeMap[C]['req'];
export type IpcResponse<C extends IpcChannel> = IpcInvokeMap[C]['res'];

export const IPC_CHANNELS = {
  'pos:search-products': true,
  'pos:list-lots': true,
  'pos:quote-cut': true,
  'pos:checkout': true,
  'pos:search-parties': true,
  'pos:hold-cart': true,
  'pos:list-held-carts': true,
  'pos:resume-cart': true,
  'credit:list-seasons': true,
} as const satisfies Record<IpcChannel, true>;

/* ───────────────────────── أحداث main → renderer ───────────────────────── */

export interface IpcEventMap {
  'system:backup-status': BackupStatus;
}
export type IpcEventName = keyof IpcEventMap;

export const IPC_EVENTS = {
  'system:backup-status': true,
} as const satisfies Record<IpcEventName, true>;

/* ───────────────────────── واجهة window.api ───────────────────────── */

export interface AlsawafApi {
  invoke<C extends IpcChannel>(channel: C, req: IpcRequest<C>): Promise<IpcResult<IpcResponse<C>>>;
  on<E extends IpcEventName>(event: E, listener: (payload: IpcEventMap[E]) => void): () => void;
}

declare global {
  interface Window {
    readonly api: AlsawafApi;
  }
}
