import type { Cart, CartLine, FabricCartLine } from '../shared/types/cart.js';
import { toCm, toQirsh, toQirshPerMeter, type Cm, type Qirsh } from '../shared/types/units.js';
import { formatCmToMeters, parseQuantityInput } from '../core/measure/units.js';
import { calculateLineTotal, formatQirshToPounds } from '../core/measure/money.js';
import { suggestBoltCut, type BoltBusterSuggestion } from '../core/bolt-buster/suggest-cut.js';
import { soundEngine } from './audio/sound-engine.js';
import type { Bolt } from '../shared/types/bolt.js';

export interface PosState {
  cart: Cart;
  activeBoltBuster: BoltBusterSuggestion['remnantUpsell'] | null;
  heldCartsCount: number;
  lastInvoiceNo: string | null;
}

/**
 * مدير حالة شاشة الكاشير السريعة — يربط لوحة المفاتيح والقصات بالأصوات الحية
 */
export class PosController {
  private state: PosState;
  private listeners: Array<(state: PosState) => void> = [];

  constructor() {
    this.state = {
      cart: this.createEmptyCart(),
      activeBoltBuster: null,
      heldCartsCount: 0,
      lastInvoiceNo: null
    };
  }

  public subscribe(cb: (state: PosState) => void): () => void {
    this.listeners.push(cb);
    cb(this.state);
    return () => {
      this.listeners = this.listeners.filter(l => l !== cb);
    };
  }

  private notify(): void {
    for (const cb of this.listeners) cb(this.state);
  }

  public createEmptyCart(): Cart {
    return {
      id: `cart-${Date.now()}`,
      lines: [],
      payments: [],
      subtotal: toQirsh(0),
      discountTotal: toQirsh(0),
      grandTotal: toQirsh(0)
    };
  }

  /**
   * إضافة قصة قماش إلى السلة مع الفحص التلقائي لإنهاء التوب وتشغيل صوت المقص
   */
  public addFabricCut(
    product: { id: number; name: string; pricePerMeterQirsh: number },
    candidateBolts: Bolt[],
    quantityStr: string,
    allowSplit: boolean = false
  ): void {
    try {
      const requestedCm = parseQuantityInput(quantityStr);
      const suggestion = suggestBoltCut(requestedCm, candidateBolts, toCm(150), allowSplit);

      if (!suggestion.canFulfill) {
        soundEngine.play('barcode_error');
        alert(suggestion.warning || 'لا يمكن استيفاء الكمية المطلوبة');
        return;
      }

      // إذا اكتشفت الخوارزمية فضلة حرجة، تشغيل تنبيه الـ Bolt-Buster
      if (suggestion.remnantUpsell) {
        soundEngine.play('bolt_warning');
        this.state.activeBoltBuster = suggestion.remnantUpsell;
      } else {
        soundEngine.play('cut_approved');
        this.state.activeBoltBuster = null;
      }

      const lineTotal = calculateLineTotal(requestedCm, toQirshPerMeter(product.pricePerMeterQirsh));

      const newLine: FabricCartLine = {
        lineId: `line-${Date.now()}`,
        kind: 'FABRIC',
        productId: product.id,
        productName: product.name,
        dyeLotId: candidateBolts[0].dyeLotId,
        lotCode: 'LOT-CURRENT',
        requestedCm,
        unitPrice: toQirshPerMeter(product.pricePerMeterQirsh),
        allocations: suggestion.allocations,
        lineTotal,
        discount: toQirsh(0)
      };

      this.state.cart.lines.push(newLine);
      this.recalculateTotals();
      this.notify();
    } catch (err: unknown) {
      soundEngine.play('barcode_error');
      const message = err instanceof Error ? err.message : String(err);
      alert(`خطأ: ${message}`);
    }
  }

  /**
   * تطبيق عرض إنهاء التوب (تصفية الفضلة بخصم 45%)
   */
  public acceptBoltBusterOffer(): void {
    if (!this.state.activeBoltBuster) return;
    const upsell = this.state.activeBoltBuster;
    const lastLine = this.state.cart.lines[this.state.cart.lines.length - 1];

    if (lastLine && lastLine.kind === 'FABRIC') {
      const fabricLine = lastLine as FabricCartLine;
      const newTotalCm = toCm(Number(fabricLine.requestedCm) + Number(upsell.extraLengthCm));
      fabricLine.requestedCm = newTotalCm;

      // تحديث التوزيع لإنهاء التوب
      if (fabricLine.allocations[0]) {
        fabricLine.allocations[0].lengthCm = newTotalCm;
        fabricLine.allocations[0].closesBolt = true;
        fabricLine.allocations[0].isRemnantOffer = true;
      }

      // حساب الخصم التشجيعي
      const extraGross = calculateLineTotal(upsell.extraLengthCm, fabricLine.unitPrice);
      const discount = toQirsh(Math.round(Number(extraGross) * (upsell.discountPercent / 100)));
      fabricLine.discount = discount;
      fabricLine.lineTotal = toQirsh(Number(calculateLineTotal(newTotalCm, fabricLine.unitPrice)) - Number(discount));

      soundEngine.play('cut_approved');
      this.state.activeBoltBuster = null;
      this.recalculateTotals();
      this.notify();
    }
  }

  /**
   * الدفع النقدي الفوري F12 (تشغيل صوت درج الخزنة وتصفير السلة)
   */
  public payCash(): void {
    if (this.state.cart.lines.length === 0) {
      soundEngine.play('barcode_error');
      return;
    }

    soundEngine.play('cash_drawer');
    const invoiceNo = `SWF-${Date.now().toString().slice(-6)}`;
    this.state.lastInvoiceNo = invoiceNo;
    this.state.cart = this.createEmptyCart();
    this.state.activeBoltBuster = null;
    this.notify();
  }

  /**
   * الدفع الآجل F9 (تشغيل صوت ختم الدفتر الوقور)
   */
  public payCredit(customerId: number, season: 'SUGARCANE' | 'WHEAT' = 'SUGARCANE'): void {
    if (this.state.cart.lines.length === 0) {
      soundEngine.play('barcode_error');
      return;
    }

    soundEngine.play('credit_stamp');
    this.state.cart.customerId = customerId;
    this.state.cart.payments = [{
      method: 'CREDIT',
      amount: this.state.cart.grandTotal,
      seasonRef: season
    }];

    const invoiceNo = `SWF-CR-${Date.now().toString().slice(-6)}`;
    this.state.lastInvoiceNo = invoiceNo;
    this.state.cart = this.createEmptyCart();
    this.state.activeBoltBuster = null;
    this.notify();
  }

  /**
   * تجميد الفاتورة F4 (للزبون المستعجل)
   */
  public holdCart(): void {
    if (this.state.cart.lines.length === 0) return;
    this.state.heldCartsCount += 1;
    this.state.cart = this.createEmptyCart();
    this.state.activeBoltBuster = null;
    soundEngine.play('welcome');
    this.notify();
  }

  private recalculateTotals(): void {
    let subtotal = 0;
    let discountTotal = 0;

    for (const line of this.state.cart.lines) {
      subtotal += Number(line.lineTotal) + Number(line.discount);
      discountTotal += Number(line.discount);
    }

    this.state.cart.subtotal = toQirsh(subtotal);
    this.state.cart.discountTotal = toQirsh(discountTotal);
    this.state.cart.grandTotal = toQirsh(subtotal - discountTotal);
  }
}
