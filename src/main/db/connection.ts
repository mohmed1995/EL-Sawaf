import { DatabaseSync } from 'node:sqlite';
import * as fs from 'node:fs';
import * as path from 'node:path';

/**
 * فتح وتهيئة قاعدة بيانات SQLite مع إعدادات الأمان ومقاومة انقطاع الكهرباء
 */
export function openDatabase(dbPath: string): DatabaseSync {
  // إنشاء المجلد إذا لم يكن موجوداً
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const db = new DatabaseSync(dbPath);

  // إعدادات الحماية القصوى لانقطاع التيار الكهربائي
  db.exec('PRAGMA journal_mode = WAL;');
  db.exec('PRAGMA synchronous = FULL;');
  db.exec('PRAGMA foreign_keys = ON;');
  db.exec('PRAGMA busy_timeout = 5000;');

  return db;
}

/**
 * تطبيق الـ Migrations الأولية على قاعدة البيانات
 */
export function runMigrations(db: DatabaseSync, migrationSqlPath: string): void {
  const sql = fs.readFileSync(migrationSqlPath, 'utf-8');
  db.exec(sql);
}
