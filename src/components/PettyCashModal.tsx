import { useState } from 'react';
import { play } from '../demo/sounds.js';

export interface PettyExpense {
  id: string;
  reason: string;
  amount: number;
  time: string;
}

export function PettyCashModal({
  currentCashInDrawer,
  onClose
}: {
  currentCashInDrawer: number;
  onClose: () => void;
}) {
  const [activeTab, setActiveTab] = useState<'expenses' | 'blind_close'>('expenses');
  const [expenses, setExpenses] = useState<PettyExpense[]>([
    { id: '1', reason: 'شاي وقهوة زبائن الصباح', amount: 35, time: '11:15 ص' },
    { id: '2', reason: 'مشال تروسيكل نقل أتواب من الموقف', amount: 80, time: '02:30 م' }
  ]);
  const [reason, setReason] = useState('');
  const [amount, setAmount] = useState('');

  // للتقفيل الأعمى
  const [countedCash, setCountedCash] = useState('');
  const [closeReport, setCloseReport] = useState<{ counted: number; system: number; diff: number } | null>(null);

  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);

  function addExpense() {
    const a = parseFloat(amount);
    if (!reason || !(a > 0)) return;
    setExpenses(prev => [...prev, {
      id: Date.now().toString(),
      reason,
      amount: a,
      time: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
    }]);
    setReason('');
    setAmount('');
    play('remove');
  }

  function doBlindClose() {
    const c = parseFloat(countedCash);
    if (isNaN(c)) return;
    const diff = c - currentCashInDrawer;
    setCloseReport({
      counted: c,
      system: currentCashInDrawer,
      diff
    });
    play(diff === 0 ? 'success' : 'creditStamp');
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 border-2 border-[#1B382B]" dir="rtl">
        <div className="flex justify-between items-center border-b pb-3 mb-4">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('expenses')}
              className={`py-1 px-3 text-xs font-bold rounded ${activeTab === 'expenses' ? 'bg-[#1B382B] text-[#C5A059]' : 'bg-gray-100 text-gray-700'}`}
            >
              ☕ مصاريف النثريات (الشاي والمشال)
            </button>
            <button
              onClick={() => setActiveTab('blind_close')}
              className={`py-1 px-3 text-xs font-bold rounded ${activeTab === 'blind_close' ? 'bg-[#1B382B] text-[#C5A059]' : 'bg-gray-100 text-gray-700'}`}
            >
              🔒 التقفيل الأعمى للوردية
            </button>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-black font-bold text-lg">✕</button>
        </div>

        {activeTab === 'expenses' ? (
          <div>
            <div className="bg-[#FAF8F4] p-3 rounded-lg border border-[#EAE4D7] mb-3 flex justify-between items-center">
              <div>
                <span className="text-xs text-gray-600 block">إجمالي مصاريف الوردية:</span>
                <span className="text-lg font-bold text-red-700">{totalExpenses} ج.م</span>
              </div>
              <div className="text-xs text-gray-500">تخصم تلقائياً من جرد الدرج اليومي</div>
            </div>

            <div className="space-y-2 mb-4 max-h-[160px] overflow-y-auto">
              {expenses.map(e => (
                <div key={e.id} className="flex justify-between items-center text-xs p-2 bg-gray-50 border rounded">
                  <span><b>{e.reason}</b> <small className="text-gray-500">({e.time})</small></span>
                  <span className="font-bold text-red-600">{e.amount} ج</span>
                </div>
              ))}
            </div>

            <div className="flex gap-2 items-center bg-gray-100 p-2 rounded">
              <input
                type="text"
                placeholder="سبب الصرف (شاي، عشاء عمال، تروسيكل)"
                value={reason}
                onChange={e => setReason(e.target.value)}
                className="flex-1 p-2 text-xs border rounded bg-white"
              />
              <input
                type="number"
                placeholder="المبلغ"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                className="w-20 p-2 text-xs border rounded bg-white font-bold"
              />
              <button onClick={addExpense} className="bg-[#1B382B] text-[#C5A059] text-xs py-2 px-3 rounded font-bold">
                صرف 💸
              </button>
            </div>
          </div>
        ) : (
          <div>
            {!closeReport ? (
              <div>
                <p className="text-xs text-gray-600 mb-3 bg-blue-50 p-2 rounded border border-blue-200">
                  <b>مبدأ التقفيل الأعمى (Blind Close):</b> الكاشير يقوم بعد النقدية الموجودة في الدرج فعلياً ويدخل الرقم هنا بدون أن يظهر له رصيد النظام المتوقع لمنع أي تعديل أو تغطية عجز.
                </p>

                <div className="my-4">
                  <label className="text-xs font-bold text-gray-700 block mb-1">
                    أدخل إجمالي النقدية المعدودة في الدرج الآن:
                  </label>
                  <input
                    type="number"
                    placeholder="مثال: 4500"
                    value={countedCash}
                    onChange={e => setCountedCash(e.target.value)}
                    className="w-full p-3 border-2 border-[#1B382B] rounded text-lg font-bold text-center"
                    autoFocus
                  />
                </div>

                <button
                  onClick={doBlindClose}
                  className="w-full bg-[#1B382B] text-[#C5A059] font-bold py-3 rounded-lg text-sm hover:bg-[#254F3D]"
                >
                  🔒 اعتماد التقفيل ومطابقة الخزينة
                </button>
              </div>
            ) : (
              <div className="bg-gray-50 p-4 rounded-lg border">
                <h3 className="font-bold text-center text-sm mb-3">تقرير تقفيل الوردية</h3>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between border-b pb-1">
                    <span>النقدية المعدودة في الدرج:</span>
                    <span className="font-bold">{closeReport.counted} ج.م</span>
                  </div>
                  <div className="flex justify-between border-b pb-1">
                    <span>المتوقع بالمنظومة (المبيعات - النثريات):</span>
                    <span className="font-bold">{closeReport.system} ج.م</span>
                  </div>
                  <div className="flex justify-between text-sm font-bold pt-1">
                    <span>حالة الدرج (الفرق):</span>
                    {closeReport.diff === 0 ? (
                      <span className="text-emerald-700">مطابق تماماً بالقرش (0 ج) ✔</span>
                    ) : closeReport.diff > 0 ? (
                      <span className="text-blue-700">زيادة بالدرج (+{closeReport.diff} ج)</span>
                    ) : (
                      <span className="text-red-700">عجز بالدرج ({closeReport.diff} ج) ⚠</span>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t flex justify-between">
                  <button onClick={() => setCloseReport(null)} className="text-xs text-gray-500">إعادة العد</button>
                  <button onClick={onClose} className="bg-emerald-700 text-white font-bold py-1 px-4 rounded text-xs">
                    حفظ وإغلاق الوردية
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
