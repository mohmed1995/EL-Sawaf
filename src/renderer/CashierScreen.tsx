import { useCallback, useEffect, useMemo, useState } from 'react';
import type { CashierApi, CheckoutRequest, CustomerHit, PaymentMethod, ProductHit, SfxEvent } from '../shared/cashier-types';
import { BoltBusterAlert } from './components/BoltBusterAlert';
import { CartTable } from './components/CartTable';
import { LookupPanel } from './components/LookupPanel';
import { QuickPad } from './components/QuickPad';
import { fmtMeters, fmtMoney } from './format';
import { useCashier } from './useCashier';
import { useHeldInvoices } from './useHeldInvoices';
import { useHotkeys } from './useHotkeys';

type Panel = 'none' | 'product' | 'customer';
type Notice = { readonly kind: 'ok' | 'error'; readonly text: string };

interface Props {
  readonly api?: CashierApi;
  readonly sfx?: (event: SfxEvent) => void;
}

const noopSfx = (): void => undefined;
const NOTICE_MS = 5000;

export function CashierScreen({ api = window.sawwaf.cashier, sfx = noopSfx }: Props) {
  const c = useCashier(api, sfx);
  const { held, hold, take } = useHeldInvoices();
  const [panel, setPanel] = useState<Panel>('none');
  const [customer, setCustomer] = useState<CustomerHit | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [dismissed, setDismissed] = useState<ReadonlySet<string>>(new Set());

  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(null), NOTICE_MS);
    return () => clearTimeout(t);
  }, [notice]);

  const fail = useCallback(
    (text: string) => {
      sfx('error');
      setNotice({ kind: 'error', text });
    },
    [sfx],
  );

  const isEmpty = c.cart.lines.length === 0;

  /* ---------- الدفع ---------- */
  const checkout = useCallback(
    async (method: PaymentMethod) => {
      if (busy) return;
      if (isEmpty) return fail('السلة فارغة.');
      if (method === 'credit' && !customer) {
        setPanel('customer');
        return fail('اختر العميل أولاً لتسجيل الفاتورة آجل.');
      }
      const request: CheckoutRequest = {
        method,
        customerId: customer?.id ?? null,
        lines: c.cart.lines.map((l) => ({ productId: l.productId, boltId: l.boltId, qtyMm: l.qtyMm, acceptBust: l.bust !== null })),
      };
      setBusy(true);
      try {
        const result = await api.checkout(request);
        if (result.ok) {
          sfx('checkout');
          setNotice({ kind: 'ok', text: `تم حفظ الفاتورة رقم ${result.invoiceId} بإجمالي ${fmtMoney(result.total)}` });
          c.clear();
          setCustomer(null);
          setDismissed(new Set());
        } else {
          fail(result.message);
        }
      } catch {
        fail('تعذر حفظ الفاتورة. لم يُخصم شيء من المخزون، حاول مرة أخرى.');
      } finally {
        setBusy(false);
      }
    },
    [api, busy, c, customer, fail, isEmpty, sfx],
  );

  const holdInvoice = useCallback(() => {
    if (isEmpty) return fail('لا توجد فاتورة لتجميدها.');
    hold(c.cart, customer);
    c.clear();
    setCustomer(null);
    sfx('hold');
    setNotice({ kind: 'ok', text: 'تم تجميد الفاتورة. استرجعها من قائمة الفواتير المجمدة.' });
  }, [c, customer, fail, hold, isEmpty, sfx]);

  const recall = useCallback(
    (id: string) => {
      if (!isEmpty) return fail('أنهِ الفاتورة الحالية أو جمّدها أولاً.');
      const invoice = take(id);
      if (!invoice) return;
      c.restore(invoice.cart);
      setCustomer(invoice.customer);
    },
    [c, fail, isEmpty, take],
  );

  useHotkeys({
    F1: () => setPanel('product'),
    F2: () => setPanel('customer'),
    F4: holdInvoice,
    F9: () => void checkout('credit'),
    F12: () => void checkout('cash'),
  });

  /* ---------- عرض Bolt-Buster الظاهر الآن ---------- */
  const visibleOffer = useMemo(() => {
    for (const line of c.cart.lines) {
      const offer = c.offers.get(line.key);
      if (offer && !dismissed.has(`${line.key}:${line.qtyMm}`)) return { line, offer };
    }
    return null;
  }, [c.cart.lines, c.offers, dismissed]);

  const pickProduct = (hit: ProductHit): void => {
    c.addProduct(hit);
    setPanel('none');
  };

  const activeLine = c.cart.lines.find((l) => l.key === c.cart.activeKey);

  return (
    <div dir="rtl" lang="ar" className="flex h-screen flex-col bg-cream font-sans text-olive">
      <header className="flex items-center justify-between bg-olive px-6 py-3 text-cream">
        <h1 className="text-3xl font-extrabold text-gold">الصواف</h1>
        <nav aria-label="اختصارات لوحة المفاتيح" className="flex gap-2 text-base">
          {[
            ['F1', 'بحث', () => setPanel('product')],
            ['F2', 'عميل', () => setPanel('customer')],
            ['F4', 'تجميد', holdInvoice],
            ['F9', 'آجل', () => void checkout('credit')],
            ['F12', 'كاش', () => void checkout('cash')],
          ].map(([key, label, run]) => (
            <button
              key={key as string}
              type="button"
              onClick={run as () => void}
              className="rounded-md border border-gold/50 px-3 py-1 hover:bg-cream/10"
            >
              <kbd className="font-bold text-gold">{key as string}</kbd> {label as string}
            </button>
          ))}
        </nav>
      </header>

      {notice && (
        <div
          role={notice.kind === 'error' ? 'alert' : 'status'}
          className={`px-6 py-3 text-lg font-semibold ${notice.kind === 'error' ? 'bg-red-100 text-red-900' : 'bg-emerald-100 text-emerald-900'}`}
        >
          {notice.text}
        </div>
      )}

      <main className="grid min-h-0 flex-1 grid-cols-[1fr_22rem] gap-5 p-5">
        <section className="flex min-h-0 flex-col gap-4">
          {visibleOffer && (
            <BoltBusterAlert
              line={visibleOffer.line}
              offer={visibleOffer.offer}
              onAccept={c.acceptBust}
              onDismiss={() => setDismissed((s) => new Set(s).add(`${visibleOffer.line.key}:${visibleOffer.line.qtyMm}`))}
            />
          )}
          <div className="min-h-0 flex-1">
            <CartTable
              lines={c.cart.lines}
              activeKey={c.cart.activeKey}
              onSelect={c.setActive}
              onAdjust={c.adjustLine}
              onRemove={c.removeLine}
            />
          </div>
          {held.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 rounded-lg bg-white p-3">
              <span className="font-semibold">فواتير مجمدة:</span>
              {held.map((h) => (
                <button
                  key={h.id}
                  type="button"
                  onClick={() => recall(h.id)}
                  className="rounded-md border border-gold px-3 py-2 text-base hover:bg-gold/15"
                >
                  {h.customer?.name ?? 'بدون عميل'} · {h.cart.lines.length} صنف
                </button>
              ))}
            </div>
          )}
        </section>

        <aside className="flex min-h-0 flex-col gap-4 overflow-auto">
          <button
            type="button"
            onClick={() => setPanel('customer')}
            className="rounded-lg border-2 border-olive/20 bg-white px-4 py-3 text-start text-lg hover:border-gold"
          >
            <span className="block text-sm text-olive/60">العميل (F2)</span>
            <span className="font-bold">{customer ? customer.name : 'عميل نقدي'}</span>
          </button>

          <QuickPad disabled={!activeLine} onPress={c.adjustActive} />

          <div className="mt-auto rounded-xl bg-olive p-5 text-cream">
            <dl className="space-y-1 text-lg">
              <div className="flex justify-between">
                <dt>الإجمالي قبل الخصم</dt>
                <dd className="tabular-nums">{fmtMoney(c.totals.gross)}</dd>
              </div>
              <div className="flex justify-between">
                <dt>خصم إنهاء التوب</dt>
                <dd className="tabular-nums">− {fmtMoney(c.totals.discount)}</dd>
              </div>
            </dl>
            <p className="mt-3 text-sm text-cream/70">المطلوب دفعه</p>
            <p className="text-4xl font-extrabold tabular-nums text-gold">{fmtMoney(c.totals.net)}</p>
            {activeLine && <p className="mt-2 text-sm text-cream/70">الصنف المحدد: {activeLine.name} · {fmtMeters(activeLine.qtyMm)}</p>}
            <div className="mt-4 grid grid-cols-2 gap-3">
              <button
                type="button"
                disabled={busy || isEmpty}
                onClick={() => void checkout('credit')}
                className="min-h-16 rounded-lg border-2 border-gold text-xl font-bold text-gold disabled:opacity-40"
              >
                آجل (F9)
              </button>
              <button
                type="button"
                disabled={busy || isEmpty}
                onClick={() => void checkout('cash')}
                className="min-h-16 rounded-lg bg-gold text-xl font-extrabold text-olive disabled:opacity-40"
              >
                كاش (F12)
              </button>
            </div>
          </div>
        </aside>
      </main>

      {panel === 'product' && (
        <LookupPanel<ProductHit>
          title="بحث عن قماش"
          placeholder="اكتب اسم القماش أو الكود"
          search={api.searchProducts}
          itemKey={(p) => p.boltId}
          renderItem={(p) => (
            <div className="flex justify-between gap-4">
              <span className="font-semibold">{p.name}</span>
              <span className="text-olive/70">
                {fmtMoney(p.unitPerMeter)} للمتر · المتاح {fmtMeters(p.boltRemainingMm)}
              </span>
            </div>
          )}
          onPick={pickProduct}
          onClose={() => setPanel('none')}
        />
      )}

      {panel === 'customer' && (
        <LookupPanel<CustomerHit>
          title="اختيار العميل"
          placeholder="اسم العميل أو رقم الموبايل"
          search={api.searchCustomers}
          itemKey={(x) => x.id}
          renderItem={(x) => (
            <div className="flex justify-between">
              <span className="font-semibold">{x.name}</span>
              <span className="text-olive/70">{x.phone ?? ''}</span>
            </div>
          )}
          onPick={(x) => {
            setCustomer(x);
            setPanel('none');
          }}
          onClose={() => setPanel('none')}
        />
      )}
    </div>
  );
}
