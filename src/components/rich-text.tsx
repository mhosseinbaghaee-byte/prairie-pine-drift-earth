function inlineFormat(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-medium text-fg">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith("*") && part.endsWith("*")) {
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
    return <span key={i}>{part}</span>;
  });
}

export function RichText({ text }: { text: string }) {
  const blocks = text.replace(/\r/g, "").split(/\n{2,}/);
  return (
    <div className="space-y-3 text-pretty leading-normal text-fg">
      {blocks.map((block, i) => {
        const lines = block.split("\n");
        const isList = lines.every((l) => /^\s*([-*]|\d+\.)\s+/.test(l));
        if (isList) {
          return (
            <ul key={i} className="space-y-1 pr-5">
              {lines.map((l, j) => (
                <li key={j} className="list-disc">
                  {inlineFormat(l.replace(/^\s*([-*]|\d+\.)\s+/, ""))}
                </li>
              ))}
            </ul>
          );
        }
        const heading = block.match(/^(#{1,3})\s+(.*)$/);
        if (heading && lines.length === 1) {
          const Tag = heading[1].length === 1 ? "h3" : "h4";
          return (
            <Tag key={i} className="font-display text-base font-medium tracking-tight">
              {inlineFormat(heading[2])}
            </Tag>
          );
        }
        return (
          <p key={i}>
            {lines.map((l, j) => (
              <span key={j}>
                {j > 0 ? <br /> : null}
                {inlineFormat(l)}
              </span>
            ))}
          </p>
        );
      })}
    </div>
  );
}
