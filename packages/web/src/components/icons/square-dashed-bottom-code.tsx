"use client";

import type { Variants } from "motion/react";
import { motion, useAnimation } from "motion/react";
import type { HTMLAttributes } from "react";
import { forwardRef, useCallback, useImperativeHandle, useRef } from "react";

import { cn } from "@/lib/utils";

export interface SquareDashedBottomCodeIconHandle {
  startAnimation: () => void;
  stopAnimation: () => void;
}

interface SquareDashedBottomCodeIconProps extends HTMLAttributes<HTMLDivElement> {
  size?: number;
}

const bracketVariants: Variants = {
  normal: { x: 0 },
  animate: { x: [0, -1.5, 0], transition: { duration: 0.4, ease: "easeInOut" } },
};

const bracketRightVariants: Variants = {
  normal: { x: 0 },
  animate: { x: [0, 1.5, 0], transition: { duration: 0.4, ease: "easeInOut" } },
};

const SquareDashedBottomCodeIcon = forwardRef<SquareDashedBottomCodeIconHandle, SquareDashedBottomCodeIconProps>(
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
          <motion.path animate={controls} d="M10 9.5 8 12l2 2.5" variants={bracketVariants} />
          <motion.path animate={controls} d="m14 9.5 2 2.5-2 2.5" variants={bracketRightVariants} />
          <path d="M5 21a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2" />
          <path d="M9 21h1" />
          <path d="M14 21h1" />
        </svg>
      </div>
    );
  }
);

SquareDashedBottomCodeIcon.displayName = "SquareDashedBottomCodeIcon";

export { SquareDashedBottomCodeIcon };
