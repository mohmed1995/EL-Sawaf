import React, { useEffect, useState } from 'react';
import { api, type Invoice } from '../demo/mockApi.js';
import { play } from '../demo/sounds.js';

interface DailyInvoicesModalProps {
  onClose: () => void;
  onReprint: (invoice: Invoice) => void;
  onRefreshParent: () => void;
}

export const DailyInvoicesModal: React.FC<DailyInvoicesModalProps> = ({
  onClose,
  onReprint,
  onRefreshParent
}) => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [voidConfirmNo, setVoidConfirmNo] = useState<string | null>(null);
  const [searchFilter, setSearchFilter] = useState('');

  const loadData = async () => {
    setLoading(true);
    const list = await api.invoices.listToday();
    setInvoices(list);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
    const handleChanged = () => loadData();
    window.addEventListener('invoices:changed', handleChanged);
    return () => window.removeEventListener('invoices:changed', handleChanged);
  }, []);

  const handleVoid = async (no: string) => {
    try {
      await api.invoices.void(no);
      play('remove');
      setVoidConfirmNo(null);
      await loadData();
      onRefreshParent();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : String(err));
      play('error');
    }
  };

  const filtered = invoices.filter((i) => {
    if (!searchFilter) return true;
    const term = searchFilter.toLowerCase();
    return (
      i.no.includes(term) ||
      i.customer.name.toLowerCase().includes(term) ||
      i.lines.some((l) => l.name.toLowerCase().includes(term))
    );
  });

  const totalCash = invoices
    .filter((i) => i.status === 'ACTIVE' && i.payment === 'cash')
    .reduce((s, i) => s + i.total, 0);

  const totalCredit = invoices
    .filter((i) => i.status === 'ACTIVE' && i.payment === 'credit')
    .reduce((s, i) => s + i.total, 0);

  return (
    <div className="fixed inset-0 bg-black/75 flex items-center justify-center p-4 z-50 animate-fade-in backdrop-blur-sm" dir="rtl">
      <div className="bg-[#111A15] text-[#ECEEE8] border-2 border-[#C5A059] rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* رأس النافذة */}
        <div className="p-4 bg-gradient-to-r from-[#173F30] to-[#0F281E] border-b border-[#C5A059]/40 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <span className="text-2xl p-2 bg-[#C5A059]/20 rounded-lg text-[#ECC777] border border-[#C5A059]/40">📋</span>
            <div>
              <h2 className="text-lg font-black text-[#F4F1EA] tracking-wide">
                سجل فواتير الوردية الحالية
              </h2>
              <p className="text-xs text-[#C5A059]">
                استعراض فواتير اليوم، إعادة الطباعة الحرارية، وتراجع/إلغاء الفواتير مع رد الأمتار للأتواب
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-full w-8 h-8 flex items-center justify-center transition-colors"
          >
            ✕
          </button>
        </div>

        {/* شريط الإحصائيات السريعة للوردية والبحث */}
        <div className="bg-[#15231C] px-4 py-3 border-b border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-4">
            <div className="bg-[#0C1410] px-3 py-1.5 rounded-lg border border-white/10">
              <span className="text-gray-400">إجمالي النقدية: </span>
              <span className="font-bold text-emerald-400 font-mono text-sm">
                {totalCash.toLocaleString('ar-EG')} ج.م
              </span>
            </div>
            <div className="bg-[#0C1410] px-3 py-1.5 rounded-lg border border-white/10">
              <span className="text-gray-400">إجمالي الآجل (الشكك): </span>
              <span className="font-bold text-amber-400 font-mono text-sm">
                {totalCredit.toLocaleString('ar-EG')} ج.م
              </span>
            </div>
            <div className="bg-[#0C1410] px-3 py-1.5 rounded-lg border border-white/10">
              <span className="text-gray-400">عدد الفواتير: </span>
              <span className="font-bold text-white font-mono">{invoices.length}</span>
            </div>
          </div>

          <div className="relative">
            <input
              type="text"
              placeholder="بحث برقم الفاتورة أو العميل..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="bg-[#0C1410] border border-white/20 rounded-lg px-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#C5A059] w-56"
            />
          </div>
        </div>

        {/* جدول الفواتير */}
        <div className="p-4 overflow-y-auto flex-1 custom-scrollbar">
          {loading ? (
            <div className="text-center py-12 text-gray-400 text-sm">جاري جلب الفواتير...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-gray-400 flex flex-col items-center gap-2">
              <span className="text-3xl">🧾</span>
              <p className="text-sm font-bold">لا توجد فواتير مسجلة في هذه الوردية بعد</p>
              <p className="text-xs text-gray-500">قم بقص الأقمشة والضغط على "دفع كاش" أو "دفع آجل" لإصدار فاتورة جديدة</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((inv) => {
                const isVoid = inv.status === 'VOID';
                return (
                  <div
                    key={inv.no}
                    className={`border rounded-xl p-3.5 transition-all ${
                      isVoid
                        ? 'bg-red-950/20 border-red-800/40 opacity-70'
                        : 'bg-[#14201A] border-white/10 hover:border-[#C5A059]/60'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/5 pb-2 mb-2">
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-bold text-base text-[#ECC777] bg-black/40 px-2 py-0.5 rounded border border-white/10">
                          #{inv.no}
                        </span>
                        <div>
                          <div className="font-bold text-sm text-[#F4F1EA] flex items-center gap-2">
                            <span>{inv.customer.name}</span>
                            {inv.tailor && inv.tailor.id !== 't0' && (
                              <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800/60 px-1.5 py-0.5 rounded">
                                ترزي: {inv.tailor.name}
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-gray-400">{inv.date}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs px-2.5 py-1 rounded-full font-bold ${
                            isVoid
                              ? 'bg-red-900/60 text-red-200 border border-red-700'
                              : inv.payment === 'cash'
                              ? 'bg-emerald-900/60 text-emerald-200 border border-emerald-700'
                              : 'bg-amber-900/60 text-amber-200 border border-amber-700'
                          }`}
                        >
                          {isVoid ? '🚫 ملغاة ومسترجعة' : inv.payment === 'cash' ? '💵 كاش فوري' : '📜 آجل / شكك'}
                        </span>

                        <span className="font-mono text-base font-black text-[#F4F1EA]">
                          {inv.total.toLocaleString('ar-EG')} ج.م
                        </span>
                      </div>
                    </div>

                    {/* تفاصيل البنود */}
                    <div className="text-xs text-gray-300 space-y-1 my-2 bg-[#0C1410]/60 p-2.5 rounded-lg border border-white/5">
                      {inv.lines.map((line, lidx) => (
                        <div key={lidx} className="flex justify-between items-center text-[11px]">
                          <span>
                            • {line.name} <span className="text-gray-400 font-mono">({line.rollId})</span>
                          </span>
                          <span className="font-mono text-gray-400">
                            {line.meters} م × {line.price} ج ={' '}
                            <strong className="text-white">{(line.meters * line.price).toLocaleString('ar-EG')} ج</strong>
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* أزرار الإجراءات */}
                    <div className="flex items-center justify-between pt-2 border-t border-white/5 text-xs">
                      <div>
                        {isVoid && inv.voidedAt && (
                          <span className="text-[11px] text-red-400">
                            ألغيت بتاريخ: {inv.voidedAt}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            play('beep');
                            onReprint(inv);
                          }}
                          className="bg-[#C5A059]/20 hover:bg-[#C5A059] text-[#ECC777] hover:text-[#111A15] px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1"
                        >
                          <span>🖨️ طباعة إيصال 80mm</span>
                        </button>

                        {!isVoid && (
                          <>
                            {voidConfirmNo === inv.no ? (
                              <div className="flex items-center gap-1 bg-red-950/80 p-1 rounded-lg border border-red-600">
                                <span className="text-[11px] text-red-200 px-1 font-bold">تأكيد الإلغاء ورد الأمتار؟</span>
                                <button
                                  onClick={() => handleVoid(inv.no)}
                                  className="bg-red-600 hover:bg-red-700 text-white px-2 py-0.5 rounded text-[11px] font-bold"
                                >
                                  نعم، ألغِ
                                </button>
                                <button
                                  onClick={() => setVoidConfirmNo(null)}
                                  className="bg-gray-700 hover:bg-gray-600 text-white px-2 py-0.5 rounded text-[11px]"
                                >
                                  تراجع
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setVoidConfirmNo(inv.no)}
                                className="bg-red-950/40 hover:bg-red-900/60 text-red-300 border border-red-800/40 px-3 py-1.5 rounded-lg font-bold transition-all"
                              >
                                🚫 استرجاع / إلغاء
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* تذييل النافذة */}
        <div className="p-3 bg-[#0C1410] border-t border-white/10 flex justify-between items-center text-xs text-gray-400">
          <span>🛡️ عند إلغاء الفاتورة، يُعاد رصيد الأمتار للأتواب تلقائياً وتُخفض مديونية العميل إن كانت آجلة.</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold transition-colors"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
