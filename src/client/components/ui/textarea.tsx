import * as React from "react";
import { cn } from "@/client/boardui/utils/cx";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-16 w-full px-3 py-2 text-base font-sans md:text-body-regular rounded-2lg border-0 bg-background-tertiary-default text-text-primary ring-2 ring-transparent transition-[background-color,box-shadow,color] outline-none ring-inset placeholder:text-text-tertiary hover:ring-border-button-hover focus-visible:ring-border-button-active disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input-disabled-background disabled:text-input-disabled-text aria-invalid:bg-background-tertiary-error aria-invalid:ring-border-error-default",
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
