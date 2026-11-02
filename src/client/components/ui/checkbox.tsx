import { Checkbox as CheckboxPrimitive } from "@base-ui/react/checkbox";
import { cn } from "@/client/boardui/utils/cx";

function Checkbox({ className, ...props }: CheckboxPrimitive.Root.Props) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        // BoardUI Checkbox (https://www.boardui.com/components/checkbox):
        // white box with a hairline border, filling with the accent gradient
        // and inset highlight when checked or indeterminate.
        "group/checkbox peer relative flex size-4 shrink-0 cursor-pointer items-center justify-center rounded-sm border border-border-checkbox-default bg-background-primary-default text-white shadow-xs transition-[background-color,border-color,box-shadow] duration-150 ease outline-none group-has-disabled/field:opacity-50 group-has-[:focus-visible]/field-label:ring-2 group-has-[:focus-visible]/field-label:ring-border-focus-ring group-has-[:focus-visible]/field-label:ring-offset-2 after:absolute after:-inset-x-3 after:-inset-y-2 hover:border-border-checkbox-hover focus-visible:ring-2 focus-visible:ring-border-focus-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-disabled:cursor-not-allowed data-disabled:opacity-50 aria-invalid:border-border-error-default",
        "data-checked:border-transparent data-checked:bg-linear-to-b data-checked:from-accent-500 data-checked:to-accent-600 data-checked:shadow-checkbox-selected data-checked:hover:from-accent-400 data-checked:hover:to-accent-500",
        "data-indeterminate:border-transparent data-indeterminate:bg-linear-to-b data-indeterminate:from-accent-500 data-indeterminate:to-accent-600 data-indeterminate:shadow-checkbox-selected data-indeterminate:hover:from-accent-400 data-indeterminate:hover:to-accent-500",
        className,
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className="grid place-content-center text-current transition-none"
      >
        <svg viewBox="0 0 16 16" fill="none" aria-hidden className="size-4">
          <path
            className="group-data-indeterminate/checkbox:hidden"
            d="M4 7.7002L6.64645 10.3466C6.84171 10.5419 7.15829 10.5419 7.35355 10.3466L12 5.7002"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            className="hidden group-data-indeterminate/checkbox:block"
            d="M4.5 8H8H11.5"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}

export { Checkbox };
