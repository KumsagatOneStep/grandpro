"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface MarqueeProps extends React.HTMLAttributes<HTMLDivElement> {
  duration?: number;
  pauseOnHover?: boolean;
  direction?: "left" | "right" | "up" | "down";
  fade?: boolean;
  fadeAmount?: number;
}

export function Marquee({
  children,
  className,
  duration = 20,
  pauseOnHover = false,
  direction = "left",
  fade = true,
  fadeAmount = 10,
  ...props
}: MarqueeProps) {
  const id = React.useId().replace(/:/g, "");
  const [isPaused, setIsPaused] = React.useState(false);

  const items = React.Children.toArray(children);
  const isVertical = direction === "up" || direction === "down";

  const animationName =
    isVertical
      ? direction === "up" ? `mq-y-${id}` : `mq-yr-${id}`
      : direction === "left" ? `mq-x-${id}` : `mq-xr-${id}`;

  return (
    <>
      <style>{`
        @keyframes mq-x-${id}  { from { transform: translateX(0);    } to { transform: translateX(-50%); } }
        @keyframes mq-xr-${id} { from { transform: translateX(-50%); } to { transform: translateX(0);    } }
        @keyframes mq-y-${id}  { from { transform: translateY(0);    } to { transform: translateY(-50%); } }
        @keyframes mq-yr-${id} { from { transform: translateY(-50%); } to { transform: translateY(0);    } }
        .mq-scroller-${id} {
          display: flex;
          animation: ${animationName} ${duration}s linear infinite;
        }
        .mq-scroller-${id}.paused {
          animation-play-state: paused;
        }
        @media (prefers-reduced-motion: reduce) {
          .mq-scroller-${id} { animation: none; }
        }
      `}</style>

      <div
        className={cn(
          "flex w-full overflow-hidden",
          isVertical && "flex-col",
          className,
        )}
        style={{
          ...(fade && {
            maskImage: isVertical
              ? `linear-gradient(to bottom, transparent 0%, black ${fadeAmount}%, black ${100 - fadeAmount}%, transparent 100%)`
              : `linear-gradient(to right, transparent 0%, black ${fadeAmount}%, black ${100 - fadeAmount}%, transparent 100%)`,
            WebkitMaskImage: isVertical
              ? `linear-gradient(to bottom, transparent 0%, black ${fadeAmount}%, black ${100 - fadeAmount}%, transparent 100%)`
              : `linear-gradient(to right, transparent 0%, black ${fadeAmount}%, black ${100 - fadeAmount}%, transparent 100%)`,
          }),
        }}
        onMouseEnter={() => pauseOnHover && setIsPaused(true)}
        onMouseLeave={() => pauseOnHover && setIsPaused(false)}
        {...props}
      >
        <div
          className={cn(
            `mq-scroller-${id} flex shrink-0`,
            isVertical && "flex-col",
            isPaused && "paused",
          )}
        >
          {items.map((item, index) => (
            <div key={`first-${index}`} className={cn("flex shrink-0", isVertical && "w-full")}>
              {item}
            </div>
          ))}
          {items.map((item, index) => (
            <div key={`second-${index}`} className={cn("flex shrink-0", isVertical && "w-full")}>
              {item}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
