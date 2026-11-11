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
  products: {
    list: () => wait(db.products),
    async create(p: Omit<Product, 'id'>) {
      const id = 'p' + (db.products.length + 1);
      const newProd: Product = { ...p, id };
      db.products.push(newProd);
      save();
      return wait(newProd);
    },
    async addRoll(productId: string, meters: number, dyeLot = 'صبغة قياسية') {
      const prod = db.products.find((p) => p.id === productId);
      if (!prod) throw new Error('الصنف غير موجود');
      const nextNum = Math.floor(Math.random() * 800) + 100;
      const rollId = `T-${nextNum}`;
      prod.rolls.push({ id: rollId, meters, dyeLot });
      save();
      return wait(prod);
    },
    async updateStock(productId: string, rollId: string, newMeters: number) {
      const prod = db.products.find((p) => p.id === productId);
      const roll = prod?.rolls.find((r) => r.id === rollId);
      if (!roll) throw new Error('التوب غير موجود');
      roll.meters = Math.max(0, Math.round(newMeters * 100) / 100);
      save();
      return wait(roll);
    }
  },
  customers: {
    list: () => wait(db.customers),
    async create(c: Omit<Customer, 'id' | 'balance'>) {
      const id = 'c' + (db.customers.length + 1);
      const newCust: Customer = { ...c, id, balance: 0 };
      db.customers.push(newCust);
      save();
      return wait(newCust);
    },
    async recordPayment(customerId: string, amount: number) {
      const cust = db.customers.find((c) => c.id === customerId);
      if (!cust) throw new Error('العميل غير موجود');
      if (amount <= 0) throw new Error('المبلغ يجب أن يكون أكبر من صفر');
      cust.balance = Math.max(0, Math.round((cust.balance - amount) * 100) / 100);
      save();
      return wait(cust);
    },
    async updateLimit(customerId: string, newLimit: number) {
      const cust = db.customers.find((c) => c.id === customerId);
      if (!cust) throw new Error('العميل غير موجود');
      cust.limit = Math.max(0, newLimit);
      save();
      return wait(cust);
    }
  },
  tailors: { list: () => wait(TAILORS) },
  bolts: {
    list: () =>
      wait(
        db.products.flatMap((p) =>
          p.rolls.map((r) => ({
            id: r.id,
            productId: p.id,
            productName: p.name,
            meters: r.meters,
            dyeLot: r.dyeLot || 'صبغة أصلية',
            pricePerMeter: p.pricePerMeter,
            widthCm: p.widthCm
          }))
        )
      )
  },
  reports: {
    async getSummary() {
      const invs = db.invoices;
      const activeInvs = invs.filter((i) => i.status === 'ACTIVE');
      const totalSales = activeInvs.reduce((s, i) => s + i.total, 0);
      const cashSales = activeInvs.filter((i) => i.payment === 'cash').reduce((s, i) => s + i.total, 0);
      const creditSales = activeInvs.filter((i) => i.payment === 'credit').reduce((s, i) => s + i.total, 0);
      const totalMeters = activeInvs.flatMap((i) => i.lines).reduce((s, l) => s + l.meters, 0);
      const totalOutstandingDebt = db.customers.reduce((s, c) => s + c.balance, 0);
      const totalBolts = db.products.reduce((s, p) => s + p.rolls.length, 0);
      const totalInventoryMeters = db.products.flatMap((p) => p.rolls).reduce((s, r) => s + r.meters, 0);
      const remnantBolts = db.products.flatMap((p) => p.rolls).filter((r) => r.meters > 0 && r.meters < 2.5);

      return wait({
        totalSales,
        cashSales,
        creditSales,
        totalInvoices: activeInvs.length,
        voidedInvoices: invs.filter((i) => i.status === 'VOID').length,
        totalMetersCut: Math.round(totalMeters * 100) / 100,
        totalOutstandingDebt,
        totalBolts,
        totalInventoryMeters: Math.round(totalInventoryMeters * 100) / 100,
        remnantCount: remnantBolts.length
      });
    }
  },
  backup: {
    exportJSON: () => JSON.stringify(db, null, 2),
    importJSON: (jsonStr: string) => {
      try {
        const parsed = JSON.parse(jsonStr);
        if (parsed && parsed.products && parsed.customers) {
          localStorage.setItem(KEY, jsonStr);
          location.reload();
          return true;
        }
        throw new Error('ملف النسخة الاحتياطية غير صالح');
      } catch (e: unknown) {
        throw new Error('فشل استيراد النسخة: ' + (e instanceof Error ? e.message : String(e)));
      }
    }
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
