"use client";

import type { Variants } from "motion/react";
import { motion, useAnimation } from "motion/react";
import type { HTMLAttributes } from "react";
import { forwardRef, useCallback, useImperativeHandle, useRef } from "react";

import { cn } from "@/lib/utils";

export interface BotIconHandle {
  startAnimation: () => void;
  stopAnimation: () => void;
}

interface BotIconProps extends HTMLAttributes<HTMLDivElement> {
  size?: number;
}

const bodyVariants: Variants = {
  normal: { y: 0 },
  animate: {
    y: [0, -1.5, 0],
    transition: { duration: 0.3, ease: "easeInOut" },
  },
};

const antennaVariants: Variants = {
  normal: { rotate: 0 },
  animate: {
    rotate: [0, -15, 15, 0],
    transition: { duration: 0.5, ease: "easeInOut" },
  },
};

const BotIcon = forwardRef<BotIconHandle, BotIconProps>(
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
          <motion.g
            animate={controls}
            variants={antennaVariants}
            style={{ originX: "12px", originY: "8px" }}
          >
            <path d="M12 8V4H8" />
          </motion.g>
          <motion.g animate={controls} variants={bodyVariants}>
            <rect height="12" rx="2" width="16" x="4" y="8" />
            <path d="M2 14h2" />
            <path d="M20 14h2" />
            <line x1={9} y1={13} x2={9} y2={15} />
            <line x1={15} y1={13} x2={15} y2={15} />
          </motion.g>
        </svg>
      </div>
    );
  }
);

BotIcon.displayName = "BotIcon";

export { BotIcon };
