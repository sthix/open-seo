"use client";

import { Tabs as TabsPrimitive } from "@base-ui/react/tabs";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/client/boardui/utils/cx";

function Tabs({
  className,
  orientation = "horizontal",
  ...props
}: TabsPrimitive.Root.Props) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      data-orientation={orientation}
      className={cn(
        "group/tabs flex gap-2 data-horizontal:flex-col",
        className,
      )}
      {...props}
    />
  );
}

/**
 * BoardUI tabs (https://www.boardui.com/components/tabs).
 *   default → Segmented Control: sunken track, raised white pill on the
 *             active tab.
 *   line    → Underline tabs: hairline separator with an accent-600
 *             indicator under the active tab.
 */
const tabsListVariants = cva(
  "group/tabs-list inline-flex w-fit items-center justify-center text-text-secondary group-data-vertical/tabs:h-fit group-data-vertical/tabs:flex-col",
  {
    variants: {
      variant: {
        default:
          "gap-0.5 rounded-2lg bg-segmented-control-background p-1 group-data-horizontal/tabs:h-9",
        line: "gap-1 rounded-none bg-transparent group-data-horizontal/tabs:border-b group-data-horizontal/tabs:border-separator-border group-data-vertical/tabs:border-e group-data-vertical/tabs:border-separator-border",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

function TabsList({
  className,
  variant = "default",
  ...props
}: TabsPrimitive.List.Props & VariantProps<typeof tabsListVariants>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      data-variant={variant}
      className={cn(tabsListVariants({ variant }), className)}
      {...props}
    />
  );
}

function TabsTrigger({ className, ...props }: TabsPrimitive.Tab.Props) {
  return (
    <TabsPrimitive.Tab
      data-slot="tabs-trigger"
      className={cn(
        "relative inline-flex flex-1 cursor-pointer items-center justify-center gap-1.5 whitespace-nowrap text-body-regular text-text-secondary transition-[color,background-color,box-shadow] duration-200 ease outline-none group-data-vertical/tabs:w-full group-data-vertical/tabs:justify-start hover:text-text-primary focus-visible:ring-2 focus-visible:ring-border-focus-ring disabled:pointer-events-none disabled:opacity-50 has-data-[icon=inline-end]:pe-1.5 has-data-[icon=inline-start]:ps-1.5 aria-disabled:pointer-events-none aria-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        // Segmented control (default)
        "group-data-[variant=default]/tabs-list:h-full group-data-[variant=default]/tabs-list:rounded-md group-data-[variant=default]/tabs-list:px-2.5 group-data-[variant=default]/tabs-list:py-1 group-data-[variant=default]/tabs-list:data-active:bg-segmented-control-selected-background group-data-[variant=default]/tabs-list:data-active:text-body-medium group-data-[variant=default]/tabs-list:data-active:text-text-primary group-data-[variant=default]/tabs-list:data-active:shadow-2xs",
        // Underline (line)
        "group-data-[variant=line]/tabs-list:px-2.5 group-data-[variant=line]/tabs-list:py-2 group-data-[variant=line]/tabs-list:text-text-primary group-data-[variant=line]/tabs-list:focus-visible:rounded-sm group-data-[variant=line]/tabs-list:data-active:text-body-medium group-data-[variant=line]/tabs-list:data-active:text-accent-600 dark:group-data-[variant=line]/tabs-list:data-active:text-accent-400",
        "after:pointer-events-none after:absolute after:bg-accent-600 after:opacity-0 after:transition-opacity after:duration-200 group-data-horizontal/tabs:after:inset-x-0 group-data-horizontal/tabs:after:-bottom-px group-data-horizontal/tabs:after:h-0.5 group-data-vertical/tabs:after:inset-y-0 group-data-vertical/tabs:after:-end-px group-data-vertical/tabs:after:w-0.5 dark:after:bg-accent-400 group-data-[variant=line]/tabs-list:data-active:after:opacity-100",
        className,
      )}
      {...props}
    />
  );
}

function TabsContent({ className, ...props }: TabsPrimitive.Panel.Props) {
  return (
    <TabsPrimitive.Panel
      data-slot="tabs-content"
      className={cn("flex-1 text-body-regular outline-none", className)}
      {...props}
    />
  );
}

export { Tabs, TabsList, TabsTrigger, TabsContent, tabsListVariants };
