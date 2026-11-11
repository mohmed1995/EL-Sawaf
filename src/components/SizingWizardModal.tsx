import React, { useState } from 'react';
import { play } from '../demo/sounds.js';

interface SizingWizardModalProps {
  onSelectMeters: (meters: number, note?: string) => void;
  onClose: () => void;
}

interface SizingItem {
  id: string;
  category: 'BALADI' | 'WOMEN' | 'BEDDING' | 'CURTAIN';
  title: string;
  meters: number;
  widthNote: string;
  description: string;
  icon: string;
}

const SIZING_DATABASE: SizingItem[] = [
  // أصواف وجلاليب صعيدي ورجالي (عرض 150 سم)
  {
    id: 'b1',
    category: 'BALADI',
    title: 'جلابية بلدي صعيدي (مقاس عادي / وسط)',
    meters: 3.50,
    widthNote: 'عرض 150 سم',
    description: 'المقاس القياسي لأغلب الزبائن بطول حتى 175 سم مع كشكشة مريحة',
    icon: '👘'
  },
  {
    id: 'b2',
    category: 'BALADI',
    title: 'جلابية بلدي صعيدي (طويل / ممتلئ جثة)',
    meters: 3.75,
    widthNote: 'عرض 150 سم',
    description: 'للأطوال الفارهة (أكثر من 180 سم) أو الأجسام الممتلئة لضمان وسع الذيل والكمين',
    icon: '👑'
  },
  {
    id: 'b3',
    category: 'BALADI',
    title: 'جلابية بلدي + سديري كامل',
    meters: 4.75,
    widthNote: 'عرض 150 سم',
    description: '3.50م للجلابية + 1.25م للسديري البلدي المبطن',
    icon: '👔'
  },
  {
    id: 'b4',
    category: 'BALADI',
    title: 'سديري بلدي صعيدي مفرد',
    meters: 1.25,
    widthNote: 'عرض 150 سم',
    description: 'يكفي سديري صدر مقفول أو مفتوح مع قلابات الجيب',
    icon: '🦺'
  },
  {
    id: 'b5',
    category: 'BALADI',
    title: 'قفطان صعيدي / كاكولا مشايخ',
    meters: 4.50,
    widthNote: 'عرض 150 سم',
    description: 'قفطان مفتوح من الأمام بالبطانة الداخلية',
    icon: '📜'
  },
  {
    id: 'b6',
    category: 'BALADI',
    title: 'جلابية إفرنجي / سعودي (ياقة عادية)',
    meters: 3.25,
    widthNote: 'عرض 150 سم',
    description: 'تفصيل سعودي بياقة وأساور بدون كشكشة بلدي',
    icon: '🥼'
  },
  {
    id: 'b7',
    category: 'BALADI',
    title: 'جلابية بلدي شبابي / ولادي (10 - 14 سنة)',
    meters: 2.50,
    widthNote: 'عرض 150 سم',
    description: 'مقاس فتيان للمناسبات والأعياد',
    icon: '👦'
  },
  {
    id: 'b8',
    category: 'BALADI',
    title: 'جلابية أطفال صغار (4 - 8 سنوات)',
    meters: 1.75,
    widthNote: 'عرض 150 سم',
    description: 'تفصيلة خفيفة للأولاد الصغار',
    icon: '🧒'
  },

  // عبايات وسيدات (عرض 150 سم)
  {
    id: 'w1',
    category: 'WOMEN',
    title: 'عباية كلوش واسعة حريمي',
    meters: 3.50,
    widthNote: 'عرض 150 سم',
    description: 'دوران ذيل كامل مع أكمام بف واسعة',
    icon: '👗'
  },
  {
    id: 'w2',
    category: 'WOMEN',
    title: 'عباية نص كلوش / مستقيمة',
    meters: 3.00,
    widthNote: 'عرض 150 سم',
    description: 'تفصيل يومي مريح خفيف بدون كشكشة زائدة',
    icon: '🧕'
  },
  {
    id: 'w3',
    category: 'WOMEN',
    title: 'فستان سواريه / خطوبة واسع',
    meters: 4.50,
    widthNote: 'عرض 150 سم',
    description: 'قصة دبل كلوش مع ذيل طويل',
    icon: '💃'
  },
  {
    id: 'w4',
    category: 'WOMEN',
    title: 'إسدال صلاة قطن واسع بالخمار',
    meters: 3.75,
    widthNote: 'عرض 150 سم',
    description: 'إسدال ساتر من الرأس للأقدام مع الطرحة المتصلة',
    icon: '🤲'
  },

  // مفروشات وملايات سرير (عرض 240 سم)
  {
    id: 'm1',
    category: 'BEDDING',
    title: 'طقم سرير كبير 5 قطع (سرير 160-180 سم)',
    meters: 4.50,
    widthNote: 'عرض 240 سم',
    description: 'ملاية كبيرة (2.40 × 2.50 م) + 2 كيس مخدة طويل + 2 خدادية كبار بكرانيش',
    icon: '🛏️'
  },
  {
    id: 'm2',
    category: 'BEDDING',
    title: 'طقم سريرين أطفال 6 قطع (سرير 120 سم)',
    meters: 7.50,
    widthNote: 'عرض 240 سم',
    description: 'ملايتين (2 م × 2.40 م) + 2 كيس مخدة + 2 كيس خدادية لغرف الأطفال',
    icon: '🧸'
  },
  {
    id: 'm3',
    category: 'BEDDING',
    title: 'كفر لحاف دبل سوستة كبير',
    meters: 6.00,
    widthNote: 'عرض 240 سم',
    description: 'وجه وظهر للحاف كبير 240×250 سم مع السوستة',
    icon: '🧵'
  },
  {
    id: 'm4',
    category: 'BEDDING',
    title: 'ملاية سادة استبن بمخدتين',
    meters: 3.25,
    widthNote: 'عرض 240 سم',
    description: 'ملاية عملية يومية مع كيس مخدة طويل وخدادية واحدة',
    icon: '✨'
  },

  // ستائر وديكور (عرض 280-300 سم)
  {
    id: 'c1',
    category: 'CURTAIN',
    title: 'ستارة شباك عادي (عرض 1.5 - 2 م)',
    meters: 4.00,
    widthNote: 'عرض 280 سم',
    description: 'حساب كشكشة دبل (الضعف) لانسدال فخم',
    icon: '🪟'
  },
  {
    id: 'c2',
    category: 'CURTAIN',
    title: 'ستارة ريسبشن / بلكونة كبيرة (عرض 3 م)',
    meters: 6.50,
    widthNote: 'عرض 280 سم',
    description: 'كشكشة كاملة 2.2 ضعف مع مساحة الثنيات والجوانب',
    icon: '🏛️'
  }
];

export const SizingWizardModal: React.FC<SizingWizardModalProps> = ({ onSelectMeters, onClose }) => {
  const [activeTab, setActiveTab] = useState<'BALADI' | 'WOMEN' | 'BEDDING' | 'CURTAIN'>('BALADI');
  const [customMultiplier, setCustomMultiplier] = useState(1);

  const filtered = SIZING_DATABASE.filter((item) => item.category === activeTab);

  const handlePick = (item: SizingItem) => {
    const finalMeters = Math.round(item.meters * customMultiplier * 100) / 100;
    play('scissors');
    onSelectMeters(finalMeters, `${item.title} (${finalMeters}م)`);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50 animate-fade-in backdrop-blur-sm" dir="rtl">
      <div className="bg-[#111A15] text-[#ECEEE8] border-2 border-[#C5A059] rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* رأس النافذة */}
        <div className="p-4 bg-gradient-to-r from-[#173F30] to-[#0F281E] border-b border-[#C5A059]/40 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <span className="text-2xl p-2 bg-[#C5A059]/20 rounded-lg text-[#ECC777] border border-[#C5A059]/40">📐</span>
            <div>
              <h2 className="text-lg font-black text-[#F4F1EA] tracking-wide">
                حاسبة المقاسات وتفصيل الصعيد والعرائس
              </h2>
              <p className="text-xs text-[#C5A059]">
                المقاسات الدقيقة المعتمدة لترزية الصعيد ومصانع المحلة (لا هدر ولا عجز)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-full w-8 h-8 flex items-center justify-center transition-colors"
          >
            ✕
          </button>
        </div>

        {/* أزرار التبويب */}
        <div className="flex border-b border-white/10 bg-[#0C1410] px-4 pt-2 gap-2 overflow-x-auto">
          {[
            { id: 'BALADI', label: '👘 رجالي وصعيدي (جلاليب وسديري)', count: 8 },
            { id: 'BEDDING', label: '🛏️ مفروشات وملايات (أطقم سرير)', count: 4 },
            { id: 'WOMEN', label: '👗 حريمي وسواريه (عبايات وخمار)', count: 4 },
            { id: 'CURTAIN', label: '🪟 ستائر وديكور (كشكشة دبل)', count: 2 }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-[#C5A059] text-[#ECC777] bg-white/5 rounded-t-lg'
                  : 'border-transparent text-gray-400 hover:text-gray-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* شريط تعديل عدد القطع السريع */}
        <div className="bg-[#15231C] px-4 py-2 border-b border-white/10 flex items-center justify-between text-xs text-gray-300">
          <span className="flex items-center gap-2">
            <span>ضرب الكمية في عدد القطع / الأشخاص:</span>
            <div className="flex items-center gap-1 bg-[#0C1410] px-2 py-1 rounded border border-white/10">
              {[1, 2, 3, 4, 5].map((num) => (
                <button
                  key={num}
                  onClick={() => setCustomMultiplier(num)}
                  className={`w-6 h-6 rounded text-xs font-bold transition-all ${
                    customMultiplier === num
                      ? 'bg-[#C5A059] text-[#111A15]'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
          </span>

          <span className="text-[#C5A059] text-[11px]">
            {customMultiplier > 1 ? `⚡ مضاعف (${customMultiplier} أطقم/قطع)` : 'مقاس قطعة واحدة'}
          </span>
        </div>

        {/* قائمة الكروت للمقاسات المحددة */}
        <div className="p-4 overflow-y-auto flex-1 grid grid-cols-1 md:grid-cols-2 gap-3 custom-scrollbar">
          {filtered.map((item) => {
            const calculated = Math.round(item.meters * customMultiplier * 100) / 100;
            return (
              <div
                key={item.id}
                onClick={() => handlePick(item)}
                className="group p-3.5 rounded-xl border border-white/10 hover:border-[#C5A059] bg-[#14201A] hover:bg-[#1A2A22] cursor-pointer transition-all flex flex-col justify-between hover:shadow-lg hover:shadow-black/40"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{item.icon}</span>
                      <h4 className="font-bold text-sm text-[#F4F1EA] group-hover:text-[#ECC777] transition-colors">
                        {item.title}
                      </h4>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-white/5 text-[#A0AEC0] border border-white/10 whitespace-nowrap">
                      {item.widthNote}
                    </span>
                  </div>

                  <p className="text-xs text-gray-400 leading-relaxed mb-3">
                    {item.description}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2.5 border-t border-white/5 mt-auto">
                  <div className="text-xs">
                    <span className="text-gray-400">الكمية المطلوبة: </span>
                    <span className="font-mono text-base font-black text-[#ECC777]">
                      {calculated}
                    </span>
                    <span className="text-[11px] text-gray-400 mr-1">متر</span>
                  </div>

                  <button className="text-xs bg-[#C5A059]/20 group-hover:bg-[#C5A059] text-[#ECC777] group-hover:text-[#111A15] px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1">
                    <span>اعتماد المقاس</span>
                    <span>←</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* تذييل النافذة */}
        <div className="p-3 bg-[#0C1410] border-t border-white/10 flex justify-between items-center text-xs text-gray-400">
          <span>💡 نصيحة الترزي: في تفصيل الصعيد، دائمًا يُفضل إضافة 10-15 سم لأطراف الثنية والكمين لضمان المقاس.</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold transition-colors"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
