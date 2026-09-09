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
        <text x="160" y="18" textAnchor="middle" fontSize="12" fill="#991b1b" fontWeight="600">
          ساختار نورون
        </text>
        {/* dendrites */}
        <path d="M40 70 Q55 50 70 75" fill="none" stroke="#b91c1c" strokeWidth="2.5" />
        <path d="M35 90 Q50 90 70 85" fill="none" stroke="#b91c1c" strokeWidth="2.5" />
        <path d="M40 110 Q55 120 70 95" fill="none" stroke="#b91c1c" strokeWidth="2.5" />
        {/* cell body */}
        <ellipse cx="100" cy="90" rx="32" ry="28" fill="#fecaca" stroke="#b91c1c" strokeWidth="2.5" />
        <circle cx="100" cy="90" r="10" fill="#fca5a5" stroke="#991b1b" strokeWidth="1.5" />
        <text x="100" y="130" textAnchor="middle" fontSize="10" fill="#7f1d1d">
          جسم یاخته‌ای
        </text>
        <text x="48" y="60" fontSize="10" fill="#7f1d1d">
          دندریت
        </text>
        {/* axon */}
        <line x1="132" y1="90" x2="240" y2="90" stroke="#b91c1c" strokeWidth="3" />
        <text x="185" y="80" textAnchor="middle" fontSize="10" fill="#7f1d1d">
          آکسون
        </text>
        {/* terminals */}
        <path d="M240 90 L270 70 M240 90 L275 90 M240 90 L270 110" stroke="#b91c1c" strokeWidth="2.5" />
        <text x="275" y="130" textAnchor="middle" fontSize="10" fill="#7f1d1d">
          پایانه
        </text>
      </svg>
    );
  }

  if (k === "reflex") {
    return (
      <svg {...frame} aria-label="مسیر رفلکس">
        <text x="160" y="18" textAnchor="middle" fontSize="12" fill="#991b1b" fontWeight="600">
          مسیر رفلکس
        </text>
        {/* hand */}
        <ellipse cx="50" cy="120" rx="22" ry="14" fill="#fecaca" stroke="#b91c1c" strokeWidth="2" />
        <text x="50" y="150" textAnchor="middle" fontSize="10" fill="#7f1d1d">
          گیرنده
        </text>
        {/* path to spinal */}
        <path d="M72 115 Q120 40 160 55" fill="none" stroke="#b91c1c" strokeWidth="2.5" markerEnd="url(#arrow)" />
        <text x="100" y="55" fontSize="10" fill="#7f1d1d">
          حسی
        </text>
        {/* spinal cord */}
        <ellipse cx="160" cy="70" rx="28" ry="36" fill="#fee2e2" stroke="#b91c1c" strokeWidth="2.5" />
        <text x="160" y="75" textAnchor="middle" fontSize="10" fill="#7f1d1d">
          نخاع
        </text>
        {/* motor path */}
        <path d="M160 105 Q200 140 250 125" fill="none" stroke="#b91c1c" strokeWidth="2.5" />
        <text x="210" y="145" fontSize="10" fill="#7f1d1d">
          حرکتی
        </text>
        {/* muscle */}
        <ellipse cx="270" cy="120" rx="28" ry="18" fill="#fca5a5" stroke="#b91c1c" strokeWidth="2" />
        <text x="270" y="155" textAnchor="middle" fontSize="10" fill="#7f1d1d">
          ماهیچه
        </text>
      </svg>
    );
  }

  if (k === "cell") {
    return (
      <svg {...frame} aria-label="سلول جانوری">
        <text x="160" y="18" textAnchor="middle" fontSize="12" fill="#991b1b" fontWeight="600">
          سلول جانوری
        </text>
        <ellipse cx="160" cy="105" rx="110" ry="70" fill="#fff1f2" stroke="#b91c1c" strokeWidth="3" />
        <text x="250" y="50" fontSize="10" fill="#7f1d1d">
          غشا
        </text>
        <ellipse cx="160" cy="105" rx="85" ry="50" fill="#fecaca" stroke="#e11d48" strokeWidth="1" opacity="0.5" />
        <text x="200" y="140" fontSize="10" fill="#7f1d1d">
          سیتوپلاسم
        </text>
        <circle cx="150" cy="100" r="28" fill="#fca5a5" stroke="#991b1b" strokeWidth="2" />
        <text x="150" y="104" textAnchor="middle" fontSize="11" fill="#7f1d1d">
          هسته
        </text>
      </svg>
    );
  }

  if (k === "plant_cell") {
    return (
      <svg {...frame} aria-label="سلول گیاهی">
        <text x="160" y="18" textAnchor="middle" fontSize="12" fill="#991b1b" fontWeight="600">
          سلول گیاهی
        </text>
        <rect x="40" y="40" width="240" height="140" rx="8" fill="none" stroke="#166534" strokeWidth="4" />
        <text x="60" y="55" fontSize="10" fill="#14532d">
          دیواره
        </text>
        <rect x="52" y="52" width="216" height="116" rx="6" fill="#f0fdf4" stroke="#16a34a" strokeWidth="2" />
        <ellipse cx="200" cy="110" rx="40" ry="30" fill="#bbf7d0" stroke="#15803d" strokeWidth="2" />
        <text x="200" y="114" textAnchor="middle" fontSize="10" fill="#14532d">
          واکوئل
        </text>
        <circle cx="100" cy="100" r="22" fill="#86efac" stroke="#166534" strokeWidth="2" />
        <text x="100" y="104" textAnchor="middle" fontSize="10" fill="#14532d">
          هسته
        </text>
        <ellipse cx="120" cy="140" rx="18" ry="12" fill="#4ade80" stroke="#166534" strokeWidth="1.5" />
        <text x="120" y="165" textAnchor="middle" fontSize="9" fill="#14532d">
          کلروپلاست
        </text>
      </svg>
    );
  }

  if (k === "photosynthesis") {
    return (
      <svg {...frame} aria-label="فتوسنتز">
        <text x="160" y="18" textAnchor="middle" fontSize="12" fill="#991b1b" fontWeight="600">
          فتوسنتز
        </text>
        {/* sun */}
        <circle cx="50" cy="50" r="18" fill="#fde68a" stroke="#d97706" strokeWidth="2" />
        <text x="50" y="80" textAnchor="middle" fontSize="10" fill="#92400e">
          نور
        </text>
        {/* leaf */}
        <ellipse cx="160" cy="100" rx="70" ry="40" fill="#86efac" stroke="#166534" strokeWidth="2.5" />
        <text x="160" y="105" textAnchor="middle" fontSize="11" fill="#14532d">
          برگ / کلروپلاست
        </text>
        <text x="70" y="130" fontSize="10" fill="#0c4a6e">
          CO₂ + آب
        </text>
        <path d="M90 140 L130 120" stroke="#0ea5e9" strokeWidth="2" />
        <text x="230" y="70" fontSize="10" fill="#166534">
          قند + O₂
        </text>
        <path d="M200 85 L250 60" stroke="#16a34a" strokeWidth="2" />
      </svg>
    );
  }

  if (k === "atom") {
    return (
      <svg {...frame} aria-label="اتم">
        <text x="160" y="18" textAnchor="middle" fontSize="12" fill="#991b1b" fontWeight="600">
          مدل ساده اتم
        </text>
        <circle cx="160" cy="105" r="22" fill="#fecaca" stroke="#b91c1c" strokeWidth="2" />
        <text x="160" y="108" textAnchor="middle" fontSize="9" fill="#7f1d1d">
          هسته
        </text>
        <text x="160" y="145" textAnchor="middle" fontSize="9" fill="#7f1d1d">
          p⁺ n⁰
        </text>
        <ellipse cx="160" cy="105" rx="90" ry="35" fill="none" stroke="#e11d48" strokeWidth="1.5" />
        <ellipse cx="160" cy="105" rx="55" ry="70" fill="none" stroke="#f97316" strokeWidth="1.5" transform="rotate(30 160 105)" />
        <circle cx="250" cy="105" r="6" fill="#3b82f6" />
        <circle cx="160" cy="35" r="6" fill="#3b82f6" />
        <circle cx="100" cy="160" r="6" fill="#3b82f6" />
        <text x="260" y="100" fontSize="10" fill="#1e3a8a">
          e⁻
        </text>
      </svg>
    );
  }

  if (k === "heart") {
    return (
      <svg {...frame} aria-label="قلب">
        <text x="160" y="18" textAnchor="middle" fontSize="12" fill="#991b1b" fontWeight="600">
          قلب (چهار حفره)
        </text>
        <path
          d="M160 170 C120 140 70 110 70 75 C70 50 95 40 120 55 C140 40 160 50 160 50 C160 50 180 40 200 55 C225 40 250 50 250 75 C250 110 200 140 160 170Z"
          fill="#fecaca"
          stroke="#b91c1c"
          strokeWidth="2.5"
        />
        <line x1="160" y1="55" x2="160" y2="150" stroke="#991b1b" strokeWidth="1.5" strokeDasharray="4 2" />
        <line x1="90" y1="100" x2="230" y2="100" stroke="#991b1b" strokeWidth="1.5" strokeDasharray="4 2" />
        <text x="125" y="80" textAnchor="middle" fontSize="9" fill="#7f1d1d">
          دهلیز
        </text>
        <text x="195" y="80" textAnchor="middle" fontSize="9" fill="#7f1d1d">
          دهلیز
        </text>
        <text x="125" y="125" textAnchor="middle" fontSize="9" fill="#7f1d1d">
          بطن
        </text>
        <text x="195" y="125" textAnchor="middle" fontSize="9" fill="#7f1d1d">
          بطن
        </text>
      </svg>
    );
  }

  if (k === "digestive") {
    return (
      <svg {...frame} aria-label="گوارش">
        <text x="160" y="18" textAnchor="middle" fontSize="12" fill="#991b1b" fontWeight="600">
          مسیر گوارش
        </text>
        {[
          [40, "دهان"],
          [100, "مری"],
          [160, "معده"],
          [220, "روده باریک"],
          [285, "روده بزرگ"],
        ].map(([x, label], i) => (
          <g key={String(label)}>
            <circle cx={x as number} cy="90" r="22" fill="#fecaca" stroke="#b91c1c" strokeWidth="2" />
            <text x={x as number} y="94" textAnchor="middle" fontSize="9" fill="#7f1d1d">
              {label as string}
            </text>
            {i < 4 && (
              <line
                x1={(x as number) + 22}
                y1="90"
                x2={(x as number) + 38}
                y2="90"
                stroke="#b91c1c"
                strokeWidth="2"
              />
            )}
          </g>
        ))}
      </svg>
    );
  }

  if (k === "water_cycle") {
    return (
      <svg {...frame} aria-label="چرخه آب">
        <text x="160" y="18" textAnchor="middle" fontSize="12" fill="#991b1b" fontWeight="600">
          چرخه آب
        </text>
        <ellipse cx="80" cy="150" rx="50" ry="18" fill="#bae6fd" stroke="#0284c7" strokeWidth="2" />
        <text x="80" y="155" textAnchor="middle" fontSize="10" fill="#0c4a6e">
          دریا
        </text>
        <path d="M80 130 Q100 80 140 50" fill="none" stroke="#0ea5e9" strokeWidth="2" strokeDasharray="4 2" />
        <text x="100" y="90" fontSize="10" fill="#0c4a6e">
          تبخیر
        </text>
        <ellipse cx="200" cy="45" rx="40" ry="16" fill="#e2e8f0" stroke="#64748b" strokeWidth="2" />
        <text x="200" y="50" textAnchor="middle" fontSize="10" fill="#334155">
          ابر
        </text>
        <path d="M220 60 L240 110" fill="none" stroke="#0284c7" strokeWidth="2" strokeDasharray="3 2" />
        <text x="250" y="90" fontSize="10" fill="#0c4a6e">
          بارش
        </text>
        <path d="M240 120 Q180 150 130 150" fill="none" stroke="#0369a1" strokeWidth="2" />
        <text x="200" y="145" fontSize="10" fill="#0c4a6e">
          جریان
        </text>
      </svg>
    );
  }

  if (k === "fraction") {
    return (
      <svg {...frame} aria-label="کسر">
        <text x="160" y="18" textAnchor="middle" fontSize="12" fill="#991b1b" fontWeight="600">
          کسر روی دایره (۱/۴)
        </text>
        <circle cx="160" cy="110" r="60" fill="#fff1f2" stroke="#b91c1c" strokeWidth="3" />
        <path d="M160 110 L160 50 A60 60 0 0 1 220 110 Z" fill="#fca5a5" stroke="#b91c1c" strokeWidth="2" />
        <line x1="160" y1="50" x2="160" y2="170" stroke="#b91c1c" strokeWidth="1.5" />
        <line x1="100" y1="110" x2="220" y2="110" stroke="#b91c1c" strokeWidth="1.5" />
        <text x="160" y="185" textAnchor="middle" fontSize="11" fill="#7f1d1d">
          قسمت رنگی = صورت
        </text>
      </svg>
    );
  }

  if (k === "triangle_types") {
    return (
      <svg {...frame} aria-label="انواع مثلث">
        <text x="160" y="18" textAnchor="middle" fontSize="12" fill="#991b1b" fontWeight="600">
          انواع مثلث
        </text>
        <polygon points="55,140 20,170 90,170" fill="#fecaca" stroke="#b91c1c" strokeWidth="2" />
        <text x="55" y="190" textAnchor="middle" fontSize="9" fill="#7f1d1d">
          متساوی‌الاضلاع
        </text>
        <polygon points="160,100 120,170 200,170" fill="#fecaca" stroke="#b91c1c" strokeWidth="2" />
        <text x="160" y="190" textAnchor="middle" fontSize="9" fill="#7f1d1d">
          متساوی‌الساقین
        </text>
        <polygon points="260,170 260,110 310,170" fill="#fecaca" stroke="#b91c1c" strokeWidth="2" />
        <text x="275" y="190" textAnchor="middle" fontSize="9" fill="#7f1d1d">
          قائم‌الزاویه
        </text>
      </svg>
    );
  }

  if (k === "wave") {
    return (
      <svg {...frame} aria-label="موج">
        <text x="160" y="18" textAnchor="middle" fontSize="12" fill="#991b1b" fontWeight="600">
          موج ساده
        </text>
        <line x1="20" y1="110" x2="300" y2="110" stroke="#94a3b8" strokeWidth="1" />
        <path
          d="M20 110 C40 50 60 50 80 110 S120 170 140 110 S180 50 200 110 S240 170 260 110 S300 50 300 110"
          fill="none"
          stroke="#b91c1c"
          strokeWidth="2.5"
        />
        <line x1="80" y1="110" x2="80" y2="55" stroke="#0ea5e9" strokeWidth="1.5" strokeDasharray="3 2" />
        <text x="95" y="75" fontSize="10" fill="#0c4a6e">
          دامنه
        </text>
        <line x1="80" y1="170" x2="200" y2="170" stroke="#16a34a" strokeWidth="1.5" />
        <text x="140" y="185" textAnchor="middle" fontSize="10" fill="#14532d">
          طول موج
        </text>
      </svg>
    );
  }

  if (k === "circuit") {
    return (
      <svg {...frame} aria-label="مدار">
        <text x="160" y="18" textAnchor="middle" fontSize="12" fill="#991b1b" fontWeight="600">
          مدار ساده
        </text>
        <rect x="40" y="80" width="36" height="50" fill="#fecaca" stroke="#b91c1c" strokeWidth="2" />
        <text x="58" y="110" textAnchor="middle" fontSize="10" fill="#7f1d1d">
          باتری
        </text>
        <line x1="76" y1="90" x2="200" y2="90" stroke="#334155" strokeWidth="2" />
        <line x1="76" y1="120" x2="200" y2="120" stroke="#334155" strokeWidth="2" />
        <rect x="200" y="85" width="50" height="40" fill="#fde68a" stroke="#d97706" strokeWidth="2" />
        <text x="225" y="110" textAnchor="middle" fontSize="10" fill="#92400e">
          لامپ
        </text>
        <line x1="250" y1="90" x2="280" y2="90" stroke="#334155" strokeWidth="2" />
        <line x1="250" y1="120" x2="280" y2="120" stroke="#334155" strokeWidth="2" />
        <line x1="280" y1="90" x2="280" y2="120" stroke="#334155" strokeWidth="2" />
      </svg>
    );
  }

  if (k === "dna") {
    return (
      <svg {...frame} aria-label="DNA">
        <text x="160" y="18" textAnchor="middle" fontSize="12" fill="#991b1b" fontWeight="600">
          DNA (ساده)
        </text>
        <path d="M80 40 C120 70 120 110 80 140 C40 170 40 40 80 40" fill="none" stroke="#b91c1c" strokeWidth="3" />
        <path d="M140 40 C180 70 180 110 140 140 C100 170 100 40 140 40" fill="none" stroke="#2563eb" strokeWidth="3" />
        <line x1="95" y1="60" x2="125" y2="60" stroke="#64748b" strokeWidth="2" />
        <line x1="100" y1="90" x2="130" y2="90" stroke="#64748b" strokeWidth="2" />
        <line x1="95" y1="120" x2="125" y2="120" stroke="#64748b" strokeWidth="2" />
        <text x="200" y="100" fontSize="11" fill="#7f1d1d">
          دو رشته مارپیچ
        </text>
      </svg>
    );
  }

  if (k === "earth_layers") {
    return (
      <svg {...frame} aria-label="لایه‌های زمین">
        <text x="160" y="18" textAnchor="middle" fontSize="12" fill="#991b1b" fontWeight="600">
          لایه‌های زمین
        </text>
        <circle cx="160" cy="110" r="75" fill="#fef3c7" stroke="#a16207" strokeWidth="2" />
        <circle cx="160" cy="110" r="55" fill="#fdba74" stroke="#c2410c" strokeWidth="2" />
        <circle cx="160" cy="110" r="32" fill="#fca5a5" stroke="#b91c1c" strokeWidth="2" />
        <circle cx="160" cy="110" r="14" fill="#fecaca" stroke="#991b1b" strokeWidth="2" />
        <text x="250" y="50" fontSize="10" fill="#7f1d1d">
          پوسته
        </text>
        <text x="250" y="85" fontSize="10" fill="#9a3412">
          گوشته
        </text>
        <text x="250" y="115" fontSize="10" fill="#991b1b">
          هسته خارجی
        </text>
        <text x="250" y="145" fontSize="10" fill="#7f1d1d">
          هسته داخلی
        </text>
      </svg>
    );
  }

  return null;
}
