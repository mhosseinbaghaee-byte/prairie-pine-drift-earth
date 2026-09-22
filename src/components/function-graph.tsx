import { useMemo } from "react";

type Props = {
  expr: string;
  className?: string;
};

/** عبارت‌های ساده: x, اعداد, + - * / ^, sin cos tan sqrt abs log exp, پرانتز، ضرب ضمنی */
function compile(expr: string): ((x: number) => number) | null {
  let e = expr.trim().toLowerCase().replace(/\s+/g, "");
  if (!e || e.length > 100) return null;

  // یونیکد و نمادهای رایج
  e = e
    .replace(/[²]/g, "^2")
    .replace(/[³]/g, "^3")
    .replace(/[×·]/g, "*")
    .replace(/[÷]/g, "/")
    .replace(/[−–—]/g, "-")
    .replace(/π/g, "pi")
    .replace(/\|/g, ""); // |x| → بعداً abs

  // |x| یا |expr|
  e = e.replace(/\|([^|]+)\|/g, "abs($1)");

  e = e.replace(/\^/g, "**");
  e = e.replace(/\bpi\b/g, "Math.PI");
  e = e.replace(/\be\b(?![a-z])/g, "Math.E");

  // توابع
  e = e.replace(/\blog\b/g, "Math.log10");
  e = e.replace(/\bln\b/g, "Math.log");
  e = e.replace(/\bexp\b/g, "Math.exp");
  e = e.replace(/\bsin\b/g, "Math.sin");
  e = e.replace(/\bcos\b/g, "Math.cos");
  e = e.replace(/\btan\b/g, "Math.tan");
  e = e.replace(/\bsqrt\b/g, "Math.sqrt");
  e = e.replace(/\babs\b/g, "Math.abs");

  // ضرب ضمنی: 2x → 2*x ، 2sin → 2*Math.sin ، )x → )*x ، x( → x*(
  e = e.replace(/(\d)(Math\.|x|\()/g, "$1*$2");
  e = e.replace(/(\))(\d|Math\.|x|\()/g, "$1*$2");
  e = e.replace(/(x)(\()/g, "$1*$2");
  e = e.replace(/(x)(Math\.)/g, "$1*$2");

  // فقط کاراکترهای مجاز
  if (/[^0-9xMath.PIE\+\-\*\/\(\)_,sincotaqrbplg]/.test(e)) return null;

  try {
    const fn = new Function("x", `"use strict"; return (${e});`) as (x: number) => number;
    // چند نقطه تست
    for (const tx of [0.5, 1, -1, 2]) {
      const test = fn(tx);
      if (typeof test !== "number" || Number.isNaN(test)) {
        // 1/x در صفر NaN است — فقط اگر همه نقاط بد باشند رد کن
        continue;
      }
      return fn;
    }
    // حداقل یک نقطه معتبر
    const t0 = fn(1);
    if (typeof t0 === "number" && Number.isFinite(t0)) return fn;
    return null;
  } catch {
    return null;
  }
}

export function FunctionGraph({ expr, className }: Props) {
  const data = useMemo(() => {
    const fn = compile(expr);
    if (!fn) return null;
    const W = 320;
    const H = 200;
    const pad = 24;
    const xMin = -6;
    const xMax = 6;
    const pts: { x: number; y: number }[] = [];
    let yMin = Infinity;
    let yMax = -Infinity;
    const steps = 160;
    for (let i = 0; i <= steps; i++) {
      const x = xMin + ((xMax - xMin) * i) / steps;
      let y: number;
      try {
        y = fn(x);
      } catch {
        continue;
      }
      if (!Number.isFinite(y)) continue;
      // جلوگیری از مقادیر خیلی بزرگ که محور را خراب می‌کند
      if (Math.abs(y) > 1e6) continue;
      pts.push({ x, y });
      yMin = Math.min(yMin, y);
      yMax = Math.max(yMax, y);
    }
    if (pts.length < 2) return null;
    if (yMin === yMax) {
      yMin -= 1;
      yMax += 1;
    }
    // محدود کردن دامنه y برای توابع با مجانب
    const span = yMax - yMin;
    if (span > 40) {
      const mid = (yMin + yMax) / 2;
      yMin = mid - 20;
      yMax = mid + 20;
      // فقط نقاط داخل بازه
      const filtered = pts.filter((p) => p.y >= yMin && p.y <= yMax);
      if (filtered.length >= 2) {
        pts.length = 0;
        pts.push(...filtered);
        yMin = Math.min(...pts.map((p) => p.y));
        yMax = Math.max(...pts.map((p) => p.y));
        if (yMin === yMax) {
          yMin -= 1;
          yMax += 1;
        }
      }
    }
    const yPad = (yMax - yMin) * 0.1 || 0.5;
    yMin -= yPad;
    yMax += yPad;
    const toX = (x: number) => pad + ((x - xMin) / (xMax - xMin)) * (W - 2 * pad);
    const toY = (y: number) => H - pad - ((y - yMin) / (yMax - yMin)) * (H - 2 * pad);
    const d = pts
      .map((p, i) => `${i === 0 ? "M" : "L"}${toX(p.x).toFixed(1)},${toY(p.y).toFixed(1)}`)
      .join(" ");
    const x0 = toX(0);
    const y0 = toY(0);
    return { W, H, d, x0, y0, pad, expr };
  }, [expr]);

  if (!data) {
    return (
      <p className="my-2 text-xs text-fg-muted" dir="rtl">
        نمودار «{expr}» رسم نشد (عبارت ساده‌تر بنویس: مثلاً x^2 یا sin(x) یا 1/x).
      </p>
    );
  }

  return (
    <figure className={className || "my-2"}>
      <svg
        viewBox={`0 0 ${data.W} ${data.H}`}
        className="mx-auto w-full max-w-sm rounded-xl border border-border bg-card"
        role="img"
        aria-label={`نمودار ${data.expr}`}
      >
        <line x1={data.pad} y1={data.y0} x2={data.W - data.pad} y2={data.y0} stroke="#94a3b8" strokeWidth="1" />
        <line x1={data.x0} y1={data.pad} x2={data.x0} y2={data.H - data.pad} stroke="#94a3b8" strokeWidth="1" />
        <path d={data.d} fill="none" stroke="#b91c1c" strokeWidth="2.5" strokeLinejoin="round" />
        <text x={data.W - data.pad} y={data.y0 - 6} textAnchor="end" fontSize="10" fill="#64748b">
          x
        </text>
        <text x={data.x0 + 6} y={data.pad + 10} fontSize="10" fill="#64748b">
          y
        </text>
      </svg>
      <figcaption className="mt-1 text-center text-xs text-fg-muted" dir="ltr">
        y = {data.expr}
      </figcaption>
    </figure>
  );
}
