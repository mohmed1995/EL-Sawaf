import { useState } from 'react';
import { play } from '../demo/sounds.js';

export interface TailorAccount {
  id: string;
  name: string;
  phone: string;
  totalMetersCut: number;
  totalCommission: number;
  paidOut: number;
  balance: number;
}

export function TailorLedgerModal({ onClose }: { onClose: () => void }) {
  const [tailors, setTailors] = useState<TailorAccount[]>([
    {
      id: 't1',
      name: 'الأسطى حسني الترزي',
      phone: '01012345678',
      totalMetersCut: 68.5,
      totalCommission: 342.5, // 5 ج للمتر
      paidOut: 200,
      balance: 142.5
    },
    {
      id: 't2',
      name: 'المعلم سيد الخياط',
      phone: '01198765432',
      totalMetersCut: 44.0,
      totalCommission: 220.0,
      paidOut: 150,
      balance: 70.0
    }
  ]);

  const [payoutAmount, setPayoutAmount] = useState('');
  const [selectedTailorId, setSelectedTailorId] = useState('t1');

  function payout(method: 'CASH' | 'FABRIC_OFFSET') {
    const a = parseFloat(payoutAmount);
    if (!(a > 0)) return;

    setTailors(prev => prev.map(t => {
      if (t.id === selectedTailorId) {
        return {
          ...t,
          paidOut: t.paidOut + a,
          balance: t.balance - a
        };
      }
      return t;
    }));

    setPayoutAmount('');
    play(method === 'CASH' ? 'drawer' : 'creditStamp');
  }

  const selectedTailor = tailors.find(t => t.id === selectedTailorId);

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-6 border-2 border-[#C5A059]" dir="rtl">
        <div className="flex justify-between items-center border-b pb-3 mb-4">
          <div>
            <h2 className="text-lg font-bold text-[#1B382B] flex items-center gap-2">
              ✂ دفتر حسابات وعمولات الترزية (شركاء النجاح)
            </h2>
            <p className="text-xs text-gray-500">متابعة عمولات المتر للترزية وخيارات الصرف النقدي أو مقاصة الخامات</p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-black font-bold text-lg">✕</button>
        </div>

        <div className="overflow-x-auto border rounded mb-4">
          <table className="w-full text-right text-xs">
            <thead className="bg-[#1B382B] text-white">
              <tr>
                <th className="p-2">الترزي</th>
                <th className="p-2">الهاتف</th>
                <th className="p-2">إجمالي الأمتار المقصوصة</th>
                <th className="p-2">إجمالي العمولة (5 ج/م)</th>
                <th className="p-2">المصروف سابقاً</th>
                <th className="p-2">الرصيد المستحق</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {tailors.map(t => (
                <tr
                  key={t.id}
                  onClick={() => setSelectedTailorId(t.id)}
                  className={`cursor-pointer ${selectedTailorId === t.id ? 'bg-amber-100 font-bold' : 'hover:bg-gray-50'}`}
                >
                  <td className="p-2">{t.name}</td>
                  <td className="p-2 text-gray-600">{t.phone}</td>
                  <td className="p-2">{t.totalMetersCut} م</td>
                  <td className="p-2 text-gray-700">{t.totalCommission} ج</td>
                  <td className="p-2 text-gray-500">{t.paidOut} ج</td>
                  <td className="p-2 text-emerald-800 font-bold">{t.balance} ج.م</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {selectedTailor && (
          <div className="bg-[#FAF8F4] p-4 rounded-lg border border-[#EAE4D7]">
            <h4 className="font-bold text-xs text-[#1B382B] mb-2">
              تسوية حساب: {selectedTailor.name} (المستحق له: {selectedTailor.balance} ج.م)
            </h4>
            <div className="flex gap-2 items-center flex-wrap">
              <input
                type="number"
                placeholder="المبلغ المراد صرفه"
                value={payoutAmount}
                onChange={e => setPayoutAmount(e.target.value)}
                className="w-36 p-2 text-xs border rounded font-bold"
              />
              <button
                onClick={() => payout('CASH')}
                className="bg-[#1B382B] text-[#C5A059] text-xs py-2 px-4 rounded font-bold"
              >
                💵 صرف نقدي من الخزنة
              </button>
              <button
                onClick={() => payout('FABRIC_OFFSET')}
                className="bg-[#C5A059] text-[#1B382B] text-xs py-2 px-4 rounded font-bold"
              >
                🧵 مقاصة أقمشة وبطانات لورشته
              </button>
            </div>
          </div>
        )}

        <div className="flex justify-end mt-4">
          <button onClick={onClose} className="bg-gray-200 text-gray-700 text-xs py-2 px-6 rounded font-bold">
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
}
