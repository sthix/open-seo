import { Accordion as AccordionPrimitive } from "@base-ui/react/accordion";
import { cn } from "@/client/boardui/utils/cx";

import { ChevronDownIcon } from "lucide-react";

function Accordion({ className, ...props }: AccordionPrimitive.Root.Props) {
  return (
    <AccordionPrimitive.Root
      data-slot="accordion"
      className={cn("flex w-full flex-col", className)}
      {...props}
    />
  );
}

function AccordionItem({ className, ...props }: AccordionPrimitive.Item.Props) {
  return (
    <AccordionPrimitive.Item
      data-slot="accordion-item"
      className={cn(
        "group/accordion-item border-separator-border not-last:border-b",
        className,
      )}
      {...props}
    />
  );
}

function AccordionTrigger({
  className,
  children,
  ...props
}: AccordionPrimitive.Trigger.Props) {
  return (
    <AccordionPrimitive.Header className="flex">
      <AccordionPrimitive.Trigger
        data-slot="accordion-trigger"
        className={cn(
          "group/accordion-trigger relative flex flex-1 cursor-pointer items-center justify-between gap-3 rounded-lg py-4 text-start text-headline-medium text-text-primary outline-none focus-visible:ring-2 focus-visible:ring-border-focus-ring focus-visible:ring-inset aria-disabled:pointer-events-none aria-disabled:opacity-50 **:data-[slot=accordion-trigger-icon]:ms-auto **:data-[slot=accordion-trigger-icon]:size-5 **:data-[slot=accordion-trigger-icon]:text-foreground-icon-tertiary hover:**:data-[slot=accordion-trigger-icon]:text-foreground-icon-secondary aria-expanded:**:data-[slot=accordion-trigger-icon]:text-foreground-icon-primary",
          className,
        )}
        {...props}
      >
        {children}
        <ChevronDownIcon
          data-slot="accordion-trigger-icon"
          className="pointer-events-none shrink-0 transition-[rotate,color] duration-300 group-aria-expanded/accordion-trigger:rotate-180 motion-reduce:transition-none"
        />
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  );
}

function AccordionContent({
  className,
  children,
  ...props
}: AccordionPrimitive.Panel.Props) {
  return (
    <AccordionPrimitive.Panel
      data-slot="accordion-content"
      className="h-(--accordion-panel-height) overflow-clip text-body-regular text-text-secondary transition-[height] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] data-ending-style:h-0 data-starting-style:h-0 motion-reduce:transition-none"
      {...props}
    >
      <div
        className={cn(
          "pt-0 pb-4 transition-[opacity,translate,filter] duration-300 group-data-[closed]/accordion-item:opacity-0 motion-safe:group-data-[closed]/accordion-item:-translate-y-1 motion-safe:group-data-[closed]/accordion-item:blur-[4px] motion-reduce:transition-none [&_a]:underline [&_a]:underline-offset-3 [&_a]:hover:text-text-primary [&_p:not(:last-child)]:mb-4",
          className,
        )}
      >
        {children}
      </div>
    </AccordionPrimitive.Panel>
  );
}

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent };
