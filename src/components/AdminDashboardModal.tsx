import React, { useEffect, useState } from 'react';
import { api } from '../demo/mockApi.js';
import { type Product, type Customer, type Tailor } from '../demo/seed.js';
import { play } from '../demo/sounds.js';

interface AdminDashboardModalProps {
  onClose: () => void;
  onRefreshPOS: () => void;
}

export const AdminDashboardModal: React.FC<AdminDashboardModalProps> = ({ onClose, onRefreshPOS }) => {
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'BOLTS' | 'CUSTOMERS' | 'TAILORS' | 'BACKUP'>('OVERVIEW');
  const [summary, setSummary] = useState<any>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [tailors, setTailors] = useState<Tailor[]>([]);
  const [loading, setLoading] = useState(true);

  // حقول إضافة توب جديد
  const [selectedProdForRoll, setSelectedProdForRoll] = useState('');
  const [newRollMeters, setNewRollMeters] = useState('45');
  const [newRollDyeLot, setNewRollDyeLot] = useState('صبغة #EG-2026');

  // حقول إضافة قماش جديد
  const [newProdName, setNewProdName] = useState('');
  const [newProdPrice, setNewProdPrice] = useState('180');
  const [newProdWidth, setNewProdWidth] = useState('150');
  const [newProdOrigin, setNewProdOrigin] = useState('المحلة الكبرى - مصر');
  const [newProdComp, setNewProdComp] = useState('100% قطن مصري فاخر');
  const [newProdColorHex, setNewProdColorHex] = useState('#2b4c7e');
  const [newProdColorName, setNewProdColorName] = useState('أزرق ملكي');
  const [newProdInitialMeters, setNewProdInitialMeters] = useState('50');

  // حقول تحصيل سند قبض من عميل
  const [payCustId, setPayCustId] = useState('');
  const [payAmount, setPayAmount] = useState('');
  const [payNote, setPayNote] = useState('');

  // حقول إضافة عميل جديد
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newCustLimit, setNewCustLimit] = useState('15000');
  const [newCustSeason, setNewCustSeason] = useState('موسم كسر القصب (يناير - مايو)');
  const [newCustVillage, setNewCustVillage] = useState('مركز قنا');

  const [message, setMessage] = useState('');

  const loadData = async () => {
    setLoading(true);
    const sum = await api.reports.getSummary();
    const prods = await api.products.list();
    const custs = await api.customers.list();
    const tails = await api.tailors.list();

    setSummary(sum);
    setProducts(prods);
    setCustomers(custs);
    setTailors(tails);
    if (prods.length > 0 && !selectedProdForRoll) setSelectedProdForRoll(prods[0].id);
    if (custs.length > 1 && !payCustId) setPayCustId(custs[1].id);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddRoll = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProdForRoll || !(parseFloat(newRollMeters) > 0)) return;
    try {
      await api.products.addRoll(selectedProdForRoll, parseFloat(newRollMeters), newRollDyeLot);
      play('success');
      setMessage('✅ تم إضافة التوب الجديد بنجاح إلى مخزون الصنف!');
      await loadData();
      onRefreshPOS();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : String(err));
      play('error');
    }
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProdName.trim()) return;
    try {
      await api.products.create({
        name: newProdName,
        pricePerMeter: parseFloat(newProdPrice) || 100,
        widthCm: parseInt(newProdWidth) || 150,
        colorHex: newProdColorHex,
        colorName: newProdColorName,
        origin: newProdOrigin,
        composition: newProdComp,
        rolls: [
          {
            id: 'T-' + Math.floor(Math.random() * 900 + 100),
            meters: parseFloat(newProdInitialMeters) || 50,
            dyeLot: 'صبغة أصلية'
          }
        ]
      });
      play('success');
      setMessage('✅ تم إنشاء صنف القماش الجديد وتوريد التوب الابتدائي بنجاح!');
      setNewProdName('');
      await loadData();
      onRefreshPOS();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : String(err));
      play('error');
    }
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(payAmount);
    if (!payCustId || !(amt > 0)) return;
    try {
      const updated = await api.customers.recordPayment(payCustId, amt);
      play('creditStamp');
      setTimeout(() => play('drawer'), 250);
      setMessage(`✅ تم تسجيل سند قبض بقيمة ${amt.toLocaleString('ar-EG')} ج.م للعميل (${updated.name})! المديونية المتبقية: ${updated.balance.toLocaleString('ar-EG')} ج.م`);
      setPayAmount('');
      await loadData();
      onRefreshPOS();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : String(err));
      play('error');
    }
  };

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName.trim()) return;
    try {
      await api.customers.create({
        name: newCustName,
        phone: newCustPhone,
        limit: parseFloat(newCustLimit) || 10000,
        harvestSeason: newCustSeason,
        village: newCustVillage
      });
      play('success');
      setMessage(`✅ تم إضافة العميل الجديد (${newCustName}) وتحديد سقف الائتمان القبلي بنجاح!`);
      setNewCustName('');
      setNewCustPhone('');
      await loadData();
      onRefreshPOS();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : String(err));
      play('error');
    }
  };

  const handleAdjustRollMeters = async (productId: string, rollId: string, currentMeters: number) => {
    const val = prompt(`تعديل رصيد التوب ${rollId} بالمتر (الرصيد الحالي: ${currentMeters}م):`, String(currentMeters));
    if (val === null) return;
    const parsed = parseFloat(val);
    if (isNaN(parsed) || parsed < 0) return alert('الرقم المدخل غير صحيح');
    try {
      await api.products.updateStock(productId, rollId, parsed);
      play('beep');
      await loadData();
      onRefreshPOS();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : String(err));
    }
  };

  const handleExportBackup = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(api.backup.exportJSON());
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `alsawaf-backup-${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    play('success');
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-3 z-50 animate-fade-in backdrop-blur-md" dir="rtl">
      <div className="bg-[#0E1712] text-[#ECEEE8] border-2 border-[#C5A059] rounded-2xl shadow-2xl max-w-5xl w-full max-h-[94vh] flex flex-col overflow-hidden">
        {/* رأس لوحة الإدارة الملكية */}
        <div className="p-4 bg-gradient-to-r from-[#173F30] via-[#0F281E] to-[#07130E] border-b border-[#C5A059]/40 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <span className="text-2xl p-2.5 bg-[#C5A059] text-[#07130E] rounded-xl font-black shadow-lg">👑</span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-[#F4F1EA] tracking-wide">لوحة الإدارة التنفيذية والرقابة</h2>
                <span className="text-[10px] bg-[#C5A059]/20 text-[#ECC777] border border-[#C5A059]/40 px-2 py-0.5 rounded-full font-bold">
                  منظومة الصواف 2026
                </span>
              </div>
              <p className="text-xs text-[#C5A059] mt-0.5">
                متابعة حركة الأتواب الحية، دفاتر الآجل القبلي، توريدات الأقمشة، ومطابقة نقدية الوردية
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-full w-9 h-9 flex items-center justify-center transition-colors"
          >
            ✕
          </button>
        </div>

        {/* الشريط العلوي لأزرار التبويب */}
        <div className="flex border-b border-white/10 bg-[#08100C] px-4 pt-2 gap-2 overflow-x-auto">
          {[
            { id: 'OVERVIEW', label: '📊 المؤشرات والتقرير العام', icon: '📈' },
            { id: 'BOLTS', label: '🧵 الأتواب وجرد المخزون', icon: '📦' },
            { id: 'CUSTOMERS', label: '👤 العملاء والذمم والتحصيل', icon: '📜' },
            { id: 'TAILORS', label: '✂ عمولات الترزية', icon: '🪡' },
            { id: 'BACKUP', label: '💾 النسخ الاحتياطي والأمان', icon: '🛡️' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as typeof activeTab);
                setMessage('');
              }}
              className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === tab.id
                  ? 'border-[#C5A059] text-[#ECC777] bg-white/5 rounded-t-lg'
                  : 'border-transparent text-gray-400 hover:text-gray-200'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* تنبيه الرسائل الناجحة */}
        {message && (
          <div className="bg-emerald-950/80 border-b border-emerald-600/50 px-4 py-2 text-xs text-emerald-200 flex justify-between items-center">
            <span>{message}</span>
            <button onClick={() => setMessage('')} className="text-emerald-400 hover:text-white font-bold">✕</button>
          </div>
        )}

        {/* المحتوى الرئيسي للوحة الإدارة */}
        <div className="p-5 overflow-y-auto flex-1 custom-scrollbar">
          {loading ? (
            <div className="text-center py-16 text-gray-400">جاري تحميل بيانات المنظومة...</div>
          ) : activeTab === 'OVERVIEW' ? (
            /* ────────── تبويب المؤشرات الكبرى ────────── */
            <div className="space-y-6">
              {/* شبكة بطاقات الأداء الكبرى (KPIs) */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-[#132018] p-4 rounded-xl border border-white/10 relative overflow-hidden">
                  <span className="text-[11px] text-gray-400 block mb-1">إجمالي مبيعات اليوم</span>
                  <div className="text-2xl font-black font-mono text-[#ECC777]">
                    {summary?.totalSales.toLocaleString('ar-EG')} <span className="text-xs text-gray-400">ج.م</span>
                  </div>
                  <div className="text-[11px] text-emerald-400 mt-2 flex justify-between">
                    <span>نقدي: {summary?.cashSales.toLocaleString('ar-EG')} ج</span>
                    <span>آجل: {summary?.creditSales.toLocaleString('ar-EG')} ج</span>
                  </div>
                </div>

                <div className="bg-[#132018] p-4 rounded-xl border border-white/10">
                  <span className="text-[11px] text-gray-400 block mb-1">الأمتار المقصوصة اليوم</span>
                  <div className="text-2xl font-black font-mono text-white">
                    {summary?.totalMetersCut} <span className="text-xs text-gray-400">متر</span>
                  </div>
                  <div className="text-[11px] text-gray-400 mt-2">
                    عبر {summary?.totalInvoices} فواتير نشطة
                  </div>
                </div>

                <div className="bg-[#132018] p-4 rounded-xl border border-white/10">
                  <span className="text-[11px] text-gray-400 block mb-1">محفظة الديون القبلية (الآجل بالخارج)</span>
                  <div className="text-2xl font-black font-mono text-amber-400">
                    {summary?.totalOutstandingDebt.toLocaleString('ar-EG')} <span className="text-xs text-gray-400">ج.م</span>
                  </div>
                  <div className="text-[11px] text-gray-400 mt-2">
                    تستحق السداد في موسمي القصب والقمح
                  </div>
                </div>

                <div className="bg-[#132018] p-4 rounded-xl border border-white/10">
                  <span className="text-[11px] text-gray-400 block mb-1">المخزون الإجمالي للأتواب</span>
                  <div className="text-2xl font-black font-mono text-white">
                    {summary?.totalInventoryMeters} <span className="text-xs text-gray-400">متر</span>
                  </div>
                  <div className="text-[11px] text-[#C5A059] mt-2 flex justify-between">
                    <span>{summary?.totalBolts} توب نشط</span>
                    {summary?.remnantCount > 0 && <span className="text-amber-400">⚡ {summary.remnantCount} فضلات تصفية</span>}
                  </div>
                </div>
              </div>

              {/* قسم التحليل والتوصيات الذكية */}
              <div className="bg-[#14201A] p-5 rounded-2xl border border-white/10 space-y-3">
                <h3 className="font-bold text-sm text-[#ECC777] flex items-center gap-2">
                  <span>🧠</span> توصيات الذكاء الرقابي والتجاري لـ "الصواف"
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-gray-300">
                  <div className="bg-black/30 p-3 rounded-lg border border-white/5">
                    <strong className="text-white block mb-1">⚡ حالة فضلات الأتواب (Bolt-Buster Alert):</strong>
                    {summary?.remnantCount > 0 ? (
                      <span>
                        يوجد حالياً <strong className="text-amber-400 font-mono">{summary.remnantCount} أطراف أتواب</strong> تقل عن 2.5 متر. يُوصى بتقديم عروض بيع للزبائن بخصم تصفية 40-45% لتفريغ الرفوف ومنع تجمد رأس المال.
                      </span>
                    ) : (
                      <span>ممتاز! لا توجد فضلات راكدة حالياً بالمخزن، جميع الأتواب ذات أطوال كافية للقص السليم.</span>
                    )}
                  </div>

                  <div className="bg-black/30 p-3 rounded-lg border border-white/5">
                    <strong className="text-white block mb-1">🌾 استحقاقات الدفاتر القبلية:</strong>
                    <span>
                      إجمالي الديون القبلية <strong className="text-amber-400 font-mono">{summary?.totalOutstandingDebt.toLocaleString('ar-EG')} ج.م</strong> موزعة بين عملاء القرى المعتمدين. تحقق من مواعيد موسم كسر القصب القادم لتحصيل السندات.
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : activeTab === 'BOLTS' ? (
            /* ────────── تبويب الأتواب والمخزون الحي ────────── */
            <div className="space-y-6">
              {/* قسم توريد توب جديد لقماش قائم */}
              <div className="bg-[#132018] p-4 rounded-xl border border-white/10">
                <h3 className="text-xs font-black text-[#ECC777] mb-3 flex items-center gap-2">
                  <span>➕</span> توريد توب جديد لمخزن الأقمشة القائمة
                </h3>
                <form onSubmit={handleAddRoll} className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
                  <div>
                    <label className="block text-gray-400 mb-1">اختر الصنف القائم:</label>
                    <select
                      value={selectedProdForRoll}
                      onChange={(e) => setSelectedProdForRoll(e.target.value)}
                      className="w-full bg-[#08100C] border border-white/20 rounded-lg p-2 text-white focus:border-[#C5A059]"
                    >
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>{p.name} ({p.pricePerMeter} ج/م)</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-gray-400 mb-1">طول التوب المورد (متر):</label>
                    <input
                      type="number"
                      step="0.5"
                      value={newRollMeters}
                      onChange={(e) => setNewRollMeters(e.target.value)}
                      className="w-full bg-[#08100C] border border-white/20 rounded-lg p-2 text-white focus:border-[#C5A059] font-mono"
                      placeholder="مثلاً 45"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-gray-400 mb-1">كود الصبغة (Dye-Lot):</label>
                    <input
                      type="text"
                      value={newRollDyeLot}
                      onChange={(e) => setNewRollDyeLot(e.target.value)}
                      className="w-full bg-[#08100C] border border-white/20 rounded-lg p-2 text-white focus:border-[#C5A059]"
                      placeholder="رقم الصبغة لتوحيد اللون"
                    />
                  </div>

                  <div className="flex items-end">
                    <button
                      type="submit"
                      className="w-full bg-[#C5A059] hover:bg-[#DFBF7A] text-[#07130E] font-black p-2 rounded-lg transition-all"
                    >
                      توريد واعتماد التوب 📥
                    </button>
                  </div>
                </form>
              </div>

              {/* قسم إضافة صنف قماش جديد كلياً */}
              <div className="bg-[#132018] p-4 rounded-xl border border-white/10">
                <h3 className="text-xs font-black text-[#ECC777] mb-3 flex items-center gap-2">
                  <span>✨</span> تسجيل صنف قماش جديد كلياً في الكتالوج
                </h3>
                <form onSubmit={handleCreateProduct} className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
                  <div className="md:col-span-2">
                    <label className="block text-gray-400 mb-1">اسم الصنف التجاري:</label>
                    <input
                      type="text"
                      value={newProdName}
                      onChange={(e) => setNewProdName(e.target.value)}
                      className="w-full bg-[#08100C] border border-white/20 rounded-lg p-2 text-white focus:border-[#C5A059]"
                      placeholder="مثال: كتان إيطالي صيفي رجالي"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-gray-400 mb-1">سعر المتر (ج.م):</label>
                    <input
                      type="number"
                      value={newProdPrice}
                      onChange={(e) => setNewProdPrice(e.target.value)}
                      className="w-full bg-[#08100C] border border-white/20 rounded-lg p-2 text-white focus:border-[#C5A059] font-mono"
                      placeholder="180"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-gray-400 mb-1">عرض القماش (سم):</label>
                    <input
                      type="number"
                      value={newProdWidth}
                      onChange={(e) => setNewProdWidth(e.target.value)}
                      className="w-full bg-[#08100C] border border-white/20 rounded-lg p-2 text-white focus:border-[#C5A059] font-mono"
                      placeholder="150 أو 240 أو 280"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-gray-400 mb-1">بلد المنشأ / المصنع:</label>
                    <input
                      type="text"
                      value={newProdOrigin}
                      onChange={(e) => setNewProdOrigin(e.target.value)}
                      className="w-full bg-[#08100C] border border-white/20 rounded-lg p-2 text-white focus:border-[#C5A059]"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-400 mb-1">مواصفات النسيج والخامة:</label>
                    <input
                      type="text"
                      value={newProdComp}
                      onChange={(e) => setNewProdComp(e.target.value)}
                      className="w-full bg-[#08100C] border border-white/20 rounded-lg p-2 text-white focus:border-[#C5A059]"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-400 mb-1">لون النسيج:</label>
                    <div className="flex gap-2 items-center">
                      <input
                        type="color"
                        value={newProdColorHex}
                        onChange={(e) => setNewProdColorHex(e.target.value)}
                        className="w-9 h-9 rounded cursor-pointer border border-white/20 bg-transparent"
                      />
                      <input
                        type="text"
                        value={newProdColorName}
                        onChange={(e) => setNewProdColorName(e.target.value)}
                        className="flex-1 bg-[#08100C] border border-white/20 rounded-lg p-2 text-white focus:border-[#C5A059]"
                        placeholder="اسم اللون"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-gray-400 mb-1">طول التوب الافتتاحي (متر):</label>
                    <input
                      type="number"
                      value={newProdInitialMeters}
                      onChange={(e) => setNewProdInitialMeters(e.target.value)}
                      className="w-full bg-[#08100C] border border-white/20 rounded-lg p-2 text-white focus:border-[#C5A059] font-mono"
                    />
                  </div>

                  <div className="md:col-span-4 flex justify-end">
                    <button
                      type="submit"
                      className="bg-emerald-600 hover:bg-emerald-500 text-white font-black px-6 py-2 rounded-lg transition-all"
                    >
                      إضافة الصنف الجديد للكتالوج 🏷️
                    </button>
                  </div>
                </form>
              </div>

              {/* جدول جرد الأتواب الحية مع إمكانية تعديل الأمتار والتسوية */}
              <div className="bg-[#132018] rounded-xl border border-white/10 overflow-hidden">
                <div className="p-3 bg-[#08100C] border-b border-white/10 font-bold text-xs text-[#ECC777] flex justify-between items-center">
                  <span>جدول الأتواب الحية في المخزن وقيم الجرد</span>
                  <span className="text-gray-400 text-[11px]">انقر على رصيد أي توب لتعديله أو تسوية الجرد</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-[#08100C]/60 text-gray-400 border-b border-white/10 text-[11px]">
                      <tr>
                        <th className="p-2.5">كود التوب</th>
                        <th className="p-2.5">اسم الصنف</th>
                        <th className="p-2.5">الصبغة</th>
                        <th className="p-2.5">العرض</th>
                        <th className="p-2.5">سعر المتر</th>
                        <th className="p-2.5">رصيد الأمتار</th>
                        <th className="p-2.5">إجمالي القيمة</th>
                        <th className="p-2.5">إجراءات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {products.flatMap((p) =>
                        p.rolls.map((r) => {
                          const isRemnant = r.meters > 0 && r.meters < 2.5;
                          return (
                            <tr key={r.id} className="hover:bg-white/5 transition-colors">
                              <td className="p-2.5 font-mono font-bold text-[#ECC777]">{r.id}</td>
                              <td className="p-2.5 font-bold">{p.name}</td>
                              <td className="p-2.5 text-gray-400">{r.dyeLot || 'صبغة أصلية'}</td>
                              <td className="p-2.5 text-gray-400">{p.widthCm} سم</td>
                              <td className="p-2.5 font-mono">{p.pricePerMeter} ج</td>
                              <td className="p-2.5 font-mono font-black text-sm">
                                <span className={isRemnant ? 'text-amber-400' : 'text-white'}>
                                  {r.meters} م {isRemnant ? '⚡ فضلة' : ''}
                                </span>
                              </td>
                              <td className="p-2.5 font-mono font-bold text-emerald-400">
                                {(r.meters * p.pricePerMeter).toLocaleString('ar-EG')} ج.م
                              </td>
                              <td className="p-2.5">
                                <button
                                  onClick={() => handleAdjustRollMeters(p.id, r.id, r.meters)}
                                  className="bg-white/10 hover:bg-[#C5A059] text-white hover:text-black px-2.5 py-1 rounded text-[11px] font-bold transition-all"
                                >
                                  تسوية جرد 📝
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : activeTab === 'CUSTOMERS' ? (
            /* ────────── تبويب العملاء والذمم والتحصيل ────────── */
            <div className="space-y-6">
              {/* قسم تسجيل سند قبض فوري من عميل آجل */}
              <div className="bg-[#132018] p-4 rounded-xl border border-white/10">
                <h3 className="text-xs font-black text-[#ECC777] mb-3 flex items-center gap-2">
                  <span>💵</span> تسجيل سند قبض نقدية من حساب عميل (سداد آجل)
                </h3>
                <form onSubmit={handleRecordPayment} className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
                  <div>
                    <label className="block text-gray-400 mb-1">العميل المدين:</label>
                    <select
                      value={payCustId}
                      onChange={(e) => setPayCustId(e.target.value)}
                      className="w-full bg-[#08100C] border border-white/20 rounded-lg p-2 text-white focus:border-[#C5A059]"
                    >
                      {customers.filter((c) => c.id !== 'c0').map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} — عليه ({c.balance.toLocaleString('ar-EG')} ج)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-gray-400 mb-1">المبلغ المحصل (ج.م):</label>
                    <input
                      type="number"
                      value={payAmount}
                      onChange={(e) => setPayAmount(e.target.value)}
                      className="w-full bg-[#08100C] border border-white/20 rounded-lg p-2 text-white focus:border-[#C5A059] font-mono text-sm"
                      placeholder="المبلغ نقداً"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-gray-400 mb-1">ملاحظات / رقم الإيصال اليدوي:</label>
                    <input
                      type="text"
                      value={payNote}
                      onChange={(e) => setPayNote(e.target.value)}
                      className="w-full bg-[#08100C] border border-white/20 rounded-lg p-2 text-white focus:border-[#C5A059]"
                      placeholder="مثال: دفعة موسم كسر القصب"
                    />
                  </div>

                  <div className="flex items-end">
                    <button
                      type="submit"
                      className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black p-2 rounded-lg transition-all"
                    >
                      اعتماد سند القبض وتحديث الخزينة 💰
                    </button>
                  </div>
                </form>
              </div>

              {/* قسم إضافة عميل جديد */}
              <div className="bg-[#132018] p-4 rounded-xl border border-white/10">
                <h3 className="text-xs font-black text-[#ECC777] mb-3 flex items-center gap-2">
                  <span>👤</span> تسجيل عميل جديد وتحديد سقف الائتمان القبلي
                </h3>
                <form onSubmit={handleCreateCustomer} className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="block text-gray-400 mb-1">اسم العميل / الحاج / المقاول:</label>
                    <input
                      type="text"
                      value={newCustName}
                      onChange={(e) => setNewCustName(e.target.value)}
                      className="w-full bg-[#08100C] border border-white/20 rounded-lg p-2 text-white focus:border-[#C5A059]"
                      placeholder="مثال: الحاج عثمان - العوامية"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-gray-400 mb-1">رقم الهاتف / الواتساب:</label>
                    <input
                      type="text"
                      value={newCustPhone}
                      onChange={(e) => setNewCustPhone(e.target.value)}
                      className="w-full bg-[#08100C] border border-white/20 rounded-lg p-2 text-white focus:border-[#C5A059] font-mono"
                      placeholder="010xxxxxxxx"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-400 mb-1">سقف الائتمان المسموح (ج.م):</label>
                    <input
                      type="number"
                      value={newCustLimit}
                      onChange={(e) => setNewCustLimit(e.target.value)}
                      className="w-full bg-[#08100C] border border-white/20 rounded-lg p-2 text-white focus:border-[#C5A059] font-mono"
                      placeholder="15000"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-400 mb-1">موسم السداد الحصادي:</label>
                    <select
                      value={newCustSeason}
                      onChange={(e) => setNewCustSeason(e.target.value)}
                      className="w-full bg-[#08100C] border border-white/20 rounded-lg p-2 text-white focus:border-[#C5A059]"
                    >
                      <option value="موسم كسر القصب (يناير - مايو)">موسم كسر القصب (يناير - مايو)</option>
                      <option value="موسم توريد القمح (أبريل - يونيو)">موسم توريد القمح (أبريل - يونيو)</option>
                      <option value="أقساط شهرية منتظمة">أقساط شهرية منتظمة</option>
                      <option value="عند إتمام جهاز العروسة">عند إتمام جهاز العروسة</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-gray-400 mb-1">القرية / المركز:</label>
                    <input
                      type="text"
                      value={newCustVillage}
                      onChange={(e) => setNewCustVillage(e.target.value)}
                      className="w-full bg-[#08100C] border border-white/20 rounded-lg p-2 text-white focus:border-[#C5A059]"
                      placeholder="مثال: دندرة - قنا"
                    />
                  </div>

                  <div className="flex items-end">
                    <button
                      type="submit"
                      className="w-full bg-[#C5A059] hover:bg-[#DFBF7A] text-[#07130E] font-black p-2 rounded-lg transition-all"
                    >
                      حفظ العميل وسقف الائتمان 💾
                    </button>
                  </div>
                </form>
              </div>

              {/* جدول قائمة العملاء وموقف المديونيات */}
              <div className="bg-[#132018] rounded-xl border border-white/10 overflow-hidden">
                <div className="p-3 bg-[#08100C] border-b border-white/10 font-bold text-xs text-[#ECC777]">
                  جدول دفاتر حسابات العملاء ومحفظة الائتمان
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-[#08100C]/60 text-gray-400 border-b border-white/10 text-[11px]">
                      <tr>
                        <th className="p-2.5">اسم العميل</th>
                        <th className="p-2.5">القرية/المركز</th>
                        <th className="p-2.5">الهاتف</th>
                        <th className="p-2.5">موسم السداد</th>
                        <th className="p-2.5">سقف الآجل</th>
                        <th className="p-2.5">المديونية الحالية</th>
                        <th className="p-2.5">المتبقي من السقف</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {customers.map((c) => {
                        const remainingLimit = Math.max(0, c.limit - c.balance);
                        return (
                          <tr key={c.id} className="hover:bg-white/5 transition-colors">
                            <td className="p-2.5 font-bold text-[#F4F1EA]">{c.name}</td>
                            <td className="p-2.5 text-gray-400">{c.village || '—'}</td>
                            <td className="p-2.5 font-mono text-gray-400">{c.phone || '—'}</td>
                            <td className="p-2.5 text-xs text-[#C5A059]">{c.harvestSeason || 'نقدي'}</td>
                            <td className="p-2.5 font-mono">{c.limit.toLocaleString('ar-EG')} ج</td>
                            <td className="p-2.5 font-mono font-bold">
                              <span className={c.balance > 0 ? 'text-amber-400' : 'text-emerald-400'}>
                                {c.balance.toLocaleString('ar-EG')} ج.م
                              </span>
                            </td>
                            <td className="p-2.5 font-mono text-gray-400">
                              {c.limit > 0 ? `${remainingLimit.toLocaleString('ar-EG')} ج` : '—'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : activeTab === 'TAILORS' ? (
            /* ────────── تبويب عمولات الترزية ────────── */
            <div className="space-y-4">
              <div className="bg-[#132018] p-4 rounded-xl border border-white/10">
                <h3 className="text-xs font-black text-[#ECC777] mb-2">عمولات ترزية الصعيد المعتمدين والمفصلات</h3>
                <p className="text-xs text-gray-400 mb-4">
                  يقوم النظام باحتساب عمولة الترزي آلياً عند كل قصة قماش، مع دعم الصرف النقدي الفوري أو المقاصة العينية بالأقمشة.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {tailors.map((t) => (
                    <div key={t.id} className="bg-[#08100C] p-3.5 rounded-xl border border-white/10 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-sm text-white">{t.name}</span>
                        <span className="text-[10px] bg-[#C5A059]/20 text-[#ECC777] px-2 py-0.5 rounded">
                          {t.commissionPerMeter} ج/متر
                        </span>
                      </div>
                      <div className="text-xs text-gray-400">
                        هاتف: <span className="font-mono text-gray-300">{t.phone || 'مسجل بالمحل'}</span>
                      </div>
                      <div className="pt-2 border-t border-white/10 flex justify-between items-center text-xs">
                        <span className="text-gray-400">الحالة: نشط ومعتمد</span>
                        <button
                          onClick={() => alert(`تسوية حساب ${t.name}: جاري فتح سند الصرف النقدي.`)}
                          className="bg-[#C5A059] text-black px-2.5 py-1 rounded text-[11px] font-bold"
                        >
                          تسوية العمولة ✂
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* ────────── تبويب النسخ الاحتياطي وتصدير البيانات ────────── */
            <div className="space-y-4">
              <div className="bg-[#132018] p-5 rounded-2xl border border-white/10 space-y-4">
                <h3 className="text-sm font-black text-[#ECC777] flex items-center gap-2">
                  <span>🛡️</span> النسخ الاحتياطي وحماية دفاتر المحاسبة والأتواب
                </h3>
                <p className="text-xs text-gray-300 leading-relaxed">
                  تعتمد المنظومة على مبدأ **العمل دون اتصال (Offline-First)** التام. يُنصح بتصدير نسخة احتياطية من قاعدة البيانات يومياً بعد تقفيل الوردية لضمان سلامة الدفاتر المحاسبية وأرصدة الأتواب.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div className="bg-black/40 p-4 rounded-xl border border-white/10 space-y-3">
                    <h4 className="font-bold text-xs text-white">تصدير نسخة احتياطية كاملة (JSON / Database):</h4>
                    <p className="text-[11px] text-gray-400">
                      تحتوي على كافة المنتجات، الأتواب، أرصدة العملاء، والعمليات الحالية.
                    </p>
                    <button
                      onClick={handleExportBackup}
                      className="w-full bg-[#C5A059] hover:bg-[#DFBF7A] text-[#07130E] font-black py-2.5 rounded-lg text-xs transition-all flex items-center justify-center gap-2"
                    >
                      <span>تحميل النسخة الاحتياطية الآن</span>
                      <span>📥</span>
                    </button>
                  </div>

                  <div className="bg-black/40 p-4 rounded-xl border border-white/10 space-y-3">
                    <h4 className="font-bold text-xs text-white">استعادة نسخة سابقة:</h4>
                    <p className="text-[11px] text-gray-400">
                      استيراد ملف نسخة احتياطية لاستعادة الأرصدة والدفاتر في أي وقت.
                    </p>
                    <label className="w-full bg-white/10 hover:bg-white/20 text-white font-bold py-2.5 rounded-lg text-xs transition-all flex items-center justify-center gap-2 cursor-pointer">
                      <span>اختيار ملف النسخة الاحتياطية (.json)</span>
                      <span>📂</span>
                      <input
                        type="file"
                        accept=".json"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (event) => {
                              try {
                                api.backup.importJSON(event.target?.result as string);
                              } catch (err: unknown) {
                                alert(err instanceof Error ? err.message : String(err));
                              }
                            };
                            reader.readAsText(file);
                          }
                        }}
                      />
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* تذييل النافذة */}
        <div className="p-3 bg-[#08100C] border-t border-white/10 flex justify-between items-center text-xs text-gray-400">
          <span>🔒 لوحة الإدارة مؤمنة وتعمل بتوافق كامل مع خادم SQLite المحلي وقواعد المحاسبة الصارمة.</span>
          <button
            onClick={onClose}
            className="px-5 py-1.5 rounded-lg bg-[#C5A059] hover:bg-[#DFBF7A] text-black font-black transition-colors"
          >
            إغلاق اللوحة
          </button>
        </div>
      </div>
    </div>
  );
};
