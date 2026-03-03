"use client";

import type { Variants } from "motion/react";
import { motion, useAnimation } from "motion/react";
import type { HTMLAttributes } from "react";
import { forwardRef, useCallback, useImperativeHandle, useRef } from "react";

import { cn } from "@/lib/utils";

export interface UnplugIconHandle {
  startAnimation: () => void;
  stopAnimation: () => void;
}

interface UnplugIconProps extends HTMLAttributes<HTMLDivElement> {
  size?: number;
}

const topVariants: Variants = {
  normal: { x: 0, y: 0 },
  animate: { x: [0, 1.5, 0], y: [0, -1.5, 0], transition: { duration: 0.4, ease: "easeInOut" } },
};

const bottomVariants: Variants = {
  normal: { x: 0, y: 0 },
  animate: { x: [0, -1.5, 0], y: [0, 1.5, 0], transition: { duration: 0.4, ease: "easeInOut" } },
};

const UnplugIcon = forwardRef<UnplugIconHandle, UnplugIconProps>(
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
          <motion.g animate={controls} variants={topVariants}>
            <path d="m19 5 3-3" />
            <path d="m12 6 6 6 2.3-2.3a2.4 2.4 0 0 0 0-3.4l-2.6-2.6a2.4 2.4 0 0 0-3.4 0Z" />
          </motion.g>
          <motion.g animate={controls} variants={bottomVariants}>
            <path d="m2 22 3-3" />
            <path d="M6.3 20.3a2.4 2.4 0 0 0 3.4 0L12 18l-6-6-2.3 2.3a2.4 2.4 0 0 0 0 3.4Z" />
          </motion.g>
          <path d="M7.5 13.5 10 11" />
          <path d="M10.5 16.5 13 14" />
        </svg>
      </div>
    );
  }
);

UnplugIcon.displayName = "UnplugIcon";

export { UnplugIcon };
