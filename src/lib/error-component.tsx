import type { ErrorComponentProps } from "@tanstack/react-router";
import { TriangleAlert } from "lucide-react";

export function AppErrorComponent({ error }: ErrorComponentProps) {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-background px-6 text-center text-fg">
      <span className="text-stage" aria-hidden="true">
        <TriangleAlert className="size-10" strokeWidth={2} />
      </span>
      <h1 className="font-display text-lg font-medium">مشکلی پیش آمد</h1>
      <p className="max-w-md text-sm break-words text-fg-muted">
        {error.message || "یک خطای غیرمنتظره رخ داد. صفحه را دوباره بارگذاری کن."}
      </p>
    </main>
  );
}
