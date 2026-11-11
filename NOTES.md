# ملاحظات التنفيذ

## التجميع
- في `main.ts` بعد فتح قاعدة البيانات: `composeCashier(db)`، وفي الـ Renderer: `<CashierScreen sfx={playSfx} />`.
- اربط `SfxEvent` بالمؤثرات الثمانية: add, adjust, remove, bust, accept, hold, checkout, error.
- npm: `@fontsource/cairo` (خط محلي للأوفلاين). Tailwind يلزمه 3.3+ لخاصية `border-s-8`.

## F12 في Electron
- في الإنتاج: `Menu.setApplicationMenu(null)` وعطّل DevTools، وإلا يفتح F12 أدوات المطور.
- في التطوير: `win.webContents.on('before-input-event', (e, i) => { if (i.key === 'F12') e.preventDefault(); })`.

## قيم يجب تأكيدها مع صاحب المحل
- أطوال القصات في `QuickPad.tsx`: سديري 1.5م وطقم سرير 6م (افتراضية، أما جلابية بلدي 3.5م فمن طلبك).
- عتبات الألوان في `bolt-level.ts`: أقل من 30% أصفر، أقل من 10% برتقالي.

## سكيما SQLite المفترضة
راجع التعليقات أعلى `product.repo.ts` و`checkout.service.ts`. إن اختلفت الأعمدة عدّل جمل SQL فقط.
