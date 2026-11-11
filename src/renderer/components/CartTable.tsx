import { boltLevel, type BoltLevel } from '../../shared/bolt-level';
import type { CartLine } from '../../shared/cashier-types';
import { effectiveQtyMm, lineNet, remainingAfterSaleMm } from '../cart.reducer';
import { fmtMeters, fmtMoney } from '../format';

/** الشريط اللوني + نص صريح، فلا يعتمد المعنى على اللون وحده. */
const LEVEL_STYLE: Record<BoltLevel, { strip: string; chip: string; label: string }> = {
  healthy: { strip: 'border-emerald-600', chip: 'bg-emerald-100 text-emerald-900', label: 'رصيد كافٍ' },
  low: { strip: 'border-yellow-400', chip: 'bg-yellow-100 text-yellow-900', label: 'رصيد قليل' },
  critical: { strip: 'border-orange-500', chip: 'bg-orange-100 text-orange-900', label: 'التوب على وشك الانتهاء' },
};

const STEP_MM = 250;

interface Props {
  readonly lines: readonly CartLine[];
  readonly activeKey: string | null;
  readonly onSelect: (key: string) => void;
  readonly onAdjust: (key: string, deltaMm: number) => void;
  readonly onRemove: (key: string) => void;
}

export function CartTable({ lines, activeKey, onSelect, onAdjust, onRemove }: Props) {
  if (lines.length === 0) {
    return (
      <div className="flex h-full items-center justify-center rounded-lg border-2 border-dashed border-gold/50 p-10 text-xl text-olive/70">
        السلة فارغة. اضغط F1 للبحث عن قماش.
      </div>
    );
  }

  return (
    <div className="overflow-auto rounded-lg border border-olive/15 bg-white">
      <table className="w-full text-start">
        <thead className="sticky top-0 bg-olive text-cream">
          <tr className="text-lg">
            <th className="px-4 py-3 text-start font-semibold">الصنف</th>
            <th className="px-4 py-3 text-start font-semibold">الكمية</th>
            <th className="px-4 py-3 text-start font-semibold">رصيد التوب بعد البيع</th>
            <th className="px-4 py-3 text-start font-semibold">سعر المتر</th>
            <th className="px-4 py-3 text-start font-semibold">الإجمالي</th>
            <th className="w-16 px-2 py-3" />
          </tr>
        </thead>
        <tbody>
          {lines.map((line) => {
            const remaining = remainingAfterSaleMm(line);
            const level = LEVEL_STYLE[boltLevel(remaining, line.boltLengthMm)];
            const active = line.key === activeKey;
            return (
              <tr
                key={line.key}
                onClick={() => onSelect(line.key)}
                aria-selected={active}
                className={`cursor-pointer border-b border-olive/10 border-s-8 text-xl ${level.strip} ${
                  active ? 'bg-gold/15' : 'hover:bg-cream'
                }`}
              >
                <td className="px-4 py-3 font-semibold text-olive">{line.name}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      aria-label="إنقاص ربع متر"
                      onClick={(e) => {
                        e.stopPropagation();
                        onAdjust(line.key, -STEP_MM);
                      }}
                      className="h-11 w-11 rounded-md bg-olive/10 text-2xl font-bold text-olive active:bg-olive/25"
                    >
                      −
                    </button>
                    <span className="min-w-24 text-center font-bold tabular-nums">{fmtMeters(effectiveQtyMm(line))}</span>
                    <button
                      type="button"
                      aria-label="زيادة ربع متر"
                      onClick={(e) => {
                        e.stopPropagation();
                        onAdjust(line.key, STEP_MM);
                      }}
                      className="h-11 w-11 rounded-md bg-olive/10 text-2xl font-bold text-olive active:bg-olive/25"
                    >
                      +
                    </button>
                  </div>
                  {line.bust && (
                    <div className="mt-1 text-sm text-olive/80">
                      منها {fmtMeters(line.bust.extraMm)} إضافية بخصم {fmtMoney(line.bust.discount)}
                    </div>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-3 py-1 text-base font-semibold ${level.chip}`}>
                    {fmtMeters(remaining)} · {level.label}
                  </span>
                </td>
                <td className="px-4 py-3 tabular-nums">{fmtMoney(line.unitPerMeter)}</td>
                <td className="px-4 py-3 font-bold tabular-nums text-olive">{fmtMoney(lineNet(line))}</td>
                <td className="px-2 py-3">
                  <button
                    type="button"
                    aria-label={`حذف ${line.name}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemove(line.key);
                    }}
                    className="h-11 w-11 rounded-md text-2xl text-red-700 hover:bg-red-50"
                  >
                    ×
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
