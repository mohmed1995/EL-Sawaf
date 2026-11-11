-- ==============================================================================
-- منظومة الصواف للأقمشة — مخطط قاعدة البيانات الأولي (001_initial_schema.sql)
-- الحسابات الصارمة: الأمتار بالسنتيمتر (INTEGER) والفلوس بالقرش (INTEGER)
-- ==============================================================================

-- جدول الأصناف الرئيسية (Master Products)
CREATE TABLE IF NOT EXISTS products (
  id                    INTEGER PRIMARY KEY AUTOINCREMENT,
  sku                   TEXT NOT NULL UNIQUE,
  name_ar               TEXT NOT NULL,
  category              TEXT NOT NULL CHECK (category IN ('CURTAIN','BEDDING','BALADI','ABAYA','SUITING','UPHOLSTERY','BRIDAL','OTHER')),
  fabric_width_cm       INTEGER NOT NULL CHECK (fabric_width_cm > 0),
  price_per_m_qirsh     INTEGER NOT NULL CHECK (price_per_m_qirsh >= 0),
  min_sale_cm           INTEGER NOT NULL DEFAULT 25 CHECK (min_sale_cm > 0),
  remnant_threshold_cm  INTEGER NOT NULL DEFAULT 150 CHECK (remnant_threshold_cm >= 0),
  is_active             INTEGER NOT NULL DEFAULT 1,
  created_at            TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);

-- جدول لوتات وتشغيلات الصباغة (Dye Lots)
CREATE TABLE IF NOT EXISTS dye_lots (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id  INTEGER NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  lot_code    TEXT NOT NULL,
  received_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  UNIQUE (product_id, lot_code)
);

CREATE INDEX IF NOT EXISTS idx_dye_lots_product ON dye_lots(product_id);

-- جدول الأتواب والرولات الفردية (Bolts)
CREATE TABLE IF NOT EXISTS bolts (
  id                 INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id         INTEGER NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  dye_lot_id         INTEGER NOT NULL REFERENCES dye_lots(id) ON DELETE RESTRICT,
  barcode            TEXT NOT NULL UNIQUE,
  initial_length_cm  INTEGER NOT NULL CHECK (initial_length_cm > 0),
  remaining_cm       INTEGER NOT NULL CHECK (remaining_cm >= 0),
  status             TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','REMNANT','CLOSED','WRITTEN_OFF')),
  shelf_location     TEXT,
  version            INTEGER NOT NULL DEFAULT 1,
  created_at         TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  CHECK (remaining_cm <= initial_length_cm)
);

CREATE INDEX IF NOT EXISTS idx_bolts_lookup ON bolts(product_id, dye_lot_id, status, remaining_cm);
CREATE INDEX IF NOT EXISTS idx_bolts_barcode ON bolts(barcode);

-- سجل حركات الأتواب المغلق للأبد (Append-Only Ledger)
CREATE TABLE IF NOT EXISTS bolt_movements (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  bolt_id          INTEGER NOT NULL REFERENCES bolts(id) ON DELETE RESTRICT,
  kind             TEXT NOT NULL CHECK (kind IN ('RECEIVE','CUT_SALE','CUT_TAILOR','CUT_BRIDAL','DEFECT_COMP','ADJUST','WASTE','RETURN')),
  delta_cm         INTEGER NOT NULL,
  balance_after_cm INTEGER NOT NULL CHECK (balance_after_cm >= 0),
  sale_line_id     INTEGER,
  reason           TEXT,
  created_at       TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  created_by       INTEGER
);

CREATE INDEX IF NOT EXISTS idx_mov_bolt_date ON bolt_movements(bolt_id, created_at);

-- حماية السجل ضد التعديل أو الحذف لضمان أمانة الجرد
CREATE TRIGGER IF NOT EXISTS trg_mov_no_update BEFORE UPDATE ON bolt_movements
BEGIN
  SELECT RAISE(ABORT, 'لا يمكن تعديل سجل حركة التوب إطلاقاً — السجل للإضافة فقط (Append-Only)');
END;

CREATE TRIGGER IF NOT EXISTS trg_mov_no_delete BEFORE DELETE ON bolt_movements
BEGIN
  SELECT RAISE(ABORT, 'لا يمكن حذف سجل حركة التوب إطلاقاً — السجل للإضافة فقط (Append-Only)');
END;

-- جدول الترزية وشركاء النجاح (Tailors)
CREATE TABLE IF NOT EXISTS tailors (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  name            TEXT NOT NULL,
  village         TEXT,
  phone           TEXT UNIQUE,
  qr_code         TEXT UNIQUE,
  commission_type TEXT NOT NULL DEFAULT 'PER_METER' CHECK (commission_type IN ('PER_METER','PERCENTAGE')),
  commission_val  INTEGER NOT NULL DEFAULT 500, -- 500 قرش = 5 جنيه للمتر
  balance_qirsh   INTEGER NOT NULL DEFAULT 0,
  created_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

-- جدول عملاء الآجل والعائلات (Customers)
CREATE TABLE IF NOT EXISTS customers (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  name            TEXT NOT NULL,
  village         TEXT NOT NULL,
  clan_name       TEXT,                         -- اسم العائلة
  guarantor_name  TEXT,                         -- الضامن من كبار العائلة
  phone           TEXT,
  credit_limit    INTEGER NOT NULL DEFAULT 0,   -- سقف الآجل بالقرش
  current_balance INTEGER NOT NULL DEFAULT 0,   -- المديونية الحالية بالقرش
  harvest_season  TEXT CHECK (harvest_season IN ('SUGARCANE','WHEAT','FEAST','CUSTOM')),
  created_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE INDEX IF NOT EXISTS idx_customers_search ON customers(name, village, phone);
