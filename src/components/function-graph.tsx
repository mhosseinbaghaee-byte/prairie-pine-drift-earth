import { useMemo } from "react";

type Props = {
  expr: string;
  className?: string;
};

/** عبارت‌های ساده: x, اعداد, + - * / ^, sin cos tan sqrt abs, پرانتز */
function compile(expr: string): ((x: number) => number) | null {
  let e = expr.trim().toLowerCase().replace(/\s+/g, "");
  if (!e || e.length > 80) return null;
  e = e.replace(/\^/g, "**");
  e = e.replace(/π/g, "Math.PI").replace(/\bpi\b/g, "Math.PI");
  e = e.replace(/sin/g, "Math.sin");
  e = e.replace(/cos/g, "Math.cos");
  e = e.replace(/tan/g, "Math.tan");
  e = e.replace(/sqrt/g, "Math.sqrt");
  e = e.replace(/abs/g, "Math.abs");
  e = e.replace(/(\d)x/g, "$1*x");
  e = e.replace(/\)x/g, ")*x");
  if (/[^0-9xMath.\+\-\*\(\)_,PIsincotaqrb]/.test(e)) return null;
  try {
    const fn = new Function("x", `return (${e});`) as (x: number) => number;
    const test = fn(0.5);
    if (typeof test !== "number" || Number.isNaN(test)) return null;
    return fn;
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
    const steps = 120;
    for (let i = 0; i <= steps; i++) {
      const x = xMin + ((xMax - xMin) * i) / steps;
      let y: number;
      try {
        y = fn(x);
      } catch {
        continue;
      }
      if (!Number.isFinite(y)) continue;
      pts.push({ x, y });
      yMin = Math.min(yMin, y);
      yMax = Math.max(yMax, y);
    }
    if (pts.length < 2) return null;
    if (yMin === yMax) {
      yMin -= 1;
      yMax += 1;
    }
    const yPad = (yMax - yMin) * 0.1;
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
        نمودار «{expr}» رسم نشد (عبارت ساده‌تر بنویس: مثلاً x^2 یا sin(x)).
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
