import { Radio as RadioPrimitive } from "@base-ui/react/radio";
import { RadioGroup as RadioGroupPrimitive } from "@base-ui/react/radio-group";
import { cn } from "@/client/boardui/utils/cx";

function RadioGroup({ className, ...props }: RadioGroupPrimitive.Props) {
  return (
    <RadioGroupPrimitive
      data-slot="radio-group"
      className={cn("grid w-full gap-2", className)}
      {...props}
    />
  );
}

function RadioGroupItem({ className, ...props }: RadioPrimitive.Root.Props) {
  return (
    <RadioPrimitive.Root
      data-slot="radio-group-item"
      className={cn(
        // BoardUI Radio (https://www.boardui.com/components/radio): white dot
        // with a hairline border; selected fills with the accent gradient and
        // a white centre.
        "group/radio-group-item peer relative flex aspect-square size-4 shrink-0 cursor-pointer items-center justify-center rounded-full border border-border-checkbox-default bg-background-primary-default shadow-xs transition-[background-color,border-color,box-shadow] duration-150 ease outline-none group-has-[:focus-visible]/field-label:ring-2 group-has-[:focus-visible]/field-label:ring-border-focus-ring group-has-[:focus-visible]/field-label:ring-offset-2 after:absolute after:-inset-x-3 after:-inset-y-2 hover:border-border-checkbox-hover focus-visible:ring-2 focus-visible:ring-border-focus-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-disabled:cursor-not-allowed data-disabled:opacity-50 aria-invalid:border-border-error-default",
        "data-checked:border-transparent data-checked:bg-linear-to-b data-checked:from-accent-500 data-checked:to-accent-600 data-checked:shadow-[inset_0px_0px_0px_1px_var(--color-accent-500),inset_0px_2px_0px_0px_rgba(255,255,255,0.25)]",
        className,
      )}
      {...props}
    >
      <RadioPrimitive.Indicator
        data-slot="radio-group-indicator"
        className="flex size-4 items-center justify-center"
      >
        <span className="absolute top-1/2 left-1/2 size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-control-indicator-background" />
      </RadioPrimitive.Indicator>
    </RadioPrimitive.Root>
  );
}

export { RadioGroup, RadioGroupItem };
