import { toQirsh, type Qirsh, type Cm, type QirshPerMeter } from '../../shared/types/units.js';
import { InvalidMoneyError } from '../errors.js';

function assertInt(n: number, name: string) {
  if (!Number.isSafeInteger(n)) {
    throw new InvalidMoneyError(`${name} يجب أن يكون عدداً صحيحاً آمناً: ${n}`);
  }
}

/**
 * دالة الضرب والقسمة مع التقريب القياسي بدقة BigInt تامة (Zero Float Drift)
 * المعادلة: round_half_up(a * b / d)
 */
export function mulDivRoundHalfUp(a: number, b: number, d: number): number {
  assertInt(a, 'a');
  assertInt(b, 'b');
  assertInt(d, 'd');
  if (d <= 0) throw new InvalidMoneyError('المقسوم عليه يجب أن يكون أكبر من الصفر');

  const num = BigInt(a) * BigInt(b);
  const neg = num < 0n;
  const abs = neg ? -num : num;
  const D = BigInt(d);
  const q = (2n * abs + D) / (2n * D); // floor(abs/D + 1/2)
  const res = neg ? -q : q;

  if (res > BigInt(Number.MAX_SAFE_INTEGER) || res < BigInt(Number.MIN_SAFE_INTEGER)) {
    throw new InvalidMoneyError('النتيجة تتجاوز الحد الأقصى للأعداد الصحيحة الآمنة');
  }

  return Number(res);
}

/**
 * حساب إجمالي السطر بدقة القرش الصارمة وبدون فواصل عشرية
 * المعادلة: (السنتيمتر * سعر المتر بالقرش) / 100
 */
export function calculateLineTotal(
  lengthCm: Cm,
  pricePerMeter: QirshPerMeter,
  discountQirsh: Qirsh = toQirsh(0)
): Qirsh {
  const gross = mulDivRoundHalfUp(Number(lengthCm), Number(pricePerMeter), 100);
  const net = Math.max(0, gross - Number(discountQirsh));
  return toQirsh(net);
}

/**
 * تقسيم مبلغ إجمالي بالتساوي على عدد من الأقساط دون فقدان أي قرش
 */
export function splitEvenly(total: Qirsh, parts: number): Qirsh[] {
  const t = Number(total);
  assertInt(t, 'total');
  assertInt(parts, 'parts');
  if (t < 0) throw new InvalidMoneyError('المبلغ لا يمكن أن يكون سالباً');
  if (parts <= 0) throw new RangeError('عدد الأقساط يجب أن يكون أكبر من الصفر');

  const base = Math.floor(t / parts);
  const remainder = t % parts;

  const result: Qirsh[] = [];
  for (let i = 0; i < parts; i++) {
    const extra = i < remainder ? 1 : 0;
    result.push(toQirsh(base + extra));
  }
  return result;
}

/**
 * توزيع مبلغ على أوزان بطريقة أكبر باقي (Largest Remainder Method)
 * تضمن أن مجموع الأجزاء الموزعة يطابق الأصل 100% دون زيادة أو نقص قرش واحد
 */
export function allocateByWeights(total: Qirsh, weights: readonly number[]): Qirsh[] {
  const totalNum = Number(total);
  assertInt(totalNum, 'total');
  if (totalNum < 0) throw new InvalidMoneyError('المبلغ لا يمكن أن يكون سالباً');
  if (weights.length === 0) throw new InvalidMoneyError('قائمة الأوزان فارغة');

  for (const w of weights) {
    assertInt(w, 'weight');
    if (w < 0) throw new InvalidMoneyError('الأوزان لا يمكن أن تكون سالبة');
  }

  const W = weights.reduce((s, w) => s + BigInt(w), 0n);
  if (W === 0n) throw new InvalidMoneyError('مجموع الأوزان يجب أن يكون أكبر من الصفر');

  const T = BigInt(totalNum);
  const parts = weights.map((w, i) => {
    const prod = T * BigInt(w);
    return { i, floor: prod / W, rem: prod % W };
  });

  let left = Number(T - parts.reduce((s, p) => s + p.floor, 0n));
  const order = [...parts].sort((a, b) =>
    a.rem === b.rem ? a.i - b.i : a.rem > b.rem ? -1 : 1
  );

  const out = parts.map((p) => Number(p.floor));
  for (const p of order) {
    if (left === 0) break;
    if (weights[p.i] === 0) continue;
    out[p.i] += 1;
    left -= 1;
  }

  return out.map((n) => toQirsh(n));
}

export function poundsToQirsh(pounds: number): Qirsh {
  if (pounds < 0) throw new RangeError('المبلغ لا يمكن أن يكون سالباً');
  return toQirsh(Math.round(pounds * 100));
}

export function formatQirshToPounds(amountQirsh: Qirsh): string {
  const pounds = (amountQirsh / 100).toFixed(2);
  return `${pounds} ج.م`;
}
