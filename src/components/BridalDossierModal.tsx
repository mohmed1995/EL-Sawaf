import { useState } from 'react';
import { play } from '../demo/sounds.js';

export interface BridalRoomItem {
  roomName: string;
  fabricName: string;
  meters: number;
  purpose: string; // الغرض (ملايات، ستائر، تنجيد، صالون)
}

export function BridalDossierModal({ onClose }: { onClose: () => void }) {
  const [brideName, setBrideName] = useState('كريمة الحاج رضوان - دشنا');
  const [items, setItems] = useState<BridalRoomItem[]>([
    { roomName: 'غرفة النوم الرئيسية', fabricName: 'قطن ملايات المحلة 240سم', meters: 18, purpose: '4 أطقم سرير كبير مع مخدات' },
    { roomName: 'غرفة النوم الرئيسية', fabricName: 'قطيفة ستائر كشمير رويال', meters: 12, purpose: 'ستائر درابيه وبلاك آوت' },
    { roomName: 'غرفة الأطفال والضيوف', fabricName: 'قطن ملايات أطفال مطبوع', meters: 14, purpose: '4 ملايات أطفال مقاس 120' },
    { roomName: 'الرسبشن والصالون', fabricName: 'قطيفة صالون تركي كود 42', meters: 24, purpose: 'تنجيد كامل لصالون مدهب' },
    { roomName: 'الرسبشن والصالون', fabricName: 'شيفون حرير سادة تركي', meters: 16, purpose: 'ستائر شيفون خفيف تحت القطيفة' }
  ]);

  const [newItem, setNewItem] = useState({ room: 'غرفة النوم', fabric: '', meters: '', purpose: '' });
  const [showSlip, setShowSlip] = useState(false);

  const totalMeters = items.reduce((sum, i) => sum + i.meters, 0);

  function addItem() {
    const m = parseFloat(newItem.meters);
    if (!newItem.fabric || !(m > 0)) return;
    setItems(prev => [...prev, {
      roomName: newItem.room,
      fabricName: newItem.fabric,
      meters: m,
      purpose: newItem.purpose || 'تفصيل وتنجيد'
    }]);
    setNewItem({ room: 'غرفة النوم', fabric: '', meters: '', purpose: '' });
    play('beep');
  }

  function printSlip() {
    play('success');
    window.print();
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full p-6 max-h-[90vh] overflow-y-auto border-2 border-[#C5A059]" dir="rtl">
        <div className="flex justify-between items-center border-b pb-3 mb-4">
          <div>
            <h2 className="text-xl font-bold text-[#1B382B] flex items-center gap-2">
              👰 ملف جهاز العروسة وقسيمة ورش التنجيد
            </h2>
            <p className="text-xs text-gray-500">حسابات مجمعة وقسائم رسمية لمنع سرقة أو نقص الأمتار في الورش</p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-black text-xl font-bold">✕</button>
        </div>

        {!showSlip ? (
          <div>
            <div className="bg-[#FAF8F4] p-3 rounded-lg border border-[#EAE4D7] mb-4 flex gap-4 items-center flex-wrap">
              <div className="flex-1 min-w-[240px]">
                <label className="text-xs font-bold text-gray-700 block mb-1">اسم العروس / العائلة:</label>
                <input
                  type="text"
                  value={brideName}
                  onChange={(e) => setBrideName(e.target.value)}
                  className="w-full p-2 border border-[#C5A059] rounded text-sm font-semibold"
                />
              </div>
              <div className="bg-white p-2 rounded border text-center px-4">
                <span className="text-xs text-gray-500 block">إجمالي أمتار الجهاز</span>
                <span className="text-lg font-bold text-[#1B382B]">{totalMeters} متر</span>
              </div>
            </div>

            <h3 className="font-bold text-sm text-[#1B382B] mb-2">أقمشة غرف الجهاز المسجلة:</h3>
            <div className="overflow-x-auto mb-4 border rounded">
              <table className="w-full text-right text-xs">
                <thead className="bg-[#1B382B] text-white">
                  <tr>
                    <th className="p-2">الغرفة</th>
                    <th className="p-2">نوع القماش</th>
                    <th className="p-2">الأمتار</th>
                    <th className="p-2">الغرض وملاحظات التفصيل</th>
                    <th className="p-2"></th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {items.map((it, idx) => (
                    <tr key={idx} className="hover:bg-amber-50/50">
                      <td className="p-2 font-medium">{it.roomName}</td>
                      <td className="p-2">{it.fabricName}</td>
                      <td className="p-2 font-bold text-emerald-800">{it.meters} م</td>
                      <td className="p-2 text-gray-600">{it.purpose}</td>
                      <td className="p-2 text-center">
                        <button
                          onClick={() => {
                            setItems(items.filter((_, i) => i !== idx));
                            play('remove');
                          }}
                          className="text-red-600 hover:text-red-900 font-bold"
                        >
                          ✕
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* إضافة بند جديد */}
            <div className="bg-[#FAF8F4] p-3 rounded-lg border border-[#EAE4D7] flex gap-2 flex-wrap items-end mb-4">
              <div className="flex-1 min-w-[130px]">
                <label className="text-xs font-semibold block mb-1">الغرفة:</label>
                <select
                  value={newItem.room}
                  onChange={e => setNewItem({ ...newItem, room: e.target.value })}
                  className="w-full p-2 border rounded text-xs"
                >
                  <option>غرفة النوم الرئيسية</option>
                  <option>غرفة الأطفال والضيوف</option>
                  <option>الرسبشن والصالون</option>
                  <option>المعيشة والأنتريه</option>
                </select>
              </div>
              <div className="flex-1 min-w-[160px]">
                <label className="text-xs font-semibold block mb-1">اسم القماش:</label>
                <input
                  type="text"
                  placeholder="مثال: قطيفة كشمير"
                  value={newItem.fabric}
                  onChange={e => setNewItem({ ...newItem, fabric: e.target.value })}
                  className="w-full p-2 border rounded text-xs"
                />
              </div>
              <div className="w-[80px]">
                <label className="text-xs font-semibold block mb-1">الأمتار:</label>
                <input
                  type="number"
                  placeholder="متر"
                  value={newItem.meters}
                  onChange={e => setNewItem({ ...newItem, meters: e.target.value })}
                  className="w-full p-2 border rounded text-xs font-bold"
                />
              </div>
              <div className="flex-1 min-w-[140px]">
                <label className="text-xs font-semibold block mb-1">الغرض:</label>
                <input
                  type="text"
                  placeholder="مثال: ستائر درابيه"
                  value={newItem.purpose}
                  onChange={e => setNewItem({ ...newItem, purpose: e.target.value })}
                  className="w-full p-2 border rounded text-xs"
                />
              </div>
              <button onClick={addItem} className="bg-[#1B382B] text-[#C5A059] py-2 px-4 rounded text-xs font-bold">
                + إضافة قماش
              </button>
            </div>

            <div className="flex justify-between items-center pt-2">
              <button
                onClick={() => setShowSlip(true)}
                className="bg-[#C5A059] text-[#1B382B] font-bold py-2 px-6 rounded-lg text-sm shadow hover:bg-[#b59049]"
              >
                📜 إصدار قسيمة تسليم الورش الرسمية (Packing Slip)
              </button>
              <button onClick={onClose} className="text-gray-500 text-xs py-2 px-4">إلغاء</button>
            </div>
          </div>
        ) : (
          /* قسيمة ورش التنجيد والتفصيل الرسمية */
          <div>
            <div className="border-4 border-double border-[#1B382B] p-6 bg-white mb-4 rounded-lg">
              <div className="text-center border-b pb-3 mb-4">
                <h1 className="text-xl font-bold text-[#1B382B]">منظومة الصواف للأقمشة والمفروشات</h1>
                <h2 className="text-sm font-semibold text-[#C5A059]">قسيمة استلام رسمية لورش التفصيل والتنجيد (Fabric Packing Slip)</h2>
                <div className="text-xs text-gray-500 mt-1">تُسلم للخياط / المنجد مع القماش لبيان وتوثيق الأمتار المصروفة</div>
              </div>

              <div className="flex justify-between text-xs mb-3 font-semibold bg-gray-50 p-2 border">
                <div>الجهة المصروف لها: جهاز {brideName}</div>
                <div>تاريخ التحرير: {new Date().toLocaleDateString('ar-EG')}</div>
              </div>

              <table className="w-full text-right text-xs border border-gray-400 mb-4">
                <thead className="bg-gray-100 border-b border-gray-400">
                  <tr>
                    <th className="p-2 border">م</th>
                    <th className="p-2 border">الغرفة</th>
                    <th className="p-2 border">بيان القماش والخامة</th>
                    <th className="p-2 border">الأمتار المقصوصة</th>
                    <th className="p-2 border">الغرض المطلوب تنفيذه</th>
                    <th className="p-2 border">توقيع المستلم</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((it, i) => (
                    <tr key={i} className="border-b">
                      <td className="p-2 border text-center">{i + 1}</td>
                      <td className="p-2 border font-medium">{it.roomName}</td>
                      <td className="p-2 border">{it.fabricName}</td>
                      <td className="p-2 border font-bold text-center">{it.meters} متر</td>
                      <td className="p-2 border">{it.purpose}</td>
                      <td className="p-2 border text-center text-gray-400">..................</td>
                    </tr>
                  ))}
                  <tr className="bg-gray-50 font-bold">
                    <td colSpan={3} className="p-2 border text-left">إجمالي الأمتار المصروفة للورش:</td>
                    <td className="p-2 border text-center text-emerald-800 text-sm">{totalMeters} متر</td>
                    <td colSpan={2} className="p-2 border"></td>
                  </tr>
                </tbody>
              </table>

              <div className="text-xs text-gray-700 bg-amber-50 p-2 border border-amber-300 rounded mb-4">
                <b>تنبيه هام للورش:</b> تم قياس وقص هذا القماش بواسطة شريط إلكتروني معتمد من محل الصواف. أي ادعاء بنقص الأمتار بعد توقيع الاستلام لا يُعتد به.
              </div>

              <div className="flex justify-between text-xs font-bold pt-4 border-t">
                <div>ختم وتوقيع محل الصواف:<br/><br/>(معتمد ومختوم)</div>
                <div>توقيع المنجد / الترزي المستلم:<br/><br/>...................................</div>
                <div>توقيع ولي أمر العروس:<br/><br/>...................................</div>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <button onClick={printSlip} className="bg-emerald-700 text-white font-bold py-2 px-6 rounded text-sm hover:bg-emerald-800">
                🖨 طباعة القسيمة فوراً
              </button>
              <button onClick={() => setShowSlip(false)} className="text-gray-700 text-xs py-2 px-4 border rounded">
                رجوع للتعديل
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
