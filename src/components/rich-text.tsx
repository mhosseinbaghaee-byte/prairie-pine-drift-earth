import { Fragment, type ReactNode } from "react";

function ShapeSvg({ kind }: { kind: string }) {
  const k = kind.trim().toLowerCase();
  const common = { width: 160, height: 120, className: "my-2 rounded-lg border border-border/40 bg-white" } as const;
  if (k === "circle" || k === "دایره") {
    return (
      <svg {...common} viewBox="0 0 160 120" aria-label="دایره">
        <circle cx="80" cy="60" r="42" fill="#fee2e2" stroke="#b91c1c" strokeWidth="3" />
      </svg>
    );
  }
  if (k === "square" || k === "مربع") {
    return (
      <svg {...common} viewBox="0 0 160 120" aria-label="مربع">
        <rect x="40" y="20" width="80" height="80" fill="#fee2e2" stroke="#b91c1c" strokeWidth="3" />
      </svg>
    );
  }
  if (k === "rectangle" || k === "مستطیل") {
    return (
      <svg {...common} viewBox="0 0 160 120" aria-label="مستطیل">
        <rect x="25" y="30" width="110" height="60" fill="#fee2e2" stroke="#b91c1c" strokeWidth="3" />
      </svg>
    );
  }
  if (k === "triangle" || k === "مثلث") {
    return (
      <svg {...common} viewBox="0 0 160 120" aria-label="مثلث">
        <polygon points="80,18 140,100 20,100" fill="#fee2e2" stroke="#b91c1c" strokeWidth="3" />
      </svg>
    );
  }
  if (k === "rhombus" || k === "diamond" || k === "لوزی") {
    return (
      <svg {...common} viewBox="0 0 160 120" aria-label="لوزی">
        <polygon points="80,12 140,60 80,108 20,60" fill="#fee2e2" stroke="#b91c1c" strokeWidth="3" />
      </svg>
    );
  }
  if (k === "parallelogram" || k === "متوازی‌الاضلاع" || k === "متوازی الاضلاع") {
    return (
      <svg {...common} viewBox="0 0 160 120" aria-label="متوازی‌الاضلاع">
        <polygon points="40,25 140,25 120,95 20,95" fill="#fee2e2" stroke="#b91c1c" strokeWidth="3" />
      </svg>
    );
  }
  if (k === "trapezoid" || k === "ذوزنقه") {
    return (
      <svg {...common} viewBox="0 0 160 120" aria-label="ذوزنقه">
        <polygon points="45,25 115,25 140,95 20,95" fill="#fee2e2" stroke="#b91c1c" strokeWidth="3" />
      </svg>
    );
  }
  if (k === "pentagon" || k === "پنج‌ضلعی" || k === "پنج ضلعی") {
    return (
      <svg {...common} viewBox="0 0 160 120" aria-label="پنج‌ضلعی">
        <polygon points="80,12 135,45 115,102 45,102 25,45" fill="#fee2e2" stroke="#b91c1c" strokeWidth="3" />
      </svg>
    );
  }
  if (k === "hexagon" || k === "شش‌ضلعی" || k === "شش ضلعی") {
    return (
      <svg {...common} viewBox="0 0 160 120" aria-label="شش‌ضلعی">
        <polygon points="50,18 110,18 140,60 110,102 50,102 20,60" fill="#fee2e2" stroke="#b91c1c" strokeWidth="3" />
      </svg>
    );
  }
  return null;
}

function inlineFormat(text: string): ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-medium text-fg">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith("*") && part.endsWith("*") && part.length > 2) {
      return (
        <em key={i} className="italic">
          {part.slice(1, -1)}
        </em>
      );
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code key={i} className="rounded-xs bg-surface px-1 py-0.5 font-mono text-[0.85em]">
          {part.slice(1, -1)}
        </code>
      );
    }
    return <Fragment key={i}>{part}</Fragment>;
  });
}

export function RichText({ text }: { text: string }) {
  const blocks = text.split(/\n{2,}/);
  return (
    <div className="space-y-2 text-pretty">
      {blocks.map((block, bi) => {
        const shapeMatch =
          block.match(/^\s*```shape:([^\n`]+)```\s*$/i) || block.match(/^\s*\[shape:([^\]]+)\]\s*$/i);
        if (shapeMatch) {
          const svg = <ShapeSvg kind={shapeMatch[1]} />;
          if (svg) return <div key={bi}>{svg}</div>;
        }
        if (/\[shape:[^\]]+\]/i.test(block) || /```shape:[^`]+```/i.test(block)) {
          const pieces = block.split(/(\[shape:[^\]]+\]|```shape:[^`]+```)/gi);
          return (
            <div key={bi} className="space-y-1">
              {pieces.map((p, pi) => {
                const m = p.match(/^\[shape:([^\]]+)\]$/i) || p.match(/^```shape:([^`]+)```$/i);
                if (m) return <ShapeSvg key={pi} kind={m[1]} />;
                if (!p.trim()) return null;
                return (
                  <p key={pi} className="leading-normal">
                    {inlineFormat(p)}
                  </p>
                );
              })}
            </div>
          );
        }
        if (/!\[[^\]]*\]\([^)]+\)/.test(block)) {
          const pieces = block.split(/(!\[[^\]]*\]\([^)]+\))/g);
          return (
            <div key={bi} className="space-y-2">
              {pieces.map((p, pi) => {
                const im = p.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
                if (im) {
                  return (
                    <img
                      key={pi}
                      src={im[2]}
                      alt={im[1] || "تصویر آموزشی"}
                      className="my-1 max-h-56 w-auto max-w-full rounded-xl border border-border/40 object-contain"
                      loading="lazy"
                      referrerPolicy="no-referrer"
                    />
                  );
                }
                if (!p.trim()) return null;
                return (
                  <p key={pi} className="leading-normal">
                    {inlineFormat(p)}
                  </p>
                );
              })}
            </div>
          );
        }
        const lines = block.split("\n");
        if (lines.every((l) => /^\s*[-*•]\s+/.test(l) || !l.trim())) {
          return (
            <ul key={bi} className="list-disc space-y-1 ps-5">
              {lines
                .filter((l) => l.trim())
                .map((l, li) => (
                  <li key={li}>{inlineFormat(l.replace(/^\s*[-*•]\s+/, ""))}</li>
                ))}
            </ul>
          );
        }
        return (
          <p key={bi} className="leading-normal whitespace-pre-wrap">
            {inlineFormat(block)}
          </p>
        );
      })}
    </div>
  );
}
