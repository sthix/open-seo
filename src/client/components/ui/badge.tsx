import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/client/boardui/utils/cx";

/**
 * BoardUI Chip (https://www.boardui.com/components/chip): soft status chips on
 * BoardUI's status palette. shadcn variant names are kept for call sites.
 */
const badgeVariants = cva(
  "group/badge inline-flex h-5 w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-md border border-transparent px-1.5 py-0.5 text-caption-1-medium whitespace-nowrap transition-colors focus-visible:ring-2 focus-visible:ring-border-focus-ring has-data-[icon=inline-end]:pe-1 has-data-[icon=inline-start]:ps-1 aria-invalid:border-border-error-default [&>svg]:pointer-events-none [&>svg]:size-3!",
  {
    variants: {
      variant: {
        default: "bg-accent-500 text-white [a]:hover:bg-accent-600",
        /** A primary tint, for labels such as "Paid plan" that should not shout. */
        soft: "bg-status-blue-background text-status-blue-text",
        secondary:
          "bg-background-tertiary-default text-text-secondary [a]:hover:bg-background-tertiary-hover",
        destructive: "bg-status-rose-background text-status-rose-text",
        outline:
          "border-border-button-default bg-background-primary-default text-text-primary [a]:hover:bg-background-primary-hover",
        success: "bg-status-lime-background text-status-lime-text",
        warning: "bg-status-yellow-background text-status-yellow-text",
        info: "bg-status-cyan-background text-status-cyan-text",
        ghost: "text-text-secondary hover:bg-dropdown-item-hover-background",
        link: "text-accent-600 underline-offset-4 hover:underline",
      },
      size: {
        default: "",
        sm: "h-4 rounded-sm px-1 py-px text-caption-2-medium",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Badge({
  className,
  variant = "default",
  size = "default",
  render,
  ...props
}: useRender.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return useRender({
    defaultTagName: "span",
    props: mergeProps<"span">(
      {
        className: cn(badgeVariants({ variant, size }), className),
      },
      props,
    ),
    render,
    state: {
      slot: "badge",
      variant,
    },
  });
}

export { Badge, badgeVariants };
