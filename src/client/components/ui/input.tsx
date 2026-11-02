import * as React from "react";
import { Input as InputPrimitive } from "@base-ui/react/input";
import { cn } from "@/client/boardui/utils/cx";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        "h-9 w-full min-w-0 px-3 py-2 text-base font-sans md:text-body-regular file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-body-medium file:text-text-primary rounded-2lg border-0 bg-background-tertiary-default text-text-primary ring-2 ring-transparent transition-[background-color,box-shadow,color] outline-none ring-inset placeholder:text-text-tertiary hover:ring-border-button-hover focus-visible:ring-border-button-active disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input-disabled-background disabled:text-input-disabled-text aria-invalid:bg-background-tertiary-error aria-invalid:ring-border-error-default",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
