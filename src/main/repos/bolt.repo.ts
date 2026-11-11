/** سجل الأتواب Append-Only: لا UPDATE ولا DELETE على bolt_ledger، وكل حركة سطر جديد. */
import type { Mm } from '../../shared/cashier-types';
import type { Db } from '../db';

export interface BoltRow {
  readonly id: number;
  readonly productId: number;
  readonly lengthMm: Mm;
  readonly remainingMm: Mm;
  readonly status: 'open' | 'finished';
}

export type LedgerReason = 'sale' | 'adjustment' | 'receive';

export class BoltRepo {
  private readonly getStmt;
  private readonly appendStmt;
  private readonly finishStmt;

  constructor(db: Db) {
    this.getStmt = db.prepare<[number], BoltRow>(`
      SELECT b.id, b.product_id AS productId, b.length_mm AS lengthMm, b.status,
             COALESCE((SELECT SUM(l.delta_mm) FROM bolt_ledger l WHERE l.bolt_id = b.id), 0) AS remainingMm
      FROM bolts b WHERE b.id = ?`);
    this.appendStmt = db.prepare(
      'INSERT INTO bolt_ledger (bolt_id, delta_mm, reason, invoice_id) VALUES (@boltId, @deltaMm, @reason, @invoiceId)',
    );
    this.finishStmt = db.prepare(`
      UPDATE bolts SET status = 'finished'
      WHERE id = ? AND status = 'open'
        AND COALESCE((SELECT SUM(delta_mm) FROM bolt_ledger WHERE bolt_id = bolts.id), 0) <= 0`);
  }

  get(boltId: number): BoltRow | null {
    return this.getStmt.get([boltId]) ?? null;
  }

  append(entry: { boltId: number; deltaMm: Mm; reason: LedgerReason; invoiceId: number | null }): void {
    this.appendStmt.run(entry);
  }

  /** يغلق التوب تلقائياً إذا نفد رصيده. */
  finishIfEmpty(boltId: number): void {
    this.finishStmt.run(boltId);
  }
}
