import test from 'node:test';
import assert from 'node:assert/strict';
import { metersToCm, formatCmToMeters, parseQuantityInput, parseMetersToCm } from '../measure/units.js';
import { calculateLineTotal, poundsToQirsh, formatQirshToPounds, splitEvenly, allocateByWeights } from '../measure/money.js';
import { suggestBoltCut } from '../bolt-buster/suggest-cut.js';
import { priceFabricLine } from '../pricing/line-pricing.js';
import { computeCartTotals } from '../pricing/cart-totals.js';
import { toCm, toQirsh, toQirshPerMeter } from '../../shared/types/units.js';
import type { Bolt } from '../../shared/types/bolt.js';

test('Units: Arabic numerals, commas, slang, and fractions parsing', () => {
  assert.equal(metersToCm(3.5), 350);
  assert.equal(metersToCm(0.25), 25);
  assert.equal(formatCmToMeters(toCm(350)), '3.5 م');

  assert.equal(parseQuantityInput('ربع'), 25);
  assert.equal(parseQuantityInput('نص'), 50);
  assert.equal(parseQuantityInput('متر وربع'), 125);
  assert.equal(parseQuantityInput('مترين'), 200);
  assert.equal(parseQuantityInput('جلابية'), 350);
  assert.equal(parseQuantityInput('طقم سرير'), 450);

  assert.equal(parseQuantityInput('٣.٥'), 350);
  assert.equal(parseQuantityInput('١.٢٥'), 125);

  assert.equal(parseQuantityInput('3,5'), 350);
  assert.equal(parseQuantityInput('3،5'), 350);

  assert.equal(parseQuantityInput('1/2'), 50);
  assert.equal(parseQuantityInput('1 1/2'), 150);

  const parsedStrict = parseMetersToCm('١٢٫٥');
  assert.equal(parsedStrict.ok, true);
  if (parsedStrict.ok) assert.equal(parsedStrict.value, 1250);
});

test('Money & BigInt Math: allocation and largest remainder method', () => {
  const length = toCm(350);
  const price = toQirshPerMeter(12000); // 120 جنيه
  const total = calculateLineTotal(length, price);
  assert.equal(total, 42000);
  assert.equal(formatQirshToPounds(total), '420.00 ج.م');

  // توزيع 100 قرش على 3 أوزان متساوية (1, 1, 1) -> 34, 33, 33
  const allocated = allocateByWeights(toQirsh(100), [10, 10, 10]);
  assert.deepEqual(allocated, [toQirsh(34), toQirsh(33), toQirsh(33)]);
  assert.equal(allocated.reduce((s, a) => s + Number(a), 0), 100);
});

test('Pricing & Cart Totals: discount distribution without penny loss', () => {
  const line1 = priceFabricLine({
    requestedCm: toCm(350), // 3.5 م
    unitPrice: toQirshPerMeter(10000), // 100 جنيه
    discount: toQirsh(2000) // خصم 20 جنيه
  });
  assert.equal(line1.gross, 35000);
  assert.equal(line1.net, 33000);

  const cartTotals = computeCartTotals([
    { gross: toQirsh(35000), lineDiscount: toQirsh(2000) }, // صافي 330.00
    { gross: toQirsh(15000), lineDiscount: toQirsh(0) }     // صافي 150.00
  ], toQirsh(3000)); // خصم عام 30 جنيه

  assert.equal(cartTotals.subtotal, 50000);
  assert.equal(cartTotals.discountTotal, 5000); // 20 + 30
  assert.equal(cartTotals.grandTotal, 45000);

  // مجموع حصص الخصم يطابق الخصم العام تماماً
  const shareSum = cartTotals.cartDiscountShare.reduce((s, x) => s + Number(x), 0);
  assert.equal(shareSum, 3000);
});

test('Bolt-Buster: prevents split cuts without consent & triggers upsell', () => {
  const mockBolts: Bolt[] = [
    {
      id: 1,
      productId: 10,
      dyeLotId: 101,
      barcode: 'BOLT-101',
      initialLengthCm: toCm(4000),
      remainingCm: toCm(420),
      status: 'ACTIVE',
      version: 1
    }
  ];

  const suggestion = suggestBoltCut(toCm(350), mockBolts, toCm(150));
  assert.equal(suggestion.canFulfill, true);
  assert.ok(suggestion.remnantUpsell, 'يجب تفعيل عرض إنهاء التوب');
  assert.equal(suggestion.remnantUpsell?.extraLengthCm, 70);

  const largeRequest = suggestBoltCut(toCm(500), mockBolts, toCm(150), false);
  assert.equal(largeRequest.canFulfill, false);
  assert.ok(largeRequest.warning?.includes('لا يمكن القص من توبين'));
});
