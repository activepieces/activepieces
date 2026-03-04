"use client";

import type { Transition } from "motion/react";
import { motion, useAnimation } from "motion/react";
import type { HTMLAttributes } from "react";
import { forwardRef, useCallback, useImperativeHandle, useRef } from "react";

import { cn } from "@/lib/utils";

export interface FrameIconHandle {
  startAnimation: () => void;
  stopAnimation: () => void;
}

interface FrameIconProps extends HTMLAttributes<HTMLDivElement> {
  size?: number;
}

const DEFAULT_TRANSITION: Transition = {
  type: "spring",
  stiffness: 160,
  damping: 17,
  mass: 1,
};

const FrameIcon = forwardRef<FrameIconHandle, FrameIconProps>(
  ({ onMouseEnter, onMouseLeave, className, size = 28, ...props }, ref) => {
    const controls = useAnimation();
    const isControlledRef = useRef(false);

    useImperativeHandle(ref, () => {
      isControlledRef.current = true;

      return {
        startAnimation: () => controls.start("animate"),
        stopAnimation: () => controls.start("normal"),
      };
    });

    const handleMouseEnter = useCallback(
      (e: React.MouseEvent<HTMLDivElement>) => {
        if (isControlledRef.current) {
          onMouseEnter?.(e);
        } else {
          controls.start("animate");
        }
      },
      [controls, onMouseEnter]
    );

    const handleMouseLeave = useCallback(
      (e: React.MouseEvent<HTMLDivElement>) => {
        if (isControlledRef.current) {
          onMouseLeave?.(e);
        } else {
          controls.start("normal");
        }
      },
      [controls, onMouseLeave]
    );

    return (
      <div
        className={cn(className)}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        {...props}
      >
        <svg
          fill="none"
          height={size}
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox="0 0 24 24"
          width={size}
          xmlns="http://www.w3.org/2000/svg"
        >
          <motion.line
            animate={controls}
            transition={DEFAULT_TRANSITION}
            variants={{
              animate: { translateY: -4 },
              normal: { translateX: 0, rotate: 0, translateY: 0 },
            }}
            x1={22}
            x2={2}
            y1={6}
            y2={6}
          />
          <motion.line
            animate={controls}
            transition={DEFAULT_TRANSITION}
            variants={{
              animate: { translateY: 4 },
              normal: { translateX: 0, rotate: 0, translateY: 0 },
            }}
            x1={22}
            x2={2}
            y1={18}
            y2={18}
          />
          <motion.line
            animate={controls}
            transition={DEFAULT_TRANSITION}
            variants={{
              animate: { translateX: -4 },
              normal: { translateX: 0, rotate: 0, translateY: 0 },
            }}
            x1={6}
            x2={6}
            y1={2}
            y2={22}
          />
          <motion.line
            animate={controls}
            transition={DEFAULT_TRANSITION}
            variants={{
              animate: { translateX: 4 },
              normal: { translateX: 0, rotate: 0, translateY: 0 },
            }}
            x1={18}
            x2={18}
            y1={2}
            y2={22}
          />
        </svg>
      </div>
    );
  }
);

FrameIcon.displayName = "FrameIcon";

export { FrameIcon };
