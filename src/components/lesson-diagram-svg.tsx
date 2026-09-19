/** SVGهای آموزشی بانک شکل — اصلی، نه اسکن کتاب */

const frame = {
  width: "100%",
  height: 200,
  className: "my-2 max-w-full rounded-xl border border-border/40 bg-white",
  viewBox: "0 0 320 200",
} as const;

export function LessonDiagramSvg({ id }: { id: string }) {
  const k = id.trim().toLowerCase();

  if (k === "neuron") {
    return (
      <svg {...frame} aria-label="ساختار نورون">
        <text x="160" y="18" textAnchor="middle" fontSize="12" fill="#991b1b" fontWeight="600">ساختار نورون</text>
        <path d="M40 70 Q55 50 70 75" fill="none" stroke="#b91c1c" strokeWidth="2.5" />
        <path d="M35 90 Q50 90 70 85" fill="none" stroke="#b91c1c" strokeWidth="2.5" />
        <path d="M40 110 Q55 120 70 95" fill="none" stroke="#b91c1c" strokeWidth="2.5" />
        <ellipse cx="100" cy="90" rx="32" ry="28" fill="#fecaca" stroke="#b91c1c" strokeWidth="2.5" />
        <circle cx="100" cy="90" r="10" fill="#fca5a5" stroke="#991b1b" strokeWidth="1.5" />
        <text x="100" y="130" textAnchor="middle" fontSize="10" fill="#7f1d1d">جسم یاخته‌ای</text>
        <text x="48" y="60" fontSize="10" fill="#7f1d1d">دندریت</text>
        <line x1="132" y1="90" x2="240" y2="90" stroke="#b91c1c" strokeWidth="3" />
        <text x="185" y="80" textAnchor="middle" fontSize="10" fill="#7f1d1d">آکسون</text>
        <path d="M240 90 L255 75 M240 90 L255 90 M240 90 L255 105" fill="none" stroke="#b91c1c" strokeWidth="2" />
        <text x="270" y="95" fontSize="10" fill="#7f1d1d">پایانه</text>
      </svg>
    );
  }

  if (k === "reflex") {
    return (
      <svg {...frame} aria-label="مسیر رفلکس">
        <text x="160" y="18" textAnchor="middle" fontSize="12" fill="#991b1b" fontWeight="600">مسیر رفلکس</text>
        <circle cx="40" cy="100" r="14" fill="#fecaca" stroke="#b91c1c" strokeWidth="2" />
        <text x="40" y="130" textAnchor="middle" fontSize="9" fill="#7f1d1d">گیرنده</text>
        <line x1="54" y1="100" x2="110" y2="70" stroke="#b91c1c" strokeWidth="2" />
        <rect x="110" y="50" width="50" height="40" rx="6" fill="#fee2e2" stroke="#b91c1c" strokeWidth="2" />
        <text x="135" y="75" textAnchor="middle" fontSize="9" fill="#7f1d1d">نخاع</text>
        <line x1="160" y1="90" x2="220" y2="120" stroke="#b91c1c" strokeWidth="2" />
        <ellipse cx="250" cy="130" rx="28" ry="16" fill="#fecaca" stroke="#b91c1c" strokeWidth="2" />
        <text x="250" y="165" textAnchor="middle" fontSize="9" fill="#7f1d1d">ماهیچه</text>
        <text x="80" y="75" fontSize="9" fill="#9a3412">حسی</text>
        <text x="195" y="100" fontSize="9" fill="#9a3412">حرکتی</text>
      </svg>
    );
  }

  if (k === "cell") {
    return (
      <svg {...frame} aria-label="سلول جانوری">
        <text x="160" y="18" textAnchor="middle" fontSize="12" fill="#991b1b" fontWeight="600">سلول جانوری</text>
        <ellipse cx="160" cy="110" rx="90" ry="60" fill="#fff1f2" stroke="#b91c1c" strokeWidth="2.5" />
        <circle cx="160" cy="110" r="22" fill="#fecaca" stroke="#991b1b" strokeWidth="2" />
        <text x="160" y="114" textAnchor="middle" fontSize="10" fill="#7f1d1d">هسته</text>
        <text x="250" y="80" fontSize="10" fill="#7f1d1d">غشا</text>
        <text x="100" y="150" fontSize="10" fill="#7f1d1d">سیتوپلاسم</text>
      </svg>
    );
  }

  if (k === "plant_cell") {
    return (
      <svg {...frame} aria-label="سلول گیاهی">
        <text x="160" y="18" textAnchor="middle" fontSize="12" fill="#991b1b" fontWeight="600">سلول گیاهی</text>
        <rect x="60" y="40" width="200" height="140" rx="8" fill="none" stroke="#166534" strokeWidth="3" />
        <rect x="70" y="50" width="180" height="120" rx="6" fill="#ecfdf5" stroke="#b91c1c" strokeWidth="2" />
        <circle cx="140" cy="100" r="18" fill="#fecaca" stroke="#991b1b" strokeWidth="2" />
        <ellipse cx="200" cy="90" rx="20" ry="14" fill="#86efac" stroke="#166534" strokeWidth="1.5" />
        <ellipse cx="190" cy="130" rx="28" ry="20" fill="#bbf7d0" stroke="#166534" strokeWidth="1.5" />
        <text x="140" y="104" textAnchor="middle" fontSize="9" fill="#7f1d1d">هسته</text>
        <text x="200" y="94" textAnchor="middle" fontSize="8" fill="#14532d">کلروپلاست</text>
        <text x="190" y="134" textAnchor="middle" fontSize="8" fill="#14532d">واکوئل</text>
      </svg>
    );
  }

  if (k === "muscle_types" || k === "muscle" || k === "muscle_cell") {
    return (
      <svg {...frame} viewBox="0 0 320 220" height={220} aria-label="انواع سلول ماهیچه">
        <text x="160" y="16" textAnchor="middle" fontSize="12" fill="#991b1b" fontWeight="600">سه نوع سلول ماهیچه</text>
        <text x="55" y="36" textAnchor="middle" fontSize="10" fill="#7f1d1d" fontWeight="600">اسکلتی (ارادی)</text>
        <rect x="12" y="48" width="90" height="36" rx="4" fill="#fecaca" stroke="#b91c1c" strokeWidth="1.5" />
        <line x1="12" y1="57" x2="102" y2="57" stroke="#991b1b" strokeWidth="1" opacity="0.5" />
        <line x1="12" y1="66" x2="102" y2="66" stroke="#991b1b" strokeWidth="1" opacity="0.5" />
        <line x1="12" y1="75" x2="102" y2="75" stroke="#991b1b" strokeWidth="1" opacity="0.5" />
        <circle cx="30" cy="58" r="3.5" fill="#fff" stroke="#991b1b" strokeWidth="1" />
        <circle cx="50" cy="70" r="3.5" fill="#fff" stroke="#991b1b" strokeWidth="1" />
        <circle cx="75" cy="62" r="3.5" fill="#fff" stroke="#991b1b" strokeWidth="1" />
        <text x="55" y="100" textAnchor="middle" fontSize="9" fill="#7f1d1d">استوانه‌ای · مخطط</text>
        <text x="55" y="112" textAnchor="middle" fontSize="9" fill="#7f1d1d">چند هسته در حاشیه</text>
        <text x="160" y="36" textAnchor="middle" fontSize="10" fill="#7f1d1d" fontWeight="600">قلبی (غیرارادی)</text>
        <path d="M130 55 L155 55 L170 70 L155 85 L130 85 L140 70 Z" fill="#fecaca" stroke="#b91c1c" strokeWidth="1.5" />
        <path d="M170 70 L195 55 L210 55 L200 70 L210 85 L195 85 Z" fill="#fecaca" stroke="#b91c1c" strokeWidth="1.5" />
        <line x1="135" y1="62" x2="165" y2="62" stroke="#991b1b" strokeWidth="0.8" opacity="0.5" />
        <line x1="135" y1="72" x2="165" y2="72" stroke="#991b1b" strokeWidth="0.8" opacity="0.5" />
        <circle cx="148" cy="68" r="3" fill="#fff" stroke="#991b1b" strokeWidth="1" />
        <circle cx="188" cy="68" r="3" fill="#fff" stroke="#991b1b" strokeWidth="1" />
        <line x1="170" y1="60" x2="170" y2="80" stroke="#7c2d12" strokeWidth="2" />
        <text x="160" y="100" textAnchor="middle" fontSize="9" fill="#7f1d1d">منشعب · مخطط</text>
        <text x="160" y="112" textAnchor="middle" fontSize="9" fill="#7f1d1d">صفحات بینابینی</text>
        <text x="265" y="36" textAnchor="middle" fontSize="10" fill="#7f1d1d" fontWeight="600">صاف (غیرارادی)</text>
        <ellipse cx="265" cy="68" rx="42" ry="16" fill="#fecaca" stroke="#b91c1c" strokeWidth="1.5" />
        <ellipse cx="265" cy="68" rx="6" ry="5" fill="#fff" stroke="#991b1b" strokeWidth="1" />
        <text x="265" y="100" textAnchor="middle" fontSize="9" fill="#7f1d1d">دوکی‌شکل · صاف</text>
        <text x="265" y="112" textAnchor="middle" fontSize="9" fill="#7f1d1d">یک هسته در مرکز</text>
        <text x="160" y="140" textAnchor="middle" fontSize="10" fill="#991b1b" fontWeight="600">مقایسه سریع</text>
        <text x="20" y="158" fontSize="9" fill="#444">• اسکلتی: ارادی · چند هسته · خطوط تیره و روشن</text>
        <text x="20" y="174" fontSize="9" fill="#444">• قلبی: غیرارادی · انشعاب · صفحات بینابینی</text>
        <text x="20" y="190" fontSize="9" fill="#444">• صاف: غیرارادی · بدون مخطط · هسته مرکزی</text>
        <text x="160" y="212" textAnchor="middle" fontSize="9" fill="#9a3412">شکل آموزشی — مطابق مباحث کتاب زیست</text>
      </svg>
    );
  }

  if (k === "photosynthesis") {
    return (
      <svg {...frame} aria-label="فتوسنتز">
        <text x="160" y="18" textAnchor="middle" fontSize="12" fill="#991b1b" fontWeight="600">فتوسنتز</text>
        <circle cx="80" cy="70" r="18" fill="#fde68a" stroke="#d97706" strokeWidth="2" />
        <text x="80" y="74" textAnchor="middle" fontSize="10" fill="#92400e">نور</text>
        <rect x="130" y="50" width="60" height="50" rx="8" fill="#86efac" stroke="#166534" strokeWidth="2" />
        <text x="160" y="80" textAnchor="middle" fontSize="10" fill="#14532d">برگ</text>
        <text x="50" y="130" fontSize="10" fill="#444">آب + CO₂</text>
        <text x="200" y="130" fontSize="10" fill="#444">→ قند + O₂</text>
      </svg>
    );
  }

  if (k === "atom") {
    return (
      <svg {...frame} aria-label="اتم">
        <text x="160" y="18" textAnchor="middle" fontSize="12" fill="#991b1b" fontWeight="600">مدل ساده اتم</text>
        <circle cx="160" cy="110" r="18" fill="#fecaca" stroke="#b91c1c" strokeWidth="2" />
        <text x="160" y="114" textAnchor="middle" fontSize="9" fill="#7f1d1d">هسته</text>
        <ellipse cx="160" cy="110" rx="70" ry="30" fill="none" stroke="#64748b" strokeWidth="1.5" />
        <circle cx="230" cy="110" r="6" fill="#93c5fd" stroke="#1d4ed8" strokeWidth="1" />
        <text x="230" y="140" textAnchor="middle" fontSize="9" fill="#1e3a8a">الکترون</text>
      </svg>
    );
  }

  if (k === "heart") {
    return (
      <svg {...frame} aria-label="قلب">
        <text x="160" y="18" textAnchor="middle" fontSize="12" fill="#991b1b" fontWeight="600">قلب (چهار حفره)</text>
        <rect x="90" y="40" width="60" height="50" fill="#fecaca" stroke="#b91c1c" strokeWidth="2" />
        <rect x="170" y="40" width="60" height="50" fill="#fecaca" stroke="#b91c1c" strokeWidth="2" />
        <rect x="90" y="100" width="60" height="55" fill="#fca5a5" stroke="#b91c1c" strokeWidth="2" />
        <rect x="170" y="100" width="60" height="55" fill="#fca5a5" stroke="#b91c1c" strokeWidth="2" />
        <text x="120" y="70" textAnchor="middle" fontSize="9" fill="#7f1d1d">دهلیز</text>
        <text x="200" y="70" textAnchor="middle" fontSize="9" fill="#7f1d1d">دهلیز</text>
        <text x="120" y="130" textAnchor="middle" fontSize="9" fill="#7f1d1d">بطن</text>
        <text x="200" y="130" textAnchor="middle" fontSize="9" fill="#7f1d1d">بطن</text>
      </svg>
    );
  }

  if (k === "digestive") {
    return (
      <svg {...frame} aria-label="گوارش">
        <text x="160" y="18" textAnchor="middle" fontSize="12" fill="#991b1b" fontWeight="600">مسیر گوارش</text>
        <text x="40" y="60" fontSize="10" fill="#444">دهان → مری → معده → روده باریک → روده بزرگ</text>
        <rect x="30" y="90" width="40" height="30" rx="6" fill="#fecaca" stroke="#b91c1c" />
        <rect x="90" y="95" width="50" height="20" rx="4" fill="#fee2e2" stroke="#b91c1c" />
        <ellipse cx="180" cy="110" rx="30" ry="22" fill="#fecaca" stroke="#b91c1c" />
        <path d="M210 110 Q250 90 280 130" fill="none" stroke="#b91c1c" strokeWidth="3" />
      </svg>
    );
  }

  if (k === "water_cycle") {
    return (
      <svg {...frame} aria-label="چرخه آب">
        <text x="160" y="18" textAnchor="middle" fontSize="12" fill="#991b1b" fontWeight="600">چرخه آب</text>
        <ellipse cx="80" cy="140" rx="40" ry="16" fill="#93c5fd" stroke="#1d4ed8" />
        <path d="M80 120 Q100 60 140 50" fill="none" stroke="#64748b" strokeWidth="2" />
        <text x="110" y="80" fontSize="9" fill="#444">تبخیر</text>
        <path d="M180 50 Q240 80 250 130" fill="none" stroke="#3b82f6" strokeWidth="2" />
        <text x="230" y="90" fontSize="9" fill="#444">بارش</text>
      </svg>
    );
  }

  if (k === "fraction") {
    return (
      <svg {...frame} aria-label="کسر">
        <text x="160" y="18" textAnchor="middle" fontSize="12" fill="#991b1b" fontWeight="600">کسر روی شکل</text>
        <rect x="60" y="50" width="200" height="100" fill="#fee2e2" stroke="#b91c1c" strokeWidth="2" />
        <rect x="60" y="50" width="100" height="100" fill="#fca5a5" stroke="#b91c1c" strokeWidth="2" />
        <text x="160" y="170" textAnchor="middle" fontSize="12" fill="#7f1d1d">۱ / ۲</text>
      </svg>
    );
  }

  if (k === "triangle_types") {
    return (
      <svg {...frame} aria-label="مثلث">
        <text x="160" y="18" textAnchor="middle" fontSize="12" fill="#991b1b" fontWeight="600">انواع مثلث</text>
        <polygon points="60,140 100,60 140,140" fill="#fecaca" stroke="#b91c1c" strokeWidth="2" />
        <polygon points="160,140 200,70 240,140" fill="#fee2e2" stroke="#b91c1c" strokeWidth="2" />
        <polygon points="250,140 290,90 310,140" fill="#fecaca" stroke="#b91c1c" strokeWidth="2" />
      </svg>
    );
  }

  if (k === "wave") {
    return (
      <svg {...frame} aria-label="موج">
        <text x="160" y="18" textAnchor="middle" fontSize="12" fill="#991b1b" fontWeight="600">موج ساده</text>
        <path d="M20 100 Q60 40 100 100 T180 100 T260 100 T300 100" fill="none" stroke="#b91c1c" strokeWidth="2.5" />
        <line x1="20" y1="100" x2="300" y2="100" stroke="#94a3b8" strokeWidth="1" />
      </svg>
    );
  }

  if (k === "circuit") {
    return (
      <svg {...frame} aria-label="مدار">
        <text x="160" y="18" textAnchor="middle" fontSize="12" fill="#991b1b" fontWeight="600">مدار ساده</text>
        <rect x="40" y="80" width="30" height="40" fill="#fecaca" stroke="#b91c1c" />
        <circle cx="160" cy="100" r="18" fill="#fde68a" stroke="#d97706" />
        <rect x="250" y="90" width="30" height="20" fill="#e2e8f0" stroke="#64748b" />
        <path d="M70 100 H142 M178 100 H250" stroke="#334155" strokeWidth="2" fill="none" />
      </svg>
    );
  }

  if (k === "dna") {
    return (
      <svg {...frame} aria-label="DNA">
        <text x="160" y="18" textAnchor="middle" fontSize="12" fill="#991b1b" fontWeight="600">DNA</text>
        <path d="M100 40 Q140 70 100 100 T100 160" fill="none" stroke="#b91c1c" strokeWidth="2.5" />
        <path d="M140 40 Q100 70 140 100 T140 160" fill="none" stroke="#1d4ed8" strokeWidth="2.5" />
        <line x1="110" y1="55" x2="130" y2="55" stroke="#64748b" />
        <line x1="105" y1="85" x2="135" y2="85" stroke="#64748b" />
        <line x1="110" y1="115" x2="130" y2="115" stroke="#64748b" />
      </svg>
    );
  }

  if (k === "earth_layers") {
    return (
      <svg {...frame} aria-label="لایه‌های زمین">
        <text x="160" y="18" textAnchor="middle" fontSize="12" fill="#991b1b" fontWeight="600">لایه‌های زمین</text>
        <circle cx="140" cy="110" r="70" fill="#fde68a" stroke="#b45309" strokeWidth="2" />
        <circle cx="140" cy="110" r="50" fill="#fdba74" stroke="#c2410c" strokeWidth="2" />
        <circle cx="140" cy="110" r="30" fill="#fca5a5" stroke="#b91c1c" strokeWidth="2" />
        <circle cx="140" cy="110" r="14" fill="#fecaca" stroke="#991b1b" strokeWidth="2" />
        <text x="250" y="50" fontSize="10" fill="#7f1d1d">پوسته</text>
        <text x="250" y="85" fontSize="10" fill="#9a3412">گوشته</text>
        <text x="250" y="115" fontSize="10" fill="#991b1b">هسته خارجی</text>
        <text x="250" y="145" fontSize="10" fill="#7f1d1d">هسته داخلی</text>
      </svg>
    );
  }

  return null;
}
