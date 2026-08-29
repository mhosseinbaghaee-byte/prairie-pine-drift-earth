import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium select-none transition-[transform,background-color,opacity,color] duration-quick ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-45 active:not-disabled:scale-[0.96]",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-ink",
        cream: "bg-cream text-ink hover:bg-cream-deep",
        outline:
          "border border-border bg-transparent text-fg hover:bg-surface",
        ghost: "text-fg-muted hover:bg-surface hover:text-fg",
        stage: "bg-stage-deep text-cream hover:bg-ink",
      },
      size: {
        default: "h-11 min-h-11 rounded-md px-4 text-sm",
        sm: "h-9 min-h-9 rounded-sm px-3 text-sm",
        lg: "h-12 min-h-12 rounded-lg px-5 text-base",
        icon: "size-11 min-h-11 rounded-md",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

export function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp className={cn(buttonVariants({ variant, size }), className)} {...props} />
  );
}
