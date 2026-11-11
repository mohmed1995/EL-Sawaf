/** افتراض: customers(id, name, phone, search_name). */
import type { CustomerHit } from '../../shared/cashier-types';
import type { Db } from '../db';
import { toLikePattern } from './arabic';

export class CustomerRepo {
  private readonly searchStmt;
  private readonly existsStmt;

  constructor(db: Db) {
    this.searchStmt = db.prepare<{ pattern: string; raw: string }, CustomerHit>(`
      SELECT id, name, phone FROM customers
      WHERE search_name LIKE @pattern ESCAPE '\\' OR phone LIKE @raw ESCAPE '\\'
      ORDER BY name LIMIT 30`);
    this.existsStmt = db.prepare<[number], { ok: number }>('SELECT 1 AS ok FROM customers WHERE id = ?');
  }

  search(query: string): CustomerHit[] {
    const raw = `%${query.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
    return this.searchStmt.all({ pattern: toLikePattern(query), raw });
  }

  exists(id: number): boolean {
    return this.existsStmt.get([id]) !== undefined;
  }
}
