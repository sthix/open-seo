import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/client/boardui/utils/cx";
import { Spinner } from "@/client/components/ui/spinner";

/**
 * BoardUI Button (https://www.boardui.com/components/button) on Base UI's
 * button primitive. Variant names stay shadcn-style so call sites keep
 * working; they map to BoardUI as:
 *   default → Primary (accent gradient)   outline → Secondary
 *   secondary → soft neutral fill          ghost → Icon Button surface
 *   destructive → Danger (red gradient)    link → Link Button
 * Sizes follow BoardUI's Medium (h-9) / Small (h-8) / Xs (h-6) ladder.
 */
const buttonVariants = cva(
  "group/button button-press-motion inline-flex shrink-0 cursor-pointer items-center justify-center gap-1.5 border border-transparent font-sans whitespace-nowrap outline-none select-none focus-visible:ring-2 focus-visible:ring-border-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:cursor-not-allowed aria-invalid:border-border-error-default [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "bg-button-primary text-text-white shadow-xs disabled:text-button-primary-disabled-foreground disabled:shadow-none",
        outline:
          "border-border-button-default bg-background-primary-default text-text-primary shadow-xs hover:border-border-button-hover hover:bg-background-primary-hover active:border-border-button-active active:bg-background-primary-active aria-expanded:bg-background-primary-hover disabled:bg-background-primary-disabled disabled:text-text-tertiary disabled:shadow-none",
        secondary:
          "bg-background-tertiary-default text-text-primary hover:bg-background-tertiary-hover aria-expanded:bg-background-tertiary-hover disabled:text-text-tertiary",
        ghost:
          "text-text-primary hover:bg-dropdown-item-hover-background aria-expanded:bg-dropdown-item-hover-background disabled:text-text-tertiary",
        destructive:
          "bg-button-danger text-text-white shadow-xs disabled:text-foreground-disabled-danger disabled:shadow-none",
        link: "h-auto! border-0 p-0! text-accent-600 underline-offset-4 hover:underline dark:text-accent-400",
      },
      size: {
        default: "h-9 rounded-2lg px-3 text-body-medium",
        xs: "h-6 gap-1 rounded-sm px-2 text-caption-1-semibold [&_svg:not([class*='size-'])]:size-3.5",
        sm: "h-8 gap-1 rounded-lg px-2.5 text-body-medium [&_svg:not([class*='size-'])]:size-4",
        lg: "h-10 gap-2 rounded-xl px-4 text-body-medium [&_svg:not([class*='size-'])]:size-5",
        icon: "size-9 rounded-2lg [&_svg:not([class*='size-'])]:size-5",
        "icon-xs": "size-6 rounded-sm [&_svg:not([class*='size-'])]:size-3.5",
        "icon-sm":
          "size-8 rounded-lg [&_svg:not([class*='size-'])]:size-[18px]",
        "icon-lg": "size-10 rounded-xl [&_svg:not([class*='size-'])]:size-5",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant = "default",
  size = "default",
  pending = false,
  disabled,
  children,
  ...props
}: ButtonPrimitive.Props &
  VariantProps<typeof buttonVariants> & {
    /** Disables the button and shows a spinner before the label while a mutation runs. */
    pending?: boolean;
  }) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      disabled={disabled || pending}
      aria-busy={pending || undefined}
      {...props}
    >
      {pending ? <Spinner data-icon="inline-start" /> : null}
      {children}
    </ButtonPrimitive>
  );
}

export { Button, buttonVariants };
