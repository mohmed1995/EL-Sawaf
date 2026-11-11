import test from 'node:test';
import assert from 'node:assert/strict';
import { PosController } from '../pos-controller.js';
import { toCm } from '../../shared/types/units.js';
import type { Bolt } from '../../shared/types/bolt.js';
import type { FabricCartLine } from '../../shared/types/cart.js';

test('PosController: complete cashier workflow with Bolt-Buster and Sound triggers', () => {
  const pos = new PosController();

  const mockProduct = {
    id: 1,
    name: 'صوف إنجليزي كحلي فاخر',
    pricePerMeterQirsh: 20000 // 200 جنيه للمتر
  };

  const mockBolts: Bolt[] = [{
    id: 101,
    productId: 1,
    dyeLotId: 501,
    barcode: 'BOLT-WOOL-01',
    initialLengthCm: toCm(4000), // 40 متر
    remainingCm: toCm(420),      // 4.2 متر متبقي
    status: 'ACTIVE',
    version: 1
  }];

  // 1. الكاشير يطلب تفصيل "جلابية بلدي" (350 سم)
  pos.addFabricCut(mockProduct, mockBolts, 'جلابية بلدي');

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ctrl = pos as any;
  assert.equal(ctrl.state.cart.lines.length, 1);
  assert.equal(ctrl.state.cart.grandTotal, 70000); // 3.5 م * 200 ج = 700 ج = 70000 قرش

  // المتبقي في التوب 70 سم، الخوارزمية أطلقت عرض إنهاء التوب
  assert.ok(ctrl.state.activeBoltBuster);
  assert.equal(ctrl.state.activeBoltBuster.extraLengthCm, 70);

  // 2. الكاشير يقنع الزبون بأخذ الـ 70 سم بخصم 45% لإنهاء التوب
  pos.acceptBoltBusterOffer();
  assert.equal(ctrl.state.activeBoltBuster, null);
  const line = ctrl.state.cart.lines[0] as FabricCartLine;
  assert.equal(line.requestedCm, 420); // 4.2 متر كاملة
  assert.ok(Number(line.discount) > 0); // تم تطبيق الخصم

  // 3. الدفع نقداً
  pos.payCash();
  assert.equal(ctrl.state.cart.lines.length, 0); // السلة تفرغت وجاهزة للزبون التالي
  assert.ok(ctrl.state.lastInvoiceNo?.startsWith('SWF-'));
});
