import { toCm, type Cm } from '../../shared/types/units.js';

export type ParseResult =
  | { ok: true; value: Cm }
  | { ok: false; reason: 'EMPTY' | 'FORMAT' | 'TOO_PRECISE' | 'TOO_LARGE' };

const AR_INDIC = '٠١٢٣٤٥٦٧٨٩';
const FA_INDIC = '۰۱۲۳۴۵۶۷۸۹';

/**
 * يوحّد الأرقام الهندية/الفارسية والفواصل العربية والإنجليزية إلى صيغة ASCII
 */
export function normalizeNumeric(input: string): string {
  return input
    .replace(/[٠-٩]/g, (d) => String(AR_INDIC.indexOf(d)))
    .replace(/[۰-۹]/g, (d) => String(FA_INDIC.indexOf(d)))
    .replace(/[٫,،]/g, '.') // الفاصلة تعامل كفاصلة عشرية
    .trim();
}

/**
 * تفسير المتر إلى سنتيمتر مع التحقق الصارم من الدقة
 * "12.5" | "١٢٫٥" | "12,50" -> 1250 سم
 */
export function parseMetersToCm(input: string): ParseResult {
  const s = normalizeNumeric(input);
  if (s === '') return { ok: false, reason: 'EMPTY' };

  const m = /^(\d*)(?:\.(\d*))?$/.exec(s);
  if (!m) return { ok: false, reason: 'FORMAT' };

  const intPart = m[1] ?? '';
  const fracRaw = m[2] ?? '';
  if (intPart === '' && fracRaw === '') return { ok: false, reason: 'FORMAT' };

  const frac = fracRaw.replace(/0+$/, '');
  if (frac.length > 2) return { ok: false, reason: 'TOO_PRECISE' };
  if (intPart.replace(/^0+/, '').length > 6) return { ok: false, reason: 'TOO_LARGE' };

  const meters = intPart === '' ? 0 : Number(intPart);
  const centi = Number(frac.padEnd(2, '0'));
  return { ok: true, value: toCm(meters * 100 + centi) };
}

/**
 * تحويل السنتيمتر إلى صيغة أمتار قابلة للعرض
 * 1250 سم -> "12.50" أو "12.5"
 */
export function formatCmAsMeters(value: Cm, opts: { trim?: boolean } = {}): string {
  const n = value as number;
  if (n < 0) return '-' + formatCmAsMeters(toCm(-n), opts);
  const whole = Math.floor(n / 100);
  const frac = String(n % 100).padStart(2, '0');
  if (!opts.trim) return `${whole}.${frac}`;
  const t = frac.replace(/0+$/, '');
  return t === '' ? String(whole) : `${whole}.${t}`;
}

/**
 * مفسر إدخال الكاشير الذكي: يدمج الدقة العددية الصارمة مع المصطلحات التجارية الصعيدية
 */
export function parseQuantityInput(input: string): Cm {
  if (!input || !input.trim()) throw new Error('الكمية لا يمكن أن تكون فارغة');

  const clean = normalizeNumeric(input);

  // المصطلحات والقصات الصعيدية الدارجة
  const slangMap: Record<string, number> = {
    'ربع': 25,
    'نص': 50,
    'نصف': 50,
    'تلت': 33,
    'تلات اربع': 75,
    'ثلاثة ارباع': 75,
    'إلا ربع': 75,
    'متر': 100,
    'متر وربع': 125,
    'متر ونص': 150,
    'مترين': 200,
    'جلابية': 350,
    'جلابيه': 350,
    'جلابية بلدي': 350,
    'طقم سرير': 450
  };

  const rawTrimmed = input.trim();
  if (slangMap[rawTrimmed]) {
    return toCm(slangMap[rawTrimmed]);
  }

  // الكسور مثل 1/2 أو 3/4 أو 1 1/2
  if (clean.includes('/')) {
    const parts = clean.split(/\s+/);
    let totalMeters = 0;
    for (const part of parts) {
      if (part.includes('/')) {
        const [num, den] = part.split('/').map(Number);
        if (den && !isNaN(num) && !isNaN(den)) {
          totalMeters += num / den;
        }
      } else {
        const whole = Number(part);
        if (!isNaN(whole)) totalMeters += whole;
      }
    }
    if (totalMeters > 0) return toCm(Math.round(totalMeters * 100));
  }

  const parsed = parseMetersToCm(clean);
  if (parsed.ok) {
    return parsed.value;
  }

  throw new Error(`قيمة الكمية غير صحيحة: "${input}" (${parsed.reason})`);
}

export function metersToCm(meters: number): Cm {
  if (meters < 0) throw new RangeError('طول القماش لا يمكن أن يكون سالباً');
  return toCm(Math.round(meters * 100));
}

export function formatCmToMeters(lengthCm: Cm): string {
  return `${formatCmAsMeters(lengthCm, { trim: true })} م`;
}
