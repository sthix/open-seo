"use client";

import { Switch as SwitchPrimitive } from "@base-ui/react/switch";
import { cn } from "@/client/boardui/utils/cx";

function Switch({
  className,
  size = "default",
  ...props
}: SwitchPrimitive.Root.Props & {
  size?: "sm" | "default";
}) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      data-size={size}
      className={cn(
        // BoardUI Switch (https://www.boardui.com/components/switch):
        // sunken neutral track that fills with the accent gradient, carrying a
        // raised white thumb with an embossed chip. default = BoardUI sm,
        // sm is a step smaller.
        "peer group/switch relative inline-flex shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 ease outline-none after:absolute after:-inset-x-3 after:-inset-y-2 focus-visible:ring-2 focus-visible:ring-border-focus-ring focus-visible:ring-offset-2 group-has-[:focus-visible]/field-label:ring-2 group-has-[:focus-visible]/field-label:ring-border-focus-ring group-has-[:focus-visible]/field-label:ring-offset-2 aria-invalid:ring-2 aria-invalid:ring-border-error-default data-[size=default]:h-4 data-[size=default]:w-7 data-[size=sm]:h-3.5 data-[size=sm]:w-6",
        "data-unchecked:bg-background-tertiary-default data-checked:bg-linear-to-b data-checked:from-accent-500 data-checked:to-accent-600 data-checked:shadow-[inset_0_1px_0_0_rgb(255_255_255/0.25),inset_0_0_0_0.5px_var(--color-accent-500)] data-disabled:cursor-not-allowed data-disabled:opacity-50",
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className="pointer-events-none flex items-center justify-center rounded-full bg-linear-to-b from-control-indicator-background from-[43.837%] to-control-indicator-background-subtle shadow-[0_3px_3px_0_rgb(0_0_0/0.03),0_0.75px_0_0_rgb(0_0_0/0.05)] transition-transform duration-200 ease group-data-[size=default]/switch:ms-0.5 group-data-[size=default]/switch:size-3 group-data-[size=sm]/switch:ms-px group-data-[size=sm]/switch:size-2.5 group-data-[size=default]/switch:data-checked:translate-x-3 group-data-[size=sm]/switch:data-checked:translate-x-2.5 rtl:group-data-[size=default]/switch:data-checked:-translate-x-3 rtl:group-data-[size=sm]/switch:data-checked:-translate-x-2.5 data-unchecked:translate-x-0"
      >
        <span className="size-[5px] rounded-full border-[0.25px] border-solid border-border-button-default/50 bg-linear-to-t from-switch-off-chip-start from-[43.837%] to-switch-off-chip-end shadow-[0_2px_2px_0_rgb(0_0_0/0.03)] group-data-checked/switch:border-accent-600 group-data-checked/switch:from-switch-on-chip-start group-data-checked/switch:to-switch-on-chip-end" />
      </SwitchPrimitive.Thumb>
    </SwitchPrimitive.Root>
  );
}

export { Switch };
