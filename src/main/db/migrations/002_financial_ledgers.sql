-- ==============================================================================
-- منظومة الصواف للأقمشة — مخطط السجلات المالية المحمية (002_financial_ledgers.sql)
-- حماية حسابات الآجل والعمولات ضد التعديل أو الحذف (Append-Only Financial Ledgers)
-- ==============================================================================

-- 1. سجل مديونيات وحسابات العملاء (دفتر الآجل العائلي)
CREATE TABLE IF NOT EXISTS customer_ledger (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_id     INTEGER NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  kind            TEXT NOT NULL CHECK (kind IN ('SALE_DEBT', 'PAYMENT', 'ADJUSTMENT')),
  amount_qirsh    INTEGER NOT NULL, -- موجب للمديونية، سالب للسداد
  balance_after   INTEGER NOT NULL CHECK (balance_after >= 0),
  sale_id         INTEGER,
  receipt_no      TEXT,
  note            TEXT,
  created_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  created_by      INTEGER
);

CREATE INDEX IF NOT EXISTS idx_cust_ledger_date ON customer_ledger(customer_id, created_at);

-- حماية سجل العملاء ضد التعديل أو الحذف
CREATE TRIGGER IF NOT EXISTS trg_cust_ledger_no_update BEFORE UPDATE ON customer_ledger
BEGIN
  SELECT RAISE(ABORT, 'سجل مديونية العملاء مغلق وغير قابل للتعديل (Append-Only)');
END;

CREATE TRIGGER IF NOT EXISTS trg_cust_ledger_no_delete BEFORE DELETE ON customer_ledger
BEGIN
  SELECT RAISE(ABORT, 'سجل مديونية العملاء مغلق وغير قابل للحذف (Append-Only)');
END;

-- 2. سجل عمولات ومقاصة الترزية (دفتر شركاء النجاح)
CREATE TABLE IF NOT EXISTS tailor_ledger (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  tailor_id       INTEGER NOT NULL REFERENCES tailors(id) ON DELETE RESTRICT,
  kind            TEXT NOT NULL CHECK (kind IN ('COMMISSION_EARNED', 'CASH_PAYOUT', 'MATERIAL_PURCHASE', 'ADJUSTMENT')),
  amount_qirsh    INTEGER NOT NULL, -- موجب للعمولة المستحقة، سالب للصرف أو المقاصة
  balance_after   INTEGER NOT NULL,
  sale_id         INTEGER,
  note            TEXT,
  created_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  created_by      INTEGER
);

CREATE INDEX IF NOT EXISTS idx_tailor_ledger_date ON tailor_ledger(tailor_id, created_at);

-- حماية سجل الترزية ضد التعديل أو الحذف
CREATE TRIGGER IF NOT EXISTS trg_tailor_ledger_no_update BEFORE UPDATE ON tailor_ledger
BEGIN
  SELECT RAISE(ABORT, 'سجل عمولات الترزية مغلق وغير قابل للتعديل (Append-Only)');
END;

CREATE TRIGGER IF NOT EXISTS trg_tailor_ledger_no_delete BEFORE DELETE ON tailor_ledger
BEGIN
  SELECT RAISE(ABORT, 'سجل عمولات الترزية مغلق وغير قابل للحذف (Append-Only)');
END;
