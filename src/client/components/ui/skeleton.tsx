import { cn } from "@/client/boardui/utils/cx";

// BoardUI Skeleton (https://www.boardui.com/components/skeleton): a text-tinted
// block with the layered light sheen from boardui/styles/globals.css
// (.bui-skeleton). The tint shows on both page and card surfaces.
function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      aria-hidden
      className={cn(
        "bui-skeleton relative rounded-md bg-text-primary/8",
        className,
      )}
      {...props}
    />
  );
}

export { Skeleton };
