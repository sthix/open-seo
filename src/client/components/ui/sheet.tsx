import * as React from "react";
import { Dialog as SheetPrimitive } from "@base-ui/react/dialog";
import { cn } from "@/client/boardui/utils/cx";

import { Button } from "@/client/components/ui/button";
import { XIcon } from "lucide-react";

function Sheet({ ...props }: SheetPrimitive.Root.Props) {
  return <SheetPrimitive.Root data-slot="sheet" {...props} />;
}

function SheetTrigger({ ...props }: SheetPrimitive.Trigger.Props) {
  return <SheetPrimitive.Trigger data-slot="sheet-trigger" {...props} />;
}

function SheetClose({ ...props }: SheetPrimitive.Close.Props) {
  return <SheetPrimitive.Close data-slot="sheet-close" {...props} />;
}

function SheetPortal({ ...props }: SheetPrimitive.Portal.Props) {
  return <SheetPrimitive.Portal data-slot="sheet-portal" {...props} />;
}

function SheetOverlay({ className, ...props }: SheetPrimitive.Backdrop.Props) {
  return (
    <SheetPrimitive.Backdrop
      data-slot="sheet-overlay"
      className={cn(
        "fixed inset-0 z-50 bg-black/40 transition-opacity duration-300 ease-out data-ending-style:opacity-0 data-starting-style:opacity-0",
        className,
      )}
      {...props}
    />
  );
}

function SheetContent({
  className,
  children,
  side = "right",
  showCloseButton = true,
  ...props
}: SheetPrimitive.Popup.Props & {
  side?: "top" | "right" | "bottom" | "left";
  showCloseButton?: boolean;
}) {
  return (
    <SheetPortal>
      <SheetOverlay />
      <SheetPrimitive.Popup
        data-slot="sheet-content"
        data-side={side}
        className={cn(
          "fixed z-50 flex flex-col gap-4 overflow-hidden rounded-3xl border border-separator-border bg-background-full text-body-regular text-text-primary shadow-xs outline-none transform-gpu transition-[translate,filter,opacity] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] motion-safe:data-ending-style:blur-[4px] motion-safe:data-starting-style:blur-[4px] motion-reduce:data-ending-style:opacity-0 motion-reduce:data-starting-style:opacity-0 data-[side=bottom]:inset-x-2 data-[side=bottom]:bottom-2 data-[side=bottom]:h-auto data-[side=bottom]:max-h-[85%] data-[side=bottom]:data-ending-style:translate-y-[calc(100%+24px)] data-[side=bottom]:data-starting-style:translate-y-[calc(100%+24px)] data-[side=top]:inset-x-2 data-[side=top]:top-2 data-[side=top]:h-auto data-[side=top]:max-h-[85%] data-[side=top]:data-ending-style:-translate-y-[calc(100%+24px)] data-[side=top]:data-starting-style:-translate-y-[calc(100%+24px)] data-[side=left]:inset-y-2 data-[side=left]:left-2 data-[side=left]:w-[calc(75%-0.5rem)] data-[side=left]:data-ending-style:-translate-x-[calc(100%+24px)] data-[side=left]:data-starting-style:-translate-x-[calc(100%+24px)] data-[side=right]:inset-y-2 data-[side=right]:right-2 data-[side=right]:w-[calc(75%-0.5rem)] data-[side=right]:data-ending-style:translate-x-[calc(100%+24px)] data-[side=right]:data-starting-style:translate-x-[calc(100%+24px)] sm:data-[side=bottom]:inset-x-3 sm:data-[side=bottom]:bottom-3 sm:data-[side=top]:inset-x-3 sm:data-[side=top]:top-3 sm:data-[side=left]:inset-y-3 sm:data-[side=left]:left-3 sm:data-[side=right]:inset-y-3 sm:data-[side=right]:right-3 data-[side=left]:sm:max-w-[400px] data-[side=right]:sm:max-w-[400px]",
          className,
        )}
        {...props}
      >
        {children}
        {showCloseButton && (
          <SheetPrimitive.Close
            data-slot="sheet-close"
            render={
              <Button
                variant="ghost"
                className="absolute top-4 right-4 text-foreground-icon-secondary hover:text-foreground-icon-primary"
                size="icon-sm"
              />
            }
          >
            <XIcon />
            <span className="sr-only">Close</span>
          </SheetPrimitive.Close>
        )}
      </SheetPrimitive.Popup>
    </SheetPortal>
  );
}

function SheetHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-header"
      className={cn("flex flex-col gap-1 px-6 pt-6 pb-2 pe-14", className)}
      {...props}
    />
  );
}

function SheetFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-footer"
      className={cn("mt-auto flex flex-col gap-2 px-6 pb-6 pt-2", className)}
      {...props}
    />
  );
}

function SheetTitle({ className, ...props }: SheetPrimitive.Title.Props) {
  return (
    <SheetPrimitive.Title
      data-slot="sheet-title"
      className={cn("text-title-3-medium text-text-primary", className)}
      {...props}
    />
  );
}

function SheetDescription({
  className,
  ...props
}: SheetPrimitive.Description.Props) {
  return (
    <SheetPrimitive.Description
      data-slot="sheet-description"
      className={cn("text-body-regular text-text-secondary", className)}
      {...props}
    />
  );
}

export {
  Sheet,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
};
