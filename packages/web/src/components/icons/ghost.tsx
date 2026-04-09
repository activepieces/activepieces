'use client';

import { motion, useAnimation } from 'motion/react';
import type { HTMLAttributes } from 'react';
import { forwardRef, useCallback, useImperativeHandle, useRef } from 'react';

import { cn } from '@/lib/utils';

export interface GhostIconHandle {
  startAnimation: () => void;
  stopAnimation: () => void;
}

interface GhostIconProps extends HTMLAttributes<HTMLDivElement> {
  size?: number;
}

const GhostIcon = forwardRef<GhostIconHandle, GhostIconProps>(
  ({ onMouseEnter, onMouseLeave, className, size = 28, ...props }, ref) => {
    const bodyControls = useAnimation();
    const isControlledRef = useRef(false);

    useImperativeHandle(ref, () => {
      isControlledRef.current = true;

      return {
        startAnimation: () => bodyControls.start('animate'),
        stopAnimation: () => bodyControls.start('normal'),
      };
    });

    const handleMouseEnter = useCallback(
      (e: React.MouseEvent<HTMLDivElement>) => {
        if (isControlledRef.current) {
          onMouseEnter?.(e);
        } else {
          bodyControls.start('animate');
        }
      },
      [bodyControls, onMouseEnter],
    );

    const handleMouseLeave = useCallback(
      (e: React.MouseEvent<HTMLDivElement>) => {
        if (isControlledRef.current) {
          onMouseLeave?.(e);
        } else {
          bodyControls.start('normal');
        }
      },
      [bodyControls, onMouseLeave],
    );

    return (
      <div
        className={cn(className)}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        {...props}
      >
        <motion.svg
          animate={bodyControls}
          fill="none"
          height={size}
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          transition={{ duration: 0.5, ease: 'easeInOut' }}
          variants={{
            normal: { y: 0, rotate: 0 },
            animate: { y: [0, -3, 0, -1.5, 0], rotate: [0, -10, 10, -5, 0] },
          }}
          viewBox="0 0 24 24"
          width={size}
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M9 10h.01" />
          <path d="M15 10h.01" />
          <path d="M12 2a8 8 0 0 0-8 8v12l3-3 2.5 2.5L12 19l2.5 2.5L17 19l3 3V10a8 8 0 0 0-8-8z" />
        </motion.svg>
      </div>
    );
  },
);

GhostIcon.displayName = 'GhostIcon';

export { GhostIcon };
