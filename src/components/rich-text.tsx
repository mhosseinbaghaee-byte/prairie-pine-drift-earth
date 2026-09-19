import { Fragment, useEffect, useState, type ReactNode } from "react";
import { LessonDiagramSvg } from "./lesson-diagram-svg";
import { diagramById } from "../lib/lesson-diagrams";
import { FunctionGraph } from "./function-graph";

function ZoomableImage({
  src,
  alt,
  className,
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="block w-full cursor-zoom-in border-0 bg-transparent p-0 text-start"
        aria-label={`بزرگ‌نمایی: ${alt}`}
      >
        <img src={src} alt={alt} className={className} loading="lazy" referrerPolicy="no-referrer" />
        <span className="mt-0.5 block text-center text-[10px] text-fg-subtle">برای بزرگ‌نمایی لمس کن</span>
      </button>
      {open ? (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/85 p-3"
          onClick={() => setOpen(false)}
        >
          <button
            type="button"
            className="absolute end-3 top-3 rounded-full bg-white/90 px-3 py-1 text-sm text-ink"
            onClick={() => setOpen(false)}
          >
            بستن
          </button>
          <img
            src={src}
            alt={alt}
            className="max-h-[92dvh] max-w-[96vw] object-contain"
            onClick={(e) => e.stopPropagation()}
            referrerPolicy="no-referrer"
          />
        </div>
      ) : null}
    </>
  );
}

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

function DiagramBlock({ id }: { id: string }) {
  const meta = diagramById(id.trim().toLowerCase());
  const svg = <LessonDiagramSvg id={id} />;
  const gallery = meta?.imageGallery?.filter((g) => g.url) || [];
  const single = meta?.imageUrl;

  if (!svg && !single && gallery.length === 0) return null;

  return (
    <figure className="my-2 space-y-2">
      {gallery.length > 0 ? (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          {gallery.map((g) => (
            <div key={g.url} className="overflow-hidden rounded-xl border border-border/40 bg-white">
              <ZoomableImage src={g.url} alt={g.label} className="mx-auto max-h-48 w-full object-contain" />
              <p className="border-t border-border/30 px-1 py-1 text-center text-[11px] text-fg-muted">{g.label}</p>
            </div>
          ))}
        </div>
      ) : single ? (
        <div className="overflow-hidden rounded-xl border border-border/40 bg-white">
          <ZoomableImage
            src={single}
            alt={meta?.title || id}
            className="mx-auto max-h-72 w-auto max-w-full object-contain sm:max-h-96"
          />
        </div>
      ) : (
        svg
      )}
      {meta?.caption ? (
        <figcaption className="text-center text-[11px] text-muted">{meta.caption}</figcaption>
      ) : null}
      {meta?.attribution ? (
        <figcaption className="text-center text-[10px] text-fg-subtle">{meta.attribution}</figcaption>
      ) : null}
    </figure>
  );
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

const DIAGRAM_RE = /\[diagram:([^\]]+)\]/i;
const GRAPH_RE = /\[graph:([^\]]+)\]/i;
const SHAPE_RE = /\[shape:[^\]]+\]|```shape:[^`]+```/i;

export function RichText({ text }: { text: string }) {
  const blocks = text.split(/\n{2,}/);
  return (
    <div className="space-y-2 text-pretty">
      {blocks.map((block, bi) => {
        const diagramOnly = block.match(/^\s*\[diagram:([^\]]+)\]\s*$/i);
        if (diagramOnly) {
          return (
            <div key={bi}>
              <DiagramBlock id={diagramOnly[1]} />
            </div>
          );
        }

        const shapeMatch =
          block.match(/^\s*```shape:([^\n`]+)```\s*$/i) || block.match(/^\s*\[shape:([^\]]+)\]\s*$/i);
        if (shapeMatch) {
          const svg = <ShapeSvg kind={shapeMatch[1]} />;
          if (svg) return <div key={bi}>{svg}</div>;
        }

        const graphMatch = block.match(/^\s*\[graph:([^\]]+)\]\s*$/i);
        if (graphMatch) {
          return (
            <div key={bi}>
              <FunctionGraph expr={graphMatch[1]} />
            </div>
          );
        }

        if (DIAGRAM_RE.test(block) || SHAPE_RE.test(block) || GRAPH_RE.test(block)) {
          const pieces = block.split(/(\[diagram:[^\]]+\]|\[shape:[^\]]+\]|\[graph:[^\]]+\]|```shape:[^`]+```)/gi);
          return (
            <div key={bi} className="space-y-1">
              {pieces.map((p, pi) => {
                const dm = p.match(/^\[diagram:([^\]]+)\]$/i);
                if (dm) return <DiagramBlock key={pi} id={dm[1]} />;
                const gm = p.match(/^\[graph:([^\]]+)\]$/i);
                if (gm) return <FunctionGraph key={pi} expr={gm[1]} />;
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
                    <ZoomableImage
                      key={pi}
                      src={im[2]}
                      alt={im[1] || "تصویر آموزشی"}
                      className="my-1 max-h-56 w-auto max-w-full rounded-xl border border-border/40 object-contain"
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
