import type { BoltBusterOffer, CartLine } from '../../shared/cashier-types';
import { fmtMeters, fmtMoney } from '../format';

interface Props {
  readonly line: CartLine;
  readonly offer: BoltBusterOffer;
  readonly onAccept: (offer: BoltBusterOffer) => void;
  readonly onDismiss: () => void;
}

/** إشعار إنهاء التوب: يعرض الباقي والخصم، والموافقة بضغطة واحدة. */
export function BoltBusterAlert({ line, offer, onAccept, onDismiss }: Props) {
  return (
    <div role="alert" className="flex flex-wrap items-center gap-4 rounded-lg border-2 border-gold bg-olive px-5 py-4 text-cream shadow-lg">
      <div className="min-w-64 flex-1">
        <p className="text-xl font-bold text-gold">فرصة لإنهاء التوب</p>
        <p className="mt-1 text-lg">
          {line.name}: لو العميل أخد الباقي ({fmtMeters(offer.extraMm)}) يخلص التوب، والخصم {fmtMoney(offer.discount)}.
        </p>
      </div>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => onAccept(offer)}
          className="min-h-14 rounded-lg bg-gold px-6 text-xl font-bold text-olive active:brightness-90"
        >
          قبول الخصم
        </button>
        <button
          type="button"
          onClick={onDismiss}
          className="min-h-14 rounded-lg border border-cream/40 px-5 text-lg active:bg-cream/10"
        >
          لا، كمّل
        </button>
      </div>
    </div>
  );
}
