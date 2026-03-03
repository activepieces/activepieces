"use client";

import type { Variants } from "motion/react";
import { motion, useAnimation } from "motion/react";
import type { HTMLAttributes } from "react";
import { forwardRef, useCallback, useImperativeHandle, useRef } from "react";

import { cn } from "@/lib/utils";

export interface MousePointerClickIconHandle {
  startAnimation: () => void;
  stopAnimation: () => void;
}

interface MousePointerClickIconProps extends HTMLAttributes<HTMLDivElement> {
  size?: number;
}

const pointerVariants: Variants = {
  normal: { y: 0 },
  animate: { y: [0, 1.5, 0], transition: { duration: 0.3, ease: "easeInOut" } },
};

const raysVariants: Variants = {
  normal: { opacity: 1, scale: 1 },
  animate: { opacity: [1, 0.4, 1], scale: [1, 0.9, 1], transition: { duration: 0.4, ease: "easeInOut" } },
};

const MousePointerClickIcon = forwardRef<MousePointerClickIconHandle, MousePointerClickIconProps>(
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
          <motion.g animate={controls} variants={raysVariants}>
            <path d="M14 4.1 12 6" />
            <path d="m5.1 8-2.9-.8" />
            <path d="m6 12-1.9 2" />
            <path d="M7.2 2.2 8 5.1" />
          </motion.g>
          <motion.path
            animate={controls}
            d="M9.037 9.69a.498.498 0 0 1 .653-.653l11 4.5a.5.5 0 0 1-.074.949l-4.349 1.041a1 1 0 0 0-.74.739l-1.04 4.35a.5.5 0 0 1-.95.074z"
            variants={pointerVariants}
          />
        </svg>
      </div>
    );
  }
);

MousePointerClickIcon.displayName = "MousePointerClickIcon";

export { MousePointerClickIcon };
