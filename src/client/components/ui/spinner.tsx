import * as React from "react";
import { cn } from "@/client/boardui/utils/cx";

/**
 * BoardUI Spinner (https://www.boardui.com/components/spinner): an orbiting
 * light drawn in three layers (a crisp arc with a rounded head, a tight glow
 * and a wide bloom) over a faint track, all in `currentColor`. Drawn as SVG
 * here so call sites keep sizing it with `size-*` classes.
 */
const LAYERS = [
  { arc: 110, lag: 22, width: 8, blur: 1.6, opacity: 0.32 },
  { arc: 200, lag: 9, width: 4, blur: 0.6, opacity: 0.6 },
  { arc: 290, lag: 0, width: 2, blur: 0, opacity: 1 },
] as const;

function Spinner({ className, ...props }: React.ComponentProps<"svg">) {
  const id = React.useId().replace(/:/g, "");
  return (
    <svg
      data-slot="spinner"
      role="status"
      aria-label="Loading"
      viewBox="0 0 24 24"
      fill="none"
      className={cn("size-4 shrink-0 overflow-visible", className)}
      {...props}
    >
      <defs>
        {LAYERS.filter((layer) => layer.blur > 0).map((layer) => (
          <filter
            key={layer.blur}
            id={`${id}-blur-${layer.blur * 10}`}
            x="-50%"
            y="-50%"
            width="200%"
            height="200%"
          >
            <feGaussianBlur stdDeviation={layer.blur} />
          </filter>
        ))}
      </defs>
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="2"
        opacity="0.15"
      />
      <g className="origin-center animate-spin [animation-duration:900ms] motion-reduce:[animation-duration:2400ms]">
        {LAYERS.map((layer) => (
          <circle
            key={layer.arc}
            cx="12"
            cy="12"
            r="10"
            pathLength={360}
            stroke="currentColor"
            strokeWidth={layer.width}
            strokeLinecap={layer.blur === 0 ? "round" : "butt"}
            strokeDasharray={`${layer.arc} 360`}
            opacity={layer.opacity}
            filter={
              layer.blur > 0 ? `url(#${id}-blur-${layer.blur * 10})` : undefined
            }
            transform={`rotate(${-90 + 290 - layer.arc - layer.lag} 12 12)`}
          />
        ))}
      </g>
    </svg>
  );
}

export { Spinner };
