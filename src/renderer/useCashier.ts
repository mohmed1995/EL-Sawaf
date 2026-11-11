import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import type { BoltBusterOffer, CashierApi, Mm, ProductHit, SfxEvent } from '../shared/cashier-types';
import { cartReducer, cartTotals, EMPTY_CART, type CartState } from './cart.reducer';

const DEFAULT_ADD_MM: Mm = 1000;
const EVALUATE_DEBOUNCE_MS = 150;

export function useCashier(api: CashierApi, sfx: (e: SfxEvent) => void) {
  const [cart, dispatch] = useReducer(cartReducer, EMPTY_CART);
  const [offers, setOffers] = useState<ReadonlyMap<string, BoltBusterOffer>>(new Map());
  const announced = useRef(new Set<string>());

  // تقييم Bolt-Buster بعد كل تغيير في السلة (مع تأخير بسيط وإلغاء الطلبات القديمة).
  useEffect(() => {
    const pending = cart.lines.filter((l) => !l.bust);
    if (pending.length === 0) {
      setOffers(new Map());
      return;
    }
    let cancelled = false;
    const timer = setTimeout(() => {
      api
        .evaluateBolt(pending.map((l) => ({ lineKey: l.key, productId: l.productId, boltId: l.boltId, qtyMm: l.qtyMm })))
        .then((res) => {
          if (!cancelled) setOffers(new Map(res.map((o) => [o.lineKey, o])));
        })
        .catch(() => {
          if (!cancelled) setOffers(new Map());
        });
    }, EVALUATE_DEBOUNCE_MS);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [api, cart.lines]);

  // صوت التنبيه مرة واحدة لكل عرض جديد.
  useEffect(() => {
    for (const offer of offers.values()) {
      const line = cart.lines.find((l) => l.key === offer.lineKey);
      const id = `${offer.lineKey}:${line?.qtyMm ?? 0}`;
      if (!announced.current.has(id)) {
        announced.current.add(id);
        sfx('bust');
      }
    }
  }, [offers, cart.lines, sfx]);

  const addProduct = useCallback(
    (hit: ProductHit, qtyMm: Mm = DEFAULT_ADD_MM) => {
      dispatch({ type: 'ADD', key: crypto.randomUUID(), hit, qtyMm });
      sfx('add');
    },
    [sfx],
  );

  const adjustActive = useCallback(
    (deltaMm: Mm) => {
      const line = cart.lines.find((l) => l.key === cart.activeKey);
      if (!line) return sfx('error');
      if (deltaMm > 0 && line.qtyMm + deltaMm > line.boltRemainingMm) sfx('error');
      else sfx(deltaMm > 0 ? 'adjust' : 'remove');
      dispatch({ type: 'ADJUST', key: line.key, deltaMm });
    },
    [cart.lines, cart.activeKey, sfx],
  );

  const adjustLine = useCallback(
    (key: string, deltaMm: Mm) => {
      sfx('adjust');
      dispatch({ type: 'ADJUST', key, deltaMm });
    },
    [sfx],
  );

  const removeLine = useCallback(
    (key: string) => {
      sfx('remove');
      dispatch({ type: 'REMOVE', key });
    },
    [sfx],
  );

  const acceptBust = useCallback(
    (offer: BoltBusterOffer) => {
      sfx('accept');
      dispatch({ type: 'ACCEPT_BUST', key: offer.lineKey, bust: { extraMm: offer.extraMm, discount: offer.discount } });
    },
    [sfx],
  );

  const setActive = useCallback((key: string) => dispatch({ type: 'SET_ACTIVE', key }), []);
  const clear = useCallback(() => dispatch({ type: 'CLEAR' }), []);
  const restore = useCallback((state: CartState) => dispatch({ type: 'RESTORE', state }), []);
  const totals = useMemo(() => cartTotals(cart.lines), [cart.lines]);

  return { cart, offers, totals, addProduct, adjustActive, adjustLine, removeLine, acceptBust, setActive, clear, restore };
}
