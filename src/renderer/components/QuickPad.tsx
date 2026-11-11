import type { Mm } from '../../shared/cashier-types';

export interface PadButton {
  readonly label: string;
  readonly deltaMm: Mm;
}

/** قصات الصعيد الجاهزة. راجع أطوال السديري وطقم السرير مع صاحب المحل قبل الإطلاق. */
export const FRACTION_BUTTONS: readonly PadButton[] = [
  { label: '+ ربع', deltaMm: 250 },
  { label: '+ نص', deltaMm: 500 },
  { label: '+ متر', deltaMm: 1000 },
  { label: '− ربع', deltaMm: -250 },
];

export const CUT_PRESETS: readonly PadButton[] = [
  { label: 'جلابية بلدي ٣٫٥م', deltaMm: 3500 },
  { label: 'سديري ١٫٥م', deltaMm: 1500 },
  { label: 'طقم سرير ٦م', deltaMm: 6000 },
];

interface Props {
  readonly disabled: boolean;
  readonly onPress: (deltaMm: Mm) => void;
}

const BASE = 'min-h-16 rounded-lg px-3 text-xl font-bold transition active:scale-95 disabled:opacity-40';

export function QuickPad({ disabled, onPress }: Props) {
  return (
    <section aria-label="لوحة القصات السريعة" className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        {FRACTION_BUTTONS.map((b) => (
          <button
            key={b.label}
            type="button"
            disabled={disabled}
            onClick={() => onPress(b.deltaMm)}
            className={`${BASE} ${b.deltaMm < 0 ? 'bg-olive/10 text-olive' : 'bg-olive text-cream'}`}
          >
            {b.label}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-3">
        {CUT_PRESETS.map((b) => (
          <button
            key={b.label}
            type="button"
            disabled={disabled}
            onClick={() => onPress(b.deltaMm)}
            className={`${BASE} border-2 border-gold bg-white text-olive`}
          >
            {b.label}
          </button>
        ))}
      </div>
    </section>
  );
}
