/**
 * افتراض: invoices(id, customer_id, payment_method, total_piasters, created_at)
 *         invoice_lines(invoice_id, product_id, bolt_id, qty_mm, bust_extra_mm, discount_piasters, unit_per_meter, line_total)
 *         debt_ledger(customer_id, amount_piasters, reason, invoice_id) — Append-Only
 */
import type {
  BoltBusterOffer,
  CheckoutErrorCode,
  CheckoutRequest,
  CheckoutResult,
  EvaluateInput,
} from '../../shared/cashier-types';
import type { Db } from '../db';
import type { BoltBusterPort, PricingPort } from '../ports';
import type { BoltRepo } from '../repos/bolt.repo';
import type { CustomerRepo } from '../repos/customer.repo';
import type { ProductRepo } from '../repos/product.repo';

class CheckoutError extends Error {
  constructor(
    readonly code: CheckoutErrorCode,
    message: string,
  ) {
    super(message);
  }
}

export class CheckoutService {
  private readonly insertInvoice;
  private readonly insertLine;
  private readonly insertDebt;

  constructor(
    private readonly db: Db,
    private readonly products: ProductRepo,
    private readonly bolts: BoltRepo,
    private readonly customers: CustomerRepo,
    private readonly pricing: PricingPort,
    private readonly boltBuster: BoltBusterPort,
  ) {
    this.insertInvoice = db.prepare(
      'INSERT INTO invoices (customer_id, payment_method, total_piasters) VALUES (@customerId, @method, @total)',
    );
    this.insertLine = db.prepare(`
      INSERT INTO invoice_lines (invoice_id, product_id, bolt_id, qty_mm, bust_extra_mm, discount_piasters, unit_per_meter, line_total)
      VALUES (@invoiceId, @productId, @boltId, @qtyMm, @extraMm, @discount, @unit, @lineTotal)`);
    this.insertDebt = db.prepare(
      "INSERT INTO debt_ledger (customer_id, amount_piasters, reason, invoice_id) VALUES (@customerId, @amount, 'invoice', @invoiceId)",
    );
  }

  /** عروض Bolt-Buster للسلة الحالية (قراءة فقط). */
  evaluateOffers(inputs: readonly EvaluateInput[]): BoltBusterOffer[] {
    const offers: BoltBusterOffer[] = [];
    for (const input of inputs) {
      const bolt = this.bolts.get(input.boltId);
      const unit = this.products.unitPrice(input.productId);
      if (!bolt || bolt.status !== 'open' || bolt.productId !== input.productId || unit === null) continue;
      const result = this.boltBuster.evaluate({ remainingMm: bolt.remainingMm, requestedMm: input.qtyMm, unitPerMeter: unit });
      if (result) offers.push({ lineKey: input.lineKey, extraMm: result.extraMm, discount: result.discount });
    }
    return offers;
  }

  checkout(request: CheckoutRequest): CheckoutResult {
    try {
      // IMMEDIATE: نحجز قفل الكتابة من البداية فلا يحدث بيع مزدوج لنفس التوب.
      const tx = this.db.transaction(() => this.run(request)) as any;
      return typeof tx.immediate === 'function' ? tx.immediate() : tx();
    } catch (error) {
      if (error instanceof CheckoutError) return { ok: false, code: error.code, message: error.message };
      console.error('[checkout] unexpected failure', error);
      return { ok: false, code: 'INTERNAL', message: 'حدث خطأ غير متوقع. لم يتم حفظ الفاتورة.' };
    }
  }

  private run(request: CheckoutRequest): CheckoutResult {
    if (request.lines.length === 0) throw new CheckoutError('EMPTY_CART', 'السلة فارغة.');
    if (request.method === 'credit') {
      if (request.customerId === null) throw new CheckoutError('CUSTOMER_REQUIRED', 'الفاتورة الآجل تحتاج عميلاً.');
    }
    if (request.customerId !== null && !this.customers.exists(request.customerId)) {
      throw new CheckoutError('INVALID_REQUEST', 'العميل غير موجود.');
    }

    // 1) تسعير سيرفر-سايد والتحقق من الأرصدة (السعر والخصم لا يُؤخذان من الواجهة أبداً).
    const consumed = new Map<number, number>();
    const priced = request.lines.map((line) => {
      const bolt = this.bolts.get(line.boltId);
      const unit = this.products.unitPrice(line.productId);
      if (!bolt || bolt.productId !== line.productId || unit === null) {
        throw new CheckoutError('INVALID_REQUEST', 'بيانات الصنف أو التوب غير صحيحة.');
      }
      let extraMm = 0;
      let discount = 0n;
      if (line.acceptBust) {
        const offer = this.boltBuster.evaluate({ remainingMm: bolt.remainingMm, requestedMm: line.qtyMm, unitPerMeter: unit });
        if (!offer) throw new CheckoutError('OFFER_EXPIRED', 'عرض إنهاء التوب لم يعد متاحاً، راجع السلة.');
        extraMm = offer.extraMm;
        discount = offer.discount;
      }
      const effectiveMm = line.qtyMm + extraMm;
      const already = consumed.get(bolt.id) ?? 0;
      if (bolt.remainingMm - already < effectiveMm) {
        throw new CheckoutError('INSUFFICIENT_BOLT', 'رصيد التوب لا يكفي الكمية المطلوبة.');
      }
      consumed.set(bolt.id, already + effectiveMm);
      const lineTotal = this.pricing.lineTotal(unit, effectiveMm) - discount;
      return { line, unit, extraMm, discount, effectiveMm, lineTotal };
    });

    const total = priced.reduce((sum, p) => sum + p.lineTotal, 0n);

    // 2) الكتابة: فاتورة ← سطورها ← حركات سجل الأتواب ← الدين (إن كان آجل).
    const invoiceId = Number(
      this.insertInvoice.run({ customerId: request.customerId, method: request.method, total }).lastInsertRowid,
    );
    for (const p of priced) {
      this.insertLine.run({
        invoiceId,
        productId: p.line.productId,
        boltId: p.line.boltId,
        qtyMm: p.line.qtyMm,
        extraMm: p.extraMm,
        discount: p.discount,
        unit: p.unit,
        lineTotal: p.lineTotal,
      });
      this.bolts.append({ boltId: p.line.boltId, deltaMm: -p.effectiveMm, reason: 'sale', invoiceId });
    }
    for (const boltId of consumed.keys()) this.bolts.finishIfEmpty(boltId);
    if (request.method === 'credit' && request.customerId !== null) {
      this.insertDebt.run({ customerId: request.customerId, amount: total, invoiceId });
    }
    return { ok: true, invoiceId, total };
  }
}
