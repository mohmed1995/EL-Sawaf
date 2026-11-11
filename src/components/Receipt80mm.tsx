import type { Invoice } from '../demo/mockApi.js';

const C39: Record<string, string> = {
  '0': 'nnnwwnwnn', '1': 'wnnwnnnnw', '2': 'nnwwnnnnw', '3': 'wnwwnnnnn', '4': 'nnnwwnnnw',
  '5': 'wnnwwnnnn', '6': 'nnwwwnnnn', '7': 'nnnwnnwnw', '8': 'wnnwnnwnn', '9': 'nnwwnnwnn', '*': 'nwnnwnwnn',
};

function Barcode({ value, h = 40 }: { value: string; h?: number }) {
  let x = 0;
  const bars: JSX.Element[] = [];
  for (const ch of `*${value}*`) {
    const pattern = C39[ch] || C39['0'];
    [...pattern].forEach((e, i) => {
      const w = e === 'w' ? 3 : 1;
      if (i % 2 === 0) bars.push(<rect key={`${x}-${i}`} x={x} y={0} width={w} height={h} fill="#000" />);
      x += w;
    });
    x += 1;
  }
  return <svg viewBox={`0 0 ${x} ${h}`} width="100%" height={h} preserveAspectRatio="none">{bars}</svg>;
}

const f = (n: number) => n.toLocaleString('ar-EG', { maximumFractionDigits: 2 });

export function Receipt80mm({
  inv,
  shop = 'أقمشة ومفروشات الصواف',
  shopPhone = '0100 234 5678'
}: {
  inv: Invoice;
  shop?: string;
  shopPhone?: string;
}) {
  const msg = `فاتورة رقم ${inv.no} من ${shop}\nالإجمالي: ${inv.total} ج.م\nالمتبقي: ${inv.remaining} ج.م\nشكراً لتعاملكم معنا ولبس الهناء والعافية 🧵`;
  const wa = inv.customer.phone ? `https://wa.me/${inv.customer.phone}?text=${encodeURIComponent(msg)}` : '';

  return (
    <div className="receipt text-black bg-white p-4 font-mono text-sm leading-relaxed" dir="rtl">
      <div className="text-center font-bold text-lg">✂ {shop} ✂</div>
      <div className="text-center text-xs text-gray-700">هاتف: {shopPhone}</div>
      <hr className="my-2 border-dashed border-gray-400" />
      <div className="flex justify-between text-xs">
        <span>فاتورة #{inv.no}</span>
        <span>{inv.date}</span>
      </div>
      <div className="text-xs font-semibold mt-1">العميل: {inv.customer.name}</div>
      {inv.tailor && inv.tailor.id !== 't0' && (
        <div className="text-xs text-gray-800">الترزي المعتمد: {inv.tailor.name}</div>
      )}
      <hr className="my-2 border-dashed border-gray-400" />
      <table className="w-full text-right text-xs">
        <thead>
          <tr className="border-b border-gray-300">
            <th className="py-1">الصنف / التوب</th>
            <th>متر</th>
            <th>سعر</th>
            <th>إجمالي</th>
          </tr>
        </thead>
        <tbody>
          {inv.lines.map((l, i) => (
            <tr key={i} className="border-b border-gray-100">
              <td className="py-1 font-medium">
                {l.name}
                <div className="text-[10px] text-gray-500">توب: {l.rollId}</div>
              </td>
              <td>{f(l.meters)}</td>
              <td>{f(l.price)}</td>
              <td>{f(l.meters * l.price)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <hr className="my-2 border-dashed border-gray-400" />
      <div className="flex justify-between font-bold text-base">
        <span>الإجمالي</span>
        <span>{f(inv.total)} ج.م</span>
      </div>
      <div className="flex justify-between text-xs mt-1">
        <span>المدفوع نقداً</span>
        <span>{f(inv.paid)} ج.م</span>
      </div>
      {inv.remaining > 0 && (
        <div className="flex justify-between border-2 border-black p-1 my-1 font-bold text-xs bg-gray-50">
          <span>آجل (متبقي على الحساب)</span>
          <span>{f(inv.remaining)} ج.م</span>
        </div>
      )}
      <hr className="my-2 border-dashed border-gray-400" />
      <div className="my-2 text-center">
        <Barcode value={inv.no.padStart(6, '0')} />
        <div className="text-[10px] text-gray-500">{inv.no.padStart(6, '0')}</div>
      </div>
      {wa && (
        <div className="text-center text-xs my-1">
          واتساب العميل: <a href={wa} target="_blank" rel="noreferrer" className="text-blue-700 underline font-semibold">إرسال الفاتورة 📲</a>
        </div>
      )}
      <div className="text-center text-[11px] text-gray-700 mt-2">البضاعة المقصوصة لا تُرد ولا تُستبدل</div>
      <div className="text-center text-[11px] font-bold mt-1">نسعد بزيارتكم دائماً ❤</div>
    </div>
  );
}
