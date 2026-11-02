import { Toggle as TogglePrimitive } from "@base-ui/react/toggle";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/client/boardui/utils/cx";

/**
 * BoardUI Pill Tab / Segmented Control item look
 * (https://www.boardui.com/components/segmented-control): neutral text that
 * lifts to a raised white pill when pressed.
 */
const toggleVariants = cva(
  "group/toggle inline-flex cursor-pointer items-center justify-center gap-1 rounded-2lg text-body-regular whitespace-nowrap text-text-secondary transition-[color,background-color,box-shadow] duration-200 ease outline-none hover:text-text-primary focus-visible:ring-2 focus-visible:ring-border-focus-ring disabled:pointer-events-none disabled:opacity-50 aria-invalid:ring-2 aria-invalid:ring-border-error-default aria-pressed:bg-segmented-control-selected-background aria-pressed:text-body-medium aria-pressed:text-text-primary aria-pressed:shadow-2xs data-[state=on]:bg-segmented-control-selected-background data-[state=on]:text-text-primary [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-transparent hover:bg-background-primary-hover",
        outline:
          "border border-border-button-default bg-background-primary-default shadow-xs hover:border-border-button-hover hover:bg-background-primary-hover aria-pressed:border-border-button-active",
      },
      size: {
        default: "h-9 min-w-9 px-2.5",
        sm: "h-7 min-w-7 rounded-md px-2 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-10 min-w-10 rounded-xl px-3 text-body-medium",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Toggle({
  className,
  variant = "default",
  size = "default",
  ...props
}: TogglePrimitive.Props & VariantProps<typeof toggleVariants>) {
  return (
    <TogglePrimitive
      data-slot="toggle"
      className={cn(toggleVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Toggle, toggleVariants };
