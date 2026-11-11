/**
 * افتراضات السكيما (عدّلها إن اختلفت):
 *  products(id, name, search_name, price_per_meter INTEGER قروش)
 *  bolts(id, product_id, length_mm, status 'open'|'finished')
 *  bolt_ledger(bolt_id, delta_mm, reason, invoice_id, created_at) — Append-Only، والرصيد = SUM(delta_mm)
 * search_name = normalizeArabic(name) يُحدَّث عند إدخال/تعديل الصنف.
 */
import type { Piasters, ProductHit } from '../../shared/cashier-types';
import type { Db } from '../db';
import { toLikePattern } from './arabic';

interface HitRow {
  productId: number;
  name: string;
  unitPerMeter: string;
  boltId: number;
  boltLengthMm: number;
  boltRemainingMm: number;
}

const SEARCH_LIMIT = 30;

export class ProductRepo {
  private readonly searchStmt;
  private readonly priceStmt;

  constructor(db: Db) {
    // نقرأ السعر كنص ثم BigInt لتفادي فقدان الدقة.
    this.searchStmt = db.prepare<{ pattern: string; limit: number }, HitRow>(`
      SELECT p.id AS productId, p.name,
             CAST(p.price_per_meter AS TEXT) AS unitPerMeter,
             b.id AS boltId, b.length_mm AS boltLengthMm,
             COALESCE((SELECT SUM(l.delta_mm) FROM bolt_ledger l WHERE l.bolt_id = b.id), 0) AS boltRemainingMm
      FROM products p
      JOIN bolts b ON b.id = (SELECT MIN(b2.id) FROM bolts b2 WHERE b2.product_id = p.id AND b2.status = 'open')
      WHERE p.search_name LIKE @pattern ESCAPE '\\'
      ORDER BY p.name
      LIMIT @limit`);
    this.priceStmt = db.prepare<[number], { price: string }>(
      'SELECT CAST(price_per_meter AS TEXT) AS price FROM products WHERE id = ?',
    );
  }

  /** نتائج البحث مع أقدم توب مفتوح لكل صنف (FIFO). */
  search(query: string): ProductHit[] {
    return this.searchStmt
      .all({ pattern: toLikePattern(query), limit: SEARCH_LIMIT })
      .filter((r) => r.boltRemainingMm > 0)
      .map((r) => ({ ...r, unitPerMeter: BigInt(r.unitPerMeter) }));
  }

  unitPrice(productId: number): Piasters | null {
    const row = this.priceStmt.get([productId]);
    return row ? BigInt(row.price) : null;
  }
}
