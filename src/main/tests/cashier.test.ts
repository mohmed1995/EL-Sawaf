import test from 'node:test';
import assert from 'node:assert/strict';
import * as path from 'node:path';
import * as fs from 'node:fs';
import { openDatabase, runMigrations } from '../db/connection.js';
import { CashierService } from '../services/cashier.service.js';
import type { Cart, FabricCartLine } from '../../shared/types/cart.js';
import { toCm, toQirsh, toQirshPerMeter } from '../../shared/types/units.js';

test('CashierService: Atomic Checkout with Bolt, Customer Debt, and Tailor Commission', () => {
  const testDbPath = path.resolve('test-cashier.sqlite');
  if (fs.existsSync(testDbPath)) fs.unlinkSync(testDbPath);

  const db = openDatabase(testDbPath);
  runMigrations(db, path.resolve('src/main/db/migrations/001_initial_schema.sql'));
  runMigrations(db, path.resolve('src/main/db/migrations/002_financial_ledgers.sql'));

  const cashier = new CashierService(db);

  // إعداد بيانات أولية
  const prodId = Number(db.prepare(`
    INSERT INTO products (sku, name_ar, category, fabric_width_cm, price_per_m_qirsh)
    VALUES ('SKU-01', 'كريب سعودي أسود', 'ABAYA', 150, 10000)
  `).run().lastInsertRowid);

  const lotId = Number(db.prepare(`
    INSERT INTO dye_lots (product_id, lot_code) VALUES (?, 'LOT-BLACK-1')
  `).run(prodId).lastInsertRowid);

  const boltId = Number(db.prepare(`
    INSERT INTO bolts (product_id, dye_lot_id, barcode, initial_length_cm, remaining_cm)
    VALUES (?, ?, 'BOLT-CR-1', 4000, 4000)
  `).run(prodId, lotId).lastInsertRowid);

  const custId = Number(db.prepare(`
    INSERT INTO customers (name, village, credit_limit) VALUES ('عمدة قرية العركي', 'فرشوط', 200000)
  `).run().lastInsertRowid);

  const tailorId = Number(db.prepare(`
    INSERT INTO tailors (name, phone, commission_val) VALUES ('الأسطى حسني الترزي', '01012345678', 500)
  `).run().lastInsertRowid);

  // إنشاء سلة بيع 3.5 متر عباية كلوش
  const fabricLine: FabricCartLine = {
    lineId: 'line-1',
    kind: 'FABRIC',
    productId: prodId,
    productName: 'كريب سعودي أسود',
    dyeLotId: lotId,
    lotCode: 'LOT-BLACK-1',
    requestedCm: toCm(350),
    unitPrice: toQirshPerMeter(10000), // 100 جنيه
    lineTotal: toQirsh(35000),         // 350 جنيه
    discount: toQirsh(0),
    allocations: [{
      boltId: boltId,
      boltBarcode: 'BOLT-CR-1',
      lengthCm: toCm(350),
      closesBolt: false
    }]
  };

  const cart: Cart = {
    id: 'cart-1',
    customerId: custId,
    tailorId: tailorId,
    lines: [fabricLine],
    payments: [{
      method: 'CREDIT',
      amount: toQirsh(35000), // سداد آجل بالكامل
      seasonRef: 'SUGARCANE'
    }],
    subtotal: toQirsh(35000),
    discountTotal: toQirsh(0),
    grandTotal: toQirsh(35000)
  };

  // تنفيذ الفاتورة
  const result = cashier.checkout(cart);
  assert.equal(result.success, true);
  assert.equal(result.totalQirsh, 35000);

  // التحقق من تحديث رصيد التوب (4000 - 350 = 3650 سم)
  const bolt = db.prepare('SELECT remaining_cm FROM bolts WHERE id = ?').get(boltId) as { remaining_cm: number };
  assert.equal(bolt.remaining_cm, 3650);

  // التحقق من تسجيل حركة التوب
  const mov = db.prepare('SELECT delta_cm, balance_after_cm FROM bolt_movements WHERE bolt_id = ?').get(boltId) as { delta_cm: number; balance_after_cm: number };
  assert.equal(mov.delta_cm, -350);
  assert.equal(mov.balance_after_cm, 3650);

  // التحقق من رصيد دين العميل (35000 قرش)
  const cust = db.prepare('SELECT current_balance FROM customers WHERE id = ?').get(custId) as { current_balance: number };
  assert.equal(cust.current_balance, 35000);

  // التحقق من عمولة الترزي (3.5 متر * 500 قرش = 1750 قرش = 17.5 جنيه)
  const tailor = db.prepare('SELECT balance_qirsh FROM tailors WHERE id = ?').get(tailorId) as { balance_qirsh: number };
  assert.equal(tailor.balance_qirsh, 1750);

  // تنظيف
  db.close();
  if (fs.existsSync(testDbPath)) fs.unlinkSync(testDbPath);
  const walPath = `${testDbPath}-wal`;
  if (fs.existsSync(walPath)) fs.unlinkSync(walPath);
  const shmPath = `${testDbPath}-shm`;
  if (fs.existsSync(shmPath)) fs.unlinkSync(shmPath);
});
