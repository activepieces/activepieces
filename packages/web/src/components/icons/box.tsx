import type { Variants } from 'motion/react';
import { motion, useAnimation } from 'motion/react';
import type { HTMLAttributes } from 'react';
import { forwardRef, useCallback, useImperativeHandle, useRef } from 'react';

import { cn } from '@/lib/utils';

export interface BoxIconHandle {
  startAnimation: () => void;
  stopAnimation: () => void;
}

interface BoxIconProps extends HTMLAttributes<HTMLDivElement> {
  size?: number;
}

const LID_VARIANTS: Variants = {
  normal: { y: 0, opacity: 1 },
  animate: {
    y: [-2, 0],
    opacity: [0.5, 1],
    transition: { duration: 0.35, ease: 'easeOut' },
  },
};

const BODY_VARIANTS: Variants = {
  normal: { scaleY: 1, originY: 'bottom' },
  animate: {
    scaleY: [0.95, 1],
    originY: 'bottom',
    transition: { duration: 0.35, ease: 'easeOut' },
  },
};

const BoxIcon = forwardRef<BoxIconHandle, BoxIconProps>(
  ({ onMouseEnter, onMouseLeave, className, size = 16, ...props }, ref) => {
    const controls = useAnimation();
    const isControlledRef = useRef(false);

    useImperativeHandle(ref, () => {
      isControlledRef.current = true;
      return {
        startAnimation: () => controls.start('animate'),
        stopAnimation: () => controls.start('normal'),
      };
    });

    const handleMouseEnter = useCallback(
      (e: React.MouseEvent<HTMLDivElement>) => {
        if (isControlledRef.current) {
          onMouseEnter?.(e);
        } else {
          controls.start('animate');
        }
      },
      [controls, onMouseEnter],
    );

    const handleMouseLeave = useCallback(
      (e: React.MouseEvent<HTMLDivElement>) => {
        if (isControlledRef.current) {
          onMouseLeave?.(e);
        } else {
          controls.start('normal');
        }
      },
      [controls, onMouseLeave],
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
          {/* Box body */}
          <motion.path
            animate={controls}
            variants={BODY_VARIANTS}
            d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"
          />
          {/* Horizontal crease (lid line) */}
          <motion.path
            animate={controls}
            variants={LID_VARIANTS}
            d="m3.3 7 8.7 5 8.7-5"
          />
          {/* Vertical center line */}
          <motion.path
            animate={controls}
            variants={BODY_VARIANTS}
            d="M12 22V12"
          />
        </svg>
      </div>
    );
  },
);

BoxIcon.displayName = 'BoxIcon';

export { BoxIcon };
