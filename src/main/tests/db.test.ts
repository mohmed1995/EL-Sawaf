import test from 'node:test';
import assert from 'node:assert/strict';
import * as path from 'node:path';
import * as fs from 'node:fs';
import { openDatabase, runMigrations } from '../db/connection.js';

test('SQLite Database: WAL mode and Append-Only Ledger Triggers', () => {
  const testDbPath = path.resolve('test-alsawaf.sqlite');
  if (fs.existsSync(testDbPath)) fs.unlinkSync(testDbPath);

  const db = openDatabase(testDbPath);
  
  // تشغيل المخططين
  runMigrations(db, path.resolve('src/main/db/migrations/001_initial_schema.sql'));
  runMigrations(db, path.resolve('src/main/db/migrations/002_financial_ledgers.sql'));

  // 1. إضافة صنف وتوب وحركة
  const insertProduct = db.prepare(`
    INSERT INTO products (sku, name_ar, category, fabric_width_cm, price_per_m_qirsh, min_sale_cm, remnant_threshold_cm)
    VALUES ('WOOL-ENG-01', 'صوف إنجليزي كحلي', 'BALADI', 150, 25000, 25, 150)
  `);
  const productId = Number(insertProduct.run().lastInsertRowid);

  const insertLot = db.prepare(`INSERT INTO dye_lots (product_id, lot_code) VALUES (?, 'LOT-2026-A')`);
  const lotId = Number(insertLot.run(productId).lastInsertRowid);

  const insertBolt = db.prepare(`
    INSERT INTO bolts (product_id, dye_lot_id, barcode, initial_length_cm, remaining_cm, shelf_location)
    VALUES (?, ?, 'BOLT-9901', 4000, 4000, 'ستاند أ - رف 1')
  `);
  const boltId = Number(insertBolt.run(productId, lotId).lastInsertRowid);

  const insertMovement = db.prepare(`
    INSERT INTO bolt_movements (bolt_id, kind, delta_cm, balance_after_cm, reason)
    VALUES (?, 'RECEIVE', 4000, 4000, 'استلام فاتورة مورد')
  `);
  const movId = Number(insertMovement.run(boltId).lastInsertRowid);

  // منع تعديل أو حذف سجل حركة الأتواب
  assert.throws(() => {
    db.prepare(`UPDATE bolt_movements SET delta_cm = 5000 WHERE id = ?`).run(movId);
  }, /لا يمكن تعديل سجل حركة التوب إطلاقاً/);

  assert.throws(() => {
    db.prepare(`DELETE FROM bolt_movements WHERE id = ?`).run(movId);
  }, /لا يمكن حذف سجل حركة التوب إطلاقاً/);

  // 2. اختبار سجل ديون العملاء المحمي
  const insertCustomer = db.prepare(`
    INSERT INTO customers (name, village, credit_limit) VALUES ('الحاج رضوان الصعيدي', 'الوقف', 500000)
  `);
  const customerId = Number(insertCustomer.run().lastInsertRowid);

  const insertCustLedger = db.prepare(`
    INSERT INTO customer_ledger (customer_id, kind, amount_qirsh, balance_after, note)
    VALUES (?, 'SALE_DEBT', 150000, 150000, 'فاتورة آجل كسر القصب')
  `);
  const custLedgerId = Number(insertCustLedger.run(customerId).lastInsertRowid);

  // منع تعديل أو حذف سجل الآجل
  assert.throws(() => {
    db.prepare(`UPDATE customer_ledger SET amount_qirsh = 1000 WHERE id = ?`).run(custLedgerId);
  }, /سجل مديونية العملاء مغلق وغير قابل للتعديل/);

  assert.throws(() => {
    db.prepare(`DELETE FROM customer_ledger WHERE id = ?`).run(custLedgerId);
  }, /سجل مديونية العملاء مغلق وغير قابل للحذف/);

  // تنظيف ملف التجربة
  db.close();
  if (fs.existsSync(testDbPath)) fs.unlinkSync(testDbPath);
  const walPath = `${testDbPath}-wal`;
  if (fs.existsSync(walPath)) fs.unlinkSync(walPath);
  const shmPath = `${testDbPath}-shm`;
  if (fs.existsSync(shmPath)) fs.unlinkSync(shmPath);
});
