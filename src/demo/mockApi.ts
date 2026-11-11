import { PRODUCTS, CUSTOMERS, TAILORS, type Product, type Customer, type Tailor } from './seed.js';

export interface CartLine {
  productId: string;
  name: string;
  rollId: string;
  meters: number;
  price: number;
}

export interface CheckoutReq {
  lines: CartLine[];
  customerId: string;
  tailorId: string;
  payment: 'cash' | 'credit';
}

export interface Invoice {
  no: string;
  iso: string;
  status: 'ACTIVE' | 'VOID';
  voidedAt?: string;
  date: string;
  lines: CartLine[];
  customer: Customer;
  tailor: Tailor;
  payment: 'cash' | 'credit';
  total: number;
  paid: number;
  remaining: number;
}

const KEY = 'alsawaf-fabric-pos-v1';
const load = () => {
  try {
    return JSON.parse(localStorage.getItem(KEY) || 'null');
  } catch {
    return null;
  }
};

const db: { products: Product[]; customers: Customer[]; seq: number; invoices: Invoice[] } =
  load() ?? {
    products: structuredClone(PRODUCTS),
    customers: structuredClone(CUSTOMERS),
    seq: 1000,
    invoices: []
  };
db.invoices ??= [];

const save = () => localStorage.setItem(KEY, JSON.stringify(db));
const wait = <T>(v: T) => new Promise<T>((r) => setTimeout(() => r(structuredClone(v)), 60));

export const api = {
  products: { list: () => wait(db.products) },
  customers: { list: () => wait(db.customers) },
  tailors: { list: () => wait(TAILORS) },
  bolts: {
    list: () =>
      wait(
        db.products.flatMap((p) =>
          p.rolls.map((r) => ({ id: r.id, productId: p.id, meters: r.meters }))
        )
      )
  },
  invoices: {
    listToday: () => wait(db.invoices),
    async void(no: string) {
      const inv = db.invoices.find((i) => i.no === no);
      if (!inv) throw new Error('الفاتورة غير موجودة');
      if (inv.status === 'VOID') throw new Error('الفاتورة ملغاة بالفعل');

      for (const l of inv.lines) {
        const roll = db.products.find((p) => p.id === l.productId)?.rolls.find((r) => r.id === l.rollId);
        if (roll) roll.meters = Math.round((roll.meters + l.meters) * 100) / 100;
      }
      if (inv.payment === 'credit') {
        const c = db.customers.find((c) => c.id === inv.customer.id);
        if (c) c.balance = Math.max(0, c.balance - inv.remaining);
      }
      inv.status = 'VOID';
      inv.voidedAt = new Date().toLocaleString('ar-EG');
      save();
      window.dispatchEvent(new Event('invoices:changed'));
      return wait({ invoice: inv, cashRefund: inv.payment === 'cash' ? inv.total : 0 });
    }
  },
  reset: () => {
    localStorage.removeItem(KEY);
    location.reload();
  },

  async checkout(req: CheckoutReq): Promise<Invoice> {
    const customer = db.customers.find((c) => c.id === req.customerId)!;
    const total = req.lines.reduce((s, l) => s + l.meters * l.price, 0);

    if (req.payment === 'credit') {
      if (customer.id === 'c0') throw new Error('الآجل غير متاح للعميل النقدي، يرجى اختيار العميل');
      if (customer.balance + total > customer.limit) {
        throw new Error(`تجاوز سقف الائتمان! الحد المسموح: ${customer.limit} ج.م، الرصيد الحالي: ${customer.balance} ج.م`);
      }
    }

    for (const l of req.lines) {
      const prod = db.products.find((p) => p.id === l.productId);
      const roll = prod?.rolls.find((r) => r.id === l.rollId);
      if (!roll) throw new Error(`التوب ${l.rollId} غير متوفر`);
      if (roll.meters < l.meters) throw new Error(`رصيد التوب ${roll.id} غير كافٍ لقص ${l.meters} م`);
      roll.meters = Math.round((roll.meters - l.meters) * 100) / 100;
    }

    if (req.payment === 'credit') customer.balance += total;

    const inv: Invoice = {
      no: String(++db.seq),
      iso: new Date().toISOString(),
      status: 'ACTIVE',
      date: new Date().toLocaleString('ar-EG'),
      lines: req.lines,
      customer,
      tailor: TAILORS.find((t) => t.id === req.tailorId) || TAILORS[0],
      payment: req.payment,
      total,
      paid: req.payment === 'cash' ? total : 0,
      remaining: req.payment === 'credit' ? total : 0
    };

    db.invoices.unshift(structuredClone(inv));
    save();
    window.dispatchEvent(new Event('invoices:changed'));
    return wait(inv);
  }
};

(window as unknown as { api: typeof api }).api = api;
