import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/client/boardui/utils/cx";

const emptyVariants = cva(
  "group/empty flex w-full min-w-0 flex-1 flex-col items-center justify-center gap-4 rounded-2xl border-dashed p-6 text-center text-balance",
  {
    variants: {
      variant: {
        plain: "",
        dashed: "border border-dashed border-border-button-hover",
        card: "border border-solid border-border-button-default bg-background-primary-default text-text-primary shadow-card",
      },
      size: {
        default: "",
        sm: "gap-3 rounded-xl p-4",
        lg: "p-10",
      },
    },
    defaultVariants: {
      variant: "plain",
      size: "default",
    },
  },
);

function Empty({
  className,
  variant,
  size,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof emptyVariants>) {
  return (
    <div
      data-slot="empty"
      data-size={size ?? "default"}
      className={cn(emptyVariants({ variant, size }), className)}
      {...props}
    />
  );
}

function EmptyHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="empty-header"
      className={cn("flex max-w-sm flex-col items-center gap-2", className)}
      {...props}
    />
  );
}

const emptyMediaVariants = cva(
  "mb-2 flex shrink-0 group-data-[size=sm]/empty:mb-0 items-center justify-center [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-transparent",
        icon: "flex size-10 shrink-0 items-center justify-center rounded-full bg-background-tertiary-default text-foreground-icon-secondary [&_svg:not([class*='size-'])]:size-5",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

function EmptyMedia({
  className,
  variant = "default",
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof emptyMediaVariants>) {
  return (
    <div
      data-slot="empty-icon"
      data-variant={variant}
      className={cn(emptyMediaVariants({ variant, className }))}
      {...props}
    />
  );
}

function EmptyTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="empty-title"
      className={cn("text-headline-medium text-text-primary", className)}
      {...props}
    />
  );
}

function EmptyDescription({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="empty-description"
      className={cn(
        "text-body-regular text-text-secondary [&>a]:underline [&>a]:underline-offset-4 [&>a:hover]:text-accent-600",
        className,
      )}
      {...props}
    />
  );
}

function EmptyContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="empty-content"
      className={cn(
        "flex w-full max-w-sm min-w-0 flex-col items-center gap-2.5 text-body-regular text-balance",
        className,
      )}
      {...props}
    />
  );
}

export {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
  EmptyMedia,
};
