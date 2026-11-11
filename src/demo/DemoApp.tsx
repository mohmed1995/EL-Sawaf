import './demo.css';
import { useEffect, useMemo, useRef, useState } from 'react';
import { api, type CartLine, type Invoice } from './mockApi.js';
import { type Product, type Customer, type Tailor } from './seed.js';
import { play, setMuted, getMuted } from './sounds.js';
import { Receipt80mm } from '../components/Receipt80mm.js';
import { BridalDossierModal } from '../components/BridalDossierModal.js';
import { PettyCashModal } from '../components/PettyCashModal.js';
import { TailorLedgerModal } from '../components/TailorLedgerModal.js';
import { SizingWizardModal } from '../components/SizingWizardModal.js';
import { DailyInvoicesModal } from '../components/DailyInvoicesModal.js';

const CATEGORIES = [
  { id: 'ALL', label: 'كل الأقمشة' },
  { id: 'BALADI', label: 'أصواف وجلاليب بلدي' },
  { id: 'ABAYA', label: 'عبايات وسواريه' },
  { id: 'BEDDING', label: 'ملايات ومفروشات' },
  { id: 'CURTAIN', label: 'ستائر وديكور' },
  { id: 'LINING', label: 'بطانات وساتان' }
];

const CUT_PRESETS = [
  { label: '+ ربع م (25 سم)', val: 0.25 },
  { label: '+ نصف م (50 سم)', val: 0.5 },
  { label: '+ متر كامل', val: 1.0 },
  { label: 'سديري (1.25 م)', val: 1.25 },
  { label: 'جلابية بلدي (3.5 م)', val: 3.5 },
  { label: 'جلابية طويل (3.75 م)', val: 3.75 },
  { label: 'طقم سرير (4.5 م)', val: 4.5 }
];

export default function DemoApp() {
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [tailors, setTailors] = useState<Tailor[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [sel, setSel] = useState<Product | null>(null);
  const [targetRollId, setTargetRollId] = useState<string | null>(null);

  // وضع القص: بالأمتار أو بميزانية الزبون (المبلغ)
  const [cutMode, setCutMode] = useState<'METERS' | 'BUDGET'>('METERS');
  const [meters, setMeters] = useState('3.5');
  const [budgetAmount, setBudgetAmount] = useState('200');

  const [cart, setCart] = useState<CartLine[]>([]);
  const [cid, setCid] = useState('c0');
  const [tid, setTid] = useState('t0');
  const [alert, setAlert] = useState('');
  const [inv, setInv] = useState<Invoice | null>(null);

  // الثيم الليلي والتحكم بالصوت
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('alsawaf-theme') === 'dark');
  const [isAudioMuted, setIsAudioMuted] = useState(() => getMuted());

  // النوافذ الاستراتيجية
  const [showBridal, setShowBridal] = useState(false);
  const [showPettyCash, setShowPettyCash] = useState(false);
  const [showTailors, setShowTailors] = useState(false);
  const [showSizing, setShowSizing] = useState(false);
  const [showDailyInvoices, setShowDailyInvoices] = useState(false);

  // مراجع عناصر الإدخال للاختصارات السريعة
  const searchInputRef = useRef<HTMLInputElement>(null);
  const customerSelectRef = useRef<HTMLSelectElement>(null);

  const refresh = async () => {
    setProducts(await api.products.list());
    setCustomers(await api.customers.list());
  };

  useEffect(() => {
    refresh();
    api.tailors.list().then(setTailors);
  }, []);

  // تطبيق الثيم الليلي على الجسم
  useEffect(() => {
    document.body.classList.toggle('dark-mode', isDarkMode);
    localStorage.setItem('alsawaf-theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  const toggleSound = () => {
    const next = !isAudioMuted;
    setIsAudioMuted(next);
    setMuted(next);
    if (!next) play('beep');
  };

  const total = useMemo(() => cart.reduce((s, l) => s + l.meters * l.price, 0), [cart]);
  const reserved = (rollId: string) =>
    cart.filter((l) => l.rollId === rollId).reduce((s, l) => s + l.meters, 0);

  // تصفية الأقمشة حسب التصنيف والبحث
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchCat =
        selectedCategory === 'ALL' ||
        (selectedCategory === 'BALADI' && (p.name.includes('صوف') || p.name.includes('كشمير'))) ||
        (selectedCategory === 'ABAYA' && p.name.includes('كريب')) ||
        (selectedCategory === 'BEDDING' && p.name.includes('ملايات')) ||
        (selectedCategory === 'CURTAIN' && (p.name.includes('ستائر') || p.name.includes('شيفون'))) ||
        (selectedCategory === 'LINING' && p.name.includes('ساتان'));

      const matchSearch =
        !searchQuery ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.origin.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.rolls.some((r) => r.id.toLowerCase().includes(searchQuery.toLowerCase()));

      return matchCat && matchSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  // حساب الأمتار المحسوبة تلقائياً عند إدخال ميزانية بالجنيه
  const calculatedMetersFromBudget = useMemo(() => {
    if (!sel || cutMode !== 'BUDGET') return 0;
    const b = parseFloat(budgetAmount);
    if (isNaN(b) || b <= 0) return 0;
    return Math.round((b / sel.pricePerMeter) * 100) / 100;
  }, [sel, cutMode, budgetAmount]);

  function addCut() {
    const m = cutMode === 'METERS' ? parseFloat(meters) : calculatedMetersFromBudget;
    if (!sel || !(m > 0)) {
      play('error');
      return;
    }

    // إذا حدد المستخدم توب يدوي
    let chosenRoll = sel.rolls.find((r) => r.id === targetRollId);
    if (chosenRoll) {
      const left = chosenRoll.meters - reserved(chosenRoll.id);
      if (left < m) {
        setAlert(`⚠️ التوب المحدد ${chosenRoll.id} لا يكفي: المتبقي فيه (${left} م) أقل من المطلوب (${m} م).`);
        play('boltBuster');
        return;
      }
    } else {
      // خوارزمية Bolt-Buster التلقائية
      const fits = sel.rolls
        .map((r) => ({ r, left: r.meters - reserved(r.id) }))
        .filter((x) => x.left >= m)
        .sort((a, b) => a.left - b.left)[0];

      if (!fits) {
        const max = Math.max(...sel.rolls.map((r) => r.meters - reserved(r.id)));
        setAlert(`⚠️ تنبيه عجز: الكمية (${m} م) أكبر من أي توب متاح (أقصى رصيد متاح في توب واحد هو ${max} م).`);
        play('boltBuster');
        return;
      }
      chosenRoll = fits.r;
    }

    const rollLeft = chosenRoll.meters - reserved(chosenRoll.id);
    const rest = Math.round((rollLeft - m) * 100) / 100;
    if (rest > 0 && rest < 2.5) {
      setAlert(`⚡ فرصة تصفية Bolt-Buster: القص سيترك فضلة (${rest} م) في التوب ${chosenRoll.id}. اعرض بيعها بالكامل بخصم تصفية!`);
      play('boltBuster');
    } else {
      setAlert('');
    }

    play('scissors');
    setCart((c) => [
      ...c,
      {
        productId: sel.id,
        name: sel.name,
        rollId: chosenRoll.id,
        meters: m,
        price: sel.pricePerMeter
      }
    ]);
  }

  async function pay(kind: 'cash' | 'credit') {
    if (!cart.length) {
      play('error');
      return;
    }

    try {
      const res = await api.checkout({
        lines: cart,
        customerId: cid,
        tailorId: tid,
        payment: kind
      });

      play(kind === 'cash' ? 'drawer' : 'creditStamp');
      setTimeout(() => play('success'), 450);

      setInv(res);
      setCart([]);
      setAlert('');
      refresh();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setAlert('⛔ ' + msg);
      play('error');
    }
  }

  // معالجة اختصارات لوحة المفاتيح الصارمة
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      // تجنب اعتراض الحروف أثناء الكتابة في حقول النصوص
      const isInput = e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement;

      if (e.key === 'F1') {
        e.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
      } else if (e.key === 'F2') {
        e.preventDefault();
        customerSelectRef.current?.focus();
      } else if (e.key === 'F3') {
        e.preventDefault();
        setShowSizing(true);
      } else if (e.key === 'F4') {
        e.preventDefault();
        setShowBridal(true);
      } else if (e.key === 'F8') {
        e.preventDefault();
        setShowDailyInvoices(true);
      } else if (e.key === 'F9') {
        e.preventDefault();
        setShowPettyCash(true);
      } else if (e.key === 'F10') {
        e.preventDefault();
        pay('credit');
      } else if (e.key === 'F12' || (!isInput && e.ctrlKey && e.key === 'Enter')) {
        e.preventDefault();
        pay('cash');
      } else if (e.key === 'Escape') {
        if (showBridal) setShowBridal(false);
        else if (showPettyCash) setShowPettyCash(false);
        else if (showTailors) setShowTailors(false);
        else if (showSizing) setShowSizing(false);
        else if (showDailyInvoices) setShowDailyInvoices(false);
        else if (inv) setInv(null);
        else if (cart.length > 0) {
          if (confirm('هل تريد إفراغ سلة الفاتورة الحالية؟')) {
            setCart([]);
            play('remove');
          }
        }
      }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  });

  const cust = customers.find((c) => c.id === cid);
  const creditUsagePercent = cust && cust.limit > 0 ? Math.min(100, Math.round(((cust.balance + total) / cust.limit) * 100)) : 0;

  return (
    <div className="app-container" dir="rtl">
      {/* ────────── الشريط العلوي النحيف الفاخر ────────── */}
      <header className="executive-header">
        <div className="brand-section">
          <div className="brand-logo-badge">الصواف</div>
          <div>
            <div className="brand-title">أقمشة ومنسوجات الصواف</div>
            <div className="brand-subtitle">نظام الصراف وإدارة الأتواب الذكي · صعيد مصر</div>
          </div>
        </div>

        <div className="stats-ticker">
          <span className="ticker-item">
            الأصناف: <b>{products.length}</b>
          </span>
          <span className="ticker-item">
            الأتواب النشطة: <b>{products.reduce((s, p) => s + p.rolls.length, 0)}</b>
          </span>
          <span className="ticker-item">
            إجمالي السلة: <b>{total.toLocaleString('ar-EG')} ج.م</b>
          </span>
        </div>

        <div className="header-actions">
          <button onClick={() => setShowDailyInvoices(true)} className="nav-pill-btn">
            📋 فواتير اليوم [F8]
          </button>
          <button onClick={() => setShowSizing(true)} className="nav-pill-btn">
            📐 دليل المقاسات [F3]
          </button>
          <button onClick={() => setShowBridal(true)} className="nav-pill-btn gold">
            👰 جهاز العروسة [F4]
          </button>
          <button onClick={() => setShowTailors(true)} className="nav-pill-btn">
            ✂ عمولات الترزية
          </button>
          <button onClick={() => setShowPettyCash(true)} className="nav-pill-btn">
            ☕ الوردية والنثريات [F9]
          </button>

          {/* زر التحكم بالصوت */}
          <button
            onClick={toggleSound}
            className="theme-toggle-btn"
            title={isAudioMuted ? 'تفعيل المؤثرات الصوتية' : 'كتم المؤثرات الصوتية'}
          >
            {isAudioMuted ? '🔇' : '🔊'}
          </button>

          {/* زر تبديل الثيم الليلي */}
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="theme-toggle-btn"
            title={isDarkMode ? 'التبديل إلى الوضع النهاري' : 'التبديل إلى الوضع الليلي'}
          >
            {isDarkMode ? '☀️' : '🌙'}
          </button>

          <button onClick={() => api.reset()} className="nav-pill-btn" title="إعادة تعيين بيانات العرض التوضيحي">
            🔄 استعادة
          </button>
        </div>
      </header>

      {/* ────────── صالة العرض (التقسيم الذهبي 62% / 38%) ────────── */}
      <div className="workspace-layout">
        {/* ────────── القسم الأيمن (62%): كتالوج الأقمشة والقص ────────── */}
        <section className="catalog-section">
          {/* شريط التصنيفات والبحث الفوري */}
          <div className="filter-bar">
            <div className="category-chips">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`chip ${selectedCategory === cat.id ? 'active' : ''}`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            <div className="search-input-wrap">
              <span className="search-icon">🔍</span>
              <input
                ref={searchInputRef}
                type="text"
                placeholder="بحث بقماش، توب، أو منشأ [F1]..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* شبكة كروت الأقمشة الفاخرة */}
          <div className="fabrics-grid">
            {filteredProducts.map((p) => {
              const isSelected = sel?.id === p.id;
              const totalLeft = p.rolls.reduce((sum, r) => sum + (r.meters - reserved(r.id)), 0);
              const isLow = totalLeft < 10;

              return (
                <div
                  key={p.id}
                  onClick={() => {
                    setSel(p);
                    setTargetRollId(null);
                    play('beep');
                  }}
                  className={`fabric-card ${isSelected ? 'selected' : ''}`}
                >
                  <div>
                    <div className="card-top">
                      <div className="flex items-center gap-2">
                        <div
                          className="swatch-color-preview"
                          style={{ backgroundColor: p.colorHex }}
                          title={`اللون: ${p.colorName}`}
                        />
                        <span className="text-[11px] font-bold text-gray-500">{p.origin}</span>
                      </div>
                      <span className="category-tag">عرض {p.widthCm} سم</span>
                    </div>

                    <h4 className="fabric-name">{p.name}</h4>
                    <p className="fabric-specs">{p.composition}</p>
                  </div>

                  <div>
                    <div className="stock-indicator">
                      <span className={`stock-dot ${isLow ? 'warning' : ''}`} />
                      <span>المتبقي بالمخزن: {totalLeft.toFixed(1)} م</span>
                    </div>

                    {/* قائمة الأتواب مع إمكانية التبديل اليدوي */}
                    <div className="stock-rolls-list">
                      {p.rolls.map((r) => {
                        const rollLeft = r.meters - reserved(r.id);
                        const isRollActive = isSelected && targetRollId === r.id;
                        const isRemnant = rollLeft > 0 && rollLeft < 2.5;

                        return (
                          <span
                            key={r.id}
                            onClick={(e) => {
                              if (isSelected) {
                                e.stopPropagation();
                                setTargetRollId(isRollActive ? null : r.id);
                                play('beep');
                              }
                            }}
                            className={`roll-badge ${isRollActive ? 'active-roll' : ''} ${
                              isRemnant ? 'border-amber-500 text-amber-600 font-bold' : ''
                            }`}
                            title={`رصيد التوب ${r.id}: ${rollLeft}م (${r.dyeLot || 'صبغة قياسية'})`}
                          >
                            {r.id}: {rollLeft.toFixed(1)}م {isRemnant ? '⚡' : ''}
                          </span>
                        );
                      })}
                    </div>

                    <div className="card-footer">
                      <span className="price-unit">سعر المتر</span>
                      <div>
                        <span className="price-val">{p.pricePerMeter}</span>
                        <span className="price-currency">ج.م</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* شريط حاسبة القص السريع والميزانية السفلي */}
          <div className="quick-cut-dock">
            <div className="dock-header-row">
              <span className="dock-title-text">
                {sel ? (
                  <>
                    <span>الصنف: </span>
                    <strong className="text-white">{sel.name}</strong>
                    <span className="text-gray-400 mr-2">
                      ({sel.pricePerMeter} ج/م · عرض {sel.widthCm}سم)
                    </span>
                    {targetRollId && (
                      <span className="bg-[#C5A059] text-[#070D09] px-2 py-0.5 rounded text-[11px] font-black mr-2">
                        توب يدوي: {targetRollId}
                      </span>
                    )}
                  </>
                ) : (
                  'اختر قماشاً من الشبكة لتحديد طول القص أو ميزانية الزبون'
                )}
              </span>

              {/* تبديل وضع القص (أمتار vs ميزانية الزبون) */}
              <div className="mode-toggle-group">
                <button
                  onClick={() => setCutMode('METERS')}
                  className={`mode-btn ${cutMode === 'METERS' ? 'active' : ''}`}
                >
                  📏 بالأمتار
                </button>
                <button
                  onClick={() => setCutMode('BUDGET')}
                  className={`mode-btn ${cutMode === 'BUDGET' ? 'active' : ''}`}
                >
                  💵 بميزانية الزبون (قص لي بـ...)
                </button>
              </div>
            </div>

            {/* أدوات التحكم بحسب الوضع */}
            {cutMode === 'METERS' ? (
              <div className="dock-controls">
                <div className="cut-presets">
                  {CUT_PRESETS.map((cp) => (
                    <button
                      key={cp.label}
                      onClick={() => {
                        setMeters(String(cp.val));
                        play('beep');
                      }}
                      className="preset-btn"
                    >
                      {cp.label}
                    </button>
                  ))}
                  <button
                    onClick={() => setShowSizing(true)}
                    className="preset-btn bg-[#C5A059]/20 text-[#C5A059] font-black"
                  >
                    📐 دليل الصعيد...
                  </button>
                </div>

                <div className="meters-input-box">
                  <input
                    type="text"
                    value={meters}
                    onChange={(e) => setMeters(e.target.value)}
                    placeholder="الأمتار"
                  />
                  <span className="meters-unit-label">متر</span>
                </div>

                <button onClick={addCut} className="cut-commit-btn">
                  <span>قص واعتمد</span>
                  <span>✂</span>
                </button>
              </div>
            ) : (
              <div className="dock-controls">
                <div className="cut-presets">
                  {[100, 150, 200, 300, 500, 1000].map((amt) => (
                    <button
                      key={amt}
                      onClick={() => {
                        setBudgetAmount(String(amt));
                        play('beep');
                      }}
                      className="preset-btn"
                    >
                      {amt} ج.م
                    </button>
                  ))}
                </div>

                <div className="meters-input-box">
                  <input
                    type="text"
                    value={budgetAmount}
                    onChange={(e) => setBudgetAmount(e.target.value)}
                    placeholder="المبلغ ج.م"
                  />
                  <span className="meters-unit-label">ج.م</span>
                </div>

                <button onClick={addCut} className="cut-commit-btn">
                  <span>قص بالمبلغ ({calculatedMetersFromBudget} م)</span>
                  <span>✂</span>
                </button>
              </div>
            )}

            {/* شريط توضيح نتيجة حاسبة الميزانية */}
            {cutMode === 'BUDGET' && sel && (
              <div className="budget-calc-banner">
                <span>
                  💡 ميزانية الزبون <strong>{budgetAmount || 0} ج.م</strong> تعادل بالظبط{' '}
                  <strong className="text-emerald-700 dark:text-emerald-400 font-mono text-sm">
                    {calculatedMetersFromBudget} متر
                  </strong>{' '}
                  (حوالي {Math.round(calculatedMetersFromBudget * 100)} سم) بسعر {sel.pricePerMeter} ج للمتر.
                </span>
                <span className="text-[11px] text-gray-500">لا هدر في القروش أو السنتيمترات</span>
              </div>
            )}
          </div>
        </section>

        {/* ────────── القسم الأيسر (38%): الفاتورة الحية والسلة ────────── */}
        <section className="docket-section">
          {/* رأس الفاتورة: العميل والترزي */}
          <div className="customer-docket-bar">
            <div className="docket-select-row">
              <select
                ref={customerSelectRef}
                value={cid}
                onChange={(e) => setCid(e.target.value)}
                className="docket-select"
              >
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.balance > 0 ? `(عليه ${c.balance} ج)` : ''}
                  </option>
                ))}
              </select>

              <select
                value={tid}
                onChange={(e) => setTid(e.target.value)}
                className="docket-select"
              >
                {tailors.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            {/* تفاصيل العميل وسقف الائتمان القبلي */}
            {cust && cust.id !== 'c0' && (
              <div className="tribal-credit-container">
                <div className="flex justify-between items-center text-xs">
                  <span>
                    سقف الآجل: <strong className="font-mono">{cust.limit.toLocaleString('ar-EG')} ج</strong>
                  </span>
                  <span className={cust.balance > 0 ? 'text-amber-500 font-bold' : 'text-emerald-500 font-bold'}>
                    المديونية: {(cust.balance + total).toLocaleString('ar-EG')} ج.م ({creditUsagePercent}%)
                  </span>
                </div>

                <div className="credit-progress-bar-bg">
                  <div
                    className={`credit-progress-bar-fill ${creditUsagePercent > 85 ? 'danger' : ''}`}
                    style={{ width: `${creditUsagePercent}%` }}
                  />
                </div>

                {cust.harvestSeason && (
                  <div className="text-[10px] text-gray-400 mt-1 flex justify-between">
                    <span>موسم السداد: <strong>{cust.harvestSeason}</strong></span>
                    <span>البلدة: {cust.village}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* تنبيه إنهاء التوب Bolt-Buster (إن وُجد) */}
          {alert && (
            <div className="bolt-buster-banner">
              <div className="banner-text">{alert}</div>
              <button onClick={() => setAlert('')} className="banner-accept-btn">
                علم ✔
              </button>
            </div>
          )}

          {/* أسطر الفاتورة الحية */}
          <div className="docket-lines">
            {cart.length === 0 ? (
              <div className="empty-docket">
                <span style={{ fontSize: '32px' }}>🛒</span>
                <span>الفاتورة فارغة حتى الآن</span>
                <span style={{ fontSize: '11px' }}>اضغط على أي قماش ثم اضغط "قص واعتمد"</span>
              </div>
            ) : (
              cart.map((line, idx) => (
                <div key={idx} className="line-item-card">
                  <div className="line-info">
                    <div className="line-name">{line.name}</div>
                    <div className="line-meta">
                      <span className="font-mono font-bold text-[#C5A059]">توب: {line.rollId}</span>
                      <span>·</span>
                      <span className="line-formula">
                        {line.meters} م × {line.price} ج
                      </span>
                    </div>
                  </div>

                  <div className="line-pricing">
                    <span className="line-total-amount">
                      {(line.meters * line.price).toLocaleString('ar-EG')} ج
                    </span>
                    <button
                      onClick={() => {
                        setCart((c) => c.filter((_, i) => i !== idx));
                        play('remove');
                      }}
                      className="line-del-btn"
                      title="حذف البند"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* لوحة الإجماليات وأزرار الدفع الكبرى */}
          <div className="docket-summary">
            <div className="summary-rows">
              <span>عدد الأقمشة المقصوصة:</span>
              <span>{cart.length} أصناف</span>
            </div>

            <div className="summary-rows">
              <span>إجمالي الأمتار المطلوبة:</span>
              <span className="font-mono font-bold">
                {cart.reduce((s, l) => s + l.meters, 0).toFixed(2)} متر
              </span>
            </div>

            <div className="grand-total-row">
              <span className="grand-label">إجمالي الفاتورة:</span>
              <div>
                <span className="grand-number">{total.toLocaleString('ar-EG')}</span>
                <span className="grand-currency">ج.م</span>
              </div>
            </div>

            <div className="payment-actions">
              <button onClick={() => pay('cash')} className="pay-btn cash">
                <span>💰 دفع نقدي</span>
                <span className="key-tag">[F12 / Enter]</span>
              </button>

              <button onClick={() => pay('credit')} className="pay-btn credit">
                <span>📜 دفع آجل / شكك</span>
                <span className="key-tag">[F10]</span>
              </button>
            </div>
          </div>
        </section>
      </div>

      {/* ────────── شريط مساعدة الاختصارات السريع السفلي ────────── */}
      <footer className="hotkey-helper-bar">
        <div className="hotkey-tag" onClick={() => searchInputRef.current?.focus()}>
          <kbd>F1</kbd> <span>بحث سريع</span>
        </div>
        <div className="hotkey-tag" onClick={() => customerSelectRef.current?.focus()}>
          <kbd>F2</kbd> <span>العميل</span>
        </div>
        <div className="hotkey-tag" onClick={() => setShowSizing(true)}>
          <kbd>F3</kbd> <span>مقاسات الصعيد</span>
        </div>
        <div className="hotkey-tag" onClick={() => setShowBridal(true)}>
          <kbd>F4</kbd> <span>جهاز عروسة</span>
        </div>
        <div className="hotkey-tag" onClick={() => setShowDailyInvoices(true)}>
          <kbd>F8</kbd> <span>فواتير اليوم</span>
        </div>
        <div className="hotkey-tag" onClick={() => setShowPettyCash(true)}>
          <kbd>F9</kbd> <span>نثريات الوردية</span>
        </div>
        <div className="hotkey-tag" onClick={() => pay('credit')}>
          <kbd>F10</kbd> <span>آجل/شكك</span>
        </div>
        <div className="hotkey-tag" onClick={() => pay('cash')}>
          <kbd>F12</kbd> <span>كاش فوري</span>
        </div>
        <div
          className="hotkey-tag cursor-pointer"
          onClick={() => {
            if (cart.length > 0 && confirm('إفراغ السلة؟')) setCart([]);
          }}
        >
          <kbd>Esc</kbd> <span>مسح السلة</span>
        </div>
      </footer>

      {/* النوافذ المنبثقة الفاخرة */}
      {showBridal && <BridalDossierModal onClose={() => setShowBridal(false)} />}
      {showPettyCash && <PettyCashModal currentCashInDrawer={total} onClose={() => setShowPettyCash(false)} />}
      {showTailors && <TailorLedgerModal onClose={() => setShowTailors(false)} />}
      {showSizing && (
        <SizingWizardModal
          onSelectMeters={(m, note) => {
            setMeters(String(m));
            if (note) setAlert(`📐 تم تطبيق مقاس: ${note}`);
          }}
          onClose={() => setShowSizing(false)}
        />
      )}
      {showDailyInvoices && (
        <DailyInvoicesModal
          onClose={() => setShowDailyInvoices(false)}
          onReprint={(invoice) => {
            setShowDailyInvoices(false);
            setInv(invoice);
          }}
          onRefreshParent={refresh}
        />
      )}

      {/* نافذة الإيصال الحراري 80mm */}
      {inv && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 animate-fade-in backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-sm w-full border-2 border-[#C5A059]" dir="rtl">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-bold text-base text-gray-900">فاتورة إيصال حراري (80mm)</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => window.print()}
                  className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs py-1.5 px-3 rounded font-bold transition-colors"
                >
                  طباعة 🖨
                </button>
                <button
                  onClick={() => setInv(null)}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-800 text-xs py-1.5 px-3 rounded font-bold transition-colors"
                >
                  إغلاق
                </button>
              </div>
            </div>
            <Receipt80mm inv={inv} />
          </div>
        </div>
      )}
    </div>
  );
}
