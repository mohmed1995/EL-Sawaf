export interface Roll {
  id: string;
  meters: number;
  dyeLot?: string;
}

export interface Product {
  id: string;
  name: string;
  pricePerMeter: number;
  widthCm: number;
  colorHex: string;
  colorName: string;
  origin: string;
  composition: string;
  rolls: Roll[];
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  balance: number;
  limit: number;
  harvestSeason?: string;
  village?: string;
}

export interface Tailor {
  id: string;
  name: string;
  phone?: string;
  commissionPerMeter: number;
}

export const PRODUCTS: Product[] = [
  {
    id: 'p1',
    name: 'صوف إنجليزي كحلي دبل (بلدي فاخر)',
    pricePerMeter: 420,
    widthCm: 150,
    colorHex: '#14213d',
    colorName: 'كحلي داكن ملكي',
    origin: 'هدرسفيلد - إنجلترا',
    composition: '100% صوف خراف ميرينو نقي',
    rolls: [
      { id: 'T-101', meters: 42.0, dyeLot: 'صبغة #UK-904' },
      { id: 'T-102', meters: 6.5, dyeLot: 'صبغة #UK-904' }
    ]
  },
  {
    id: 'p2',
    name: 'صوف كشمير بني شوكولاتة (جلابية شتوي)',
    pricePerMeter: 380,
    widthCm: 150,
    colorHex: '#3e2723',
    colorName: 'بني شوكولاتة معتم',
    origin: 'بييلا - إيطاليا',
    composition: '90% صوف بيور + 10% كشمير',
    rolls: [
      { id: 'T-103', meters: 28.5, dyeLot: 'صبغة #IT-112' },
      { id: 'T-104', meters: 2.25, dyeLot: 'صبغة #IT-112' }
    ]
  },
  {
    id: 'p3',
    name: 'كريب رويال عبايات كلوش أسود فاحم',
    pricePerMeter: 185,
    widthCm: 150,
    colorHex: '#121212',
    colorName: 'أسود سواد الليل (Double Black)',
    origin: 'طوكيو - اليابان',
    composition: 'ألياف كريب رويال غير شفافة ضد التجعد',
    rolls: [
      { id: 'T-201', meters: 55.0, dyeLot: 'صبغة #JP-440' },
      { id: 'T-202', meters: 12.0, dyeLot: 'صبغة #JP-440' }
    ]
  },
  {
    id: 'p4',
    name: 'قطن ملايات المحلة الأصلي 240سم (جهاز عروسة)',
    pricePerMeter: 135,
    widthCm: 240,
    colorHex: '#f8edeb',
    colorName: 'سكري وردي فاتح ناعم',
    origin: 'المحلة الكبرى - مصر',
    composition: '100% قطن مصري طويل التيلة ناعم الملمس',
    rolls: [
      { id: 'T-301', meters: 70.0, dyeLot: 'صبغة #MH-771' }
    ]
  },
  {
    id: 'p5',
    name: 'قطيفة ستائر كشمير رويال زيتي ملكي',
    pricePerMeter: 260,
    widthCm: 280,
    colorHex: '#1b4332',
    colorName: 'أخضر زمردي زيتي فاخر',
    origin: 'بورصة - تركيا',
    composition: 'مخمل قطيفة عالي الكثافة حجب للضوء 85%',
    rolls: [
      { id: 'T-401', meters: 30.0, dyeLot: 'صبغة #TR-335' },
      { id: 'T-402', meters: 3.2, dyeLot: 'صبغة #TR-335' }
    ]
  },
  {
    id: 'p6',
    name: 'شيفون حرير سادة تركي بيج عاجي',
    pricePerMeter: 95,
    widthCm: 145,
    colorHex: '#faedcd',
    colorName: 'بيج عاجي ملكي',
    origin: 'إسطنبول - تركيا',
    composition: 'حرير شيفون خفيف مسدل ناعم جداً',
    rolls: [
      { id: 'T-501', meters: 48.0, dyeLot: 'صبغة #TR-882' }
    ]
  },
  {
    id: 'p7',
    name: 'بطانة ساتان حرير أصلي زيتي داكن',
    pricePerMeter: 55,
    widthCm: 150,
    colorHex: '#2d6a4f',
    colorName: 'أخضر داكن لامع خفيف',
    origin: 'كفر الدوار - مصر',
    composition: 'ساتان ناعم مضاد للشحنات الاستاتيكية للبدل والجلابيب',
    rolls: [
      { id: 'T-601', meters: 90.0, dyeLot: 'صبغة #KD-101' }
    ]
  }
];

export const CUSTOMERS: Customer[] = [
  { id: 'c0', name: 'عميل نقدي فوري', phone: '', balance: 0, limit: 0 },
  {
    id: 'c1',
    name: 'الحاج رضوان - قرية العركي',
    phone: '201001234567',
    balance: 3200,
    limit: 20000,
    harvestSeason: 'موسم كسر القصب (يناير - مايو)',
    village: 'العركي - فرشوط'
  },
  {
    id: 'c2',
    name: 'أم محمود - نجع حمادي (جهاز عروسة)',
    phone: '201112223334',
    balance: 0,
    limit: 15000,
    harvestSeason: 'أقساط شهرية منتظمة',
    village: 'نجع حمادي'
  },
  {
    id: 'c3',
    name: 'الأستاذ عبد الموجود - سوهاج',
    phone: '201223334445',
    balance: 14500,
    limit: 25000,
    harvestSeason: 'موسم توريد القمح (أبريل - يونيو)',
    village: 'أخميم - سوهاج'
  }
];

export const TAILORS: Tailor[] = [
  { id: 't0', name: 'بدون ترزي (قص مباشر للزبون)', commissionPerMeter: 0 },
  { id: 't1', name: 'الأسطى حسني الترزي (عمولة 5 ج/متر)', phone: '201009876543', commissionPerMeter: 5 },
  { id: 't2', name: 'المعلم سيد الخياط (عمولة 7 ج/متر)', phone: '201118765432', commissionPerMeter: 7 },
  { id: 't3', name: 'الأسطى قناوي البلدي (عمولة 5 ج/متر)', phone: '201227654321', commissionPerMeter: 5 }
];
