"use client";

import type { Variants } from "motion/react";
import { motion, useAnimation } from "motion/react";
import type { HTMLAttributes } from "react";
import { forwardRef, useCallback, useImperativeHandle, useRef } from "react";

import { cn } from "@/lib/utils";

export interface ReplaceIconHandle {
  startAnimation: () => void;
  stopAnimation: () => void;
}

interface ReplaceIconProps extends HTMLAttributes<HTMLDivElement> {
  size?: number;
}

const ARROW_PATH_VARIANTS: Variants = {
  normal: {
    opacity: 1,
    pathLength: 1,
  },
  animate: {
    opacity: [0, 1],
    pathLength: [0, 1],
    transition: {
      duration: 0.4,
      opacity: { duration: 0.1 },
    },
  },
};

const ARROW_CHEVRON_VARIANTS: Variants = {
  normal: {
    opacity: 1,
    pathLength: 1,
  },
  animate: {
    opacity: [0, 1],
    pathLength: [0, 1],
    transition: {
      delay: 0.2,
      duration: 0.3,
      opacity: { duration: 0.1, delay: 0.2 },
    },
  },
};

const ReplaceIcon = forwardRef<ReplaceIconHandle, ReplaceIconProps>(
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
          <path d="M14 4c0-1.1.9-2 2-2" />
          <path d="M20 2c1.1 0 2 .9 2 2" />
          <path d="M22 8c0 1.1-.9 2-2 2" />
          <path d="M16 10c-1.1 0-2-.9-2-2" />
          <motion.path
            animate={controls}
            d="m3 7 3 3 3-3"
            initial="normal"
            variants={ARROW_CHEVRON_VARIANTS}
          />
          <motion.path
            animate={controls}
            d="M6 10V5c0-1.7 1.3-3 3-3h1"
            initial="normal"
            variants={ARROW_PATH_VARIANTS}
          />
          <rect width="8" height="8" x="2" y="14" rx="2" />
        </svg>
      </div>
    );
  }
);

ReplaceIcon.displayName = "ReplaceIcon";

export { ReplaceIcon };
