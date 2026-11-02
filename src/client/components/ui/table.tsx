import * as React from "react";
import { cn } from "@/client/boardui/utils/cx";

// BoardUI Table (https://www.boardui.com/components/table): tinted header band
// with hairline borders, tertiary header text, separators between rows only.
// Row hover uses the dropdown hover surface; selection an accent tint.
// Cells wrap, because tables hold long URLs and titles.

/** The card around a table and its toolbar or footer. The table runs edge to edge. */
function TableCard({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="table-card"
      className={cn(
        "overflow-hidden rounded-2xl border border-border-button-default bg-card shadow-card",
        className,
      )}
      {...props}
    />
  );
}

function Table({
  className,
  containerClassName,
  ...props
}: React.ComponentProps<"table"> & { containerClassName?: string }) {
  return (
    <div
      data-slot="table-container"
      className={cn("relative w-full overflow-x-auto", containerClassName)}
    >
      <table
        data-slot="table"
        className={cn(
          "w-full caption-bottom border-collapse text-body-medium text-text-primary",
          className,
        )}
        {...props}
      />
    </div>
  );
}

function TableHeader({ className, ...props }: React.ComponentProps<"thead">) {
  return (
    <thead
      data-slot="table-header"
      className={cn(
        "[&_tr]:border-b [&_tr]:border-separator-border [&_tr]:hover:bg-transparent",
        className,
      )}
      {...props}
    />
  );
}

function TableBody({ className, ...props }: React.ComponentProps<"tbody">) {
  return (
    <tbody
      data-slot="table-body"
      className={cn("[&_tr:last-child]:border-0", className)}
      {...props}
    />
  );
}

function TableFooter({ className, ...props }: React.ComponentProps<"tfoot">) {
  return (
    <tfoot
      data-slot="table-footer"
      className={cn(
        "border-t border-separator-border bg-background-secondary-default text-body-medium [&>tr]:last:border-b-0",
        className,
      )}
      {...props}
    />
  );
}

function TableRow({ className, ...props }: React.ComponentProps<"tr">) {
  return (
    <tr
      data-slot="table-row"
      className={cn(
        "border-b border-separator-border transition-colors duration-150 hover:bg-background-primary-hover has-aria-expanded:bg-background-primary-hover data-[state=selected]:bg-accent-50 dark:data-[state=selected]:bg-accent-950/40",
        className,
      )}
      {...props}
    />
  );
}

function TableHead({ className, ...props }: React.ComponentProps<"th">) {
  return (
    <th
      data-slot="table-head"
      className={cn(
        "h-10 bg-background-secondary-default px-3 py-2.5 text-start align-middle text-body-medium whitespace-nowrap text-text-tertiary first:ps-4 last:pe-4 [&:has([role=checkbox])]:pe-0",
        className,
      )}
      {...props}
    />
  );
}

function TableCell({ className, ...props }: React.ComponentProps<"td">) {
  return (
    <td
      data-slot="table-cell"
      className={cn(
        "px-3 py-2.5 align-middle first:ps-4 last:pe-4 [&:has([role=checkbox])]:pe-0",
        className,
      )}
      {...props}
    />
  );
}

function TableCaption({
  className,
  ...props
}: React.ComponentProps<"caption">) {
  return (
    <caption
      data-slot="table-caption"
      className={cn("mt-4 text-body-regular text-text-secondary", className)}
      {...props}
    />
  );
}

export {
  Table,
  TableCard,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
};
