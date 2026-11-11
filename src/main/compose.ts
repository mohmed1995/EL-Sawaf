import type { Db } from './db.js';
import { registerCashierIpc } from './ipc/register-cashier-ipc.js';
import type { BoltBusterPort, PricingPort } from './ports.js';
import { BoltRepo } from './repos/bolt.repo.js';
import { CustomerRepo } from './repos/customer.repo.js';
import { ProductRepo } from './repos/product.repo.js';
import { CheckoutService } from './services/checkout.service.js';
import { mulDivRoundHalfUp } from '../core/measure/money.js';

const pricing: PricingPort = {
  lineTotal: (unitPerMeter, qtyMm) => {
    // 1 متر = 1000 مليمتر. السعر = (السعر لكل متر * الطول بالمليمتر) / 1000
    const total = mulDivRoundHalfUp(Number(unitPerMeter), Number(qtyMm), 1000);
    return BigInt(total);
  }
};

const boltBuster: BoltBusterPort = {
  evaluate: ({ remainingMm, requestedMm, unitPerMeter }) => {
    const remaining = Number(remainingMm);
    const requested = Number(requestedMm);
    const diff = remaining - requested;

    // إذا كان المتبقي فضلة حرجة (أقل من 1.5 متر / 1500 ملم)
    if (diff > 0 && diff <= 1500) {
      const extraGross = mulDivRoundHalfUp(Number(unitPerMeter), diff, 1000);
      const discount = BigInt(mulDivRoundHalfUp(extraGross, 45, 100));

      return {
        extraMm: diff,
        discount
      };
    }

    return null;
  }
};

export function composeCashier(db: Db): void {
  const products = new ProductRepo(db);
  const bolts = new BoltRepo(db);
  const customers = new CustomerRepo(db);
  const checkout = new CheckoutService(db, products, bolts, customers, pricing, boltBuster);
  registerCashierIpc({ products, customers, checkout });
}
