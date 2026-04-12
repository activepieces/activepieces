'use client';

import { motion, useAnimation } from 'motion/react';
import type { HTMLAttributes } from 'react';
import { forwardRef, useCallback, useImperativeHandle, useRef } from 'react';

import { cn } from '@/lib/utils';

// Exact path from lucide-react v0.407.0 Zap icon
const ZAP_PATH =
  'M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z';

export interface ZapIconHandle {
  startAnimation: () => void;
  stopAnimation: () => void;
}

interface ZapIconProps extends HTMLAttributes<HTMLDivElement> {
  size?: number;
  fillColor?: string;
  fillPercent?: number;
}

const ZapIcon = forwardRef<ZapIconHandle, ZapIconProps>(
  (
    {
      className,
      size = 20,
      fillColor,
      fillPercent = 0,
      onMouseEnter,
      onMouseLeave,
      ...props
    },
    ref,
  ) => {
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
        if (!isControlledRef.current) controls.start('animate');
        onMouseEnter?.(e);
      },
      [controls, onMouseEnter],
    );

    const handleMouseLeave = useCallback(
      (e: React.MouseEvent<HTMLDivElement>) => {
        if (!isControlledRef.current) controls.start('normal');
        onMouseLeave?.(e);
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
        <motion.svg
          viewBox="0 0 24 24"
          width={size}
          height={size}
          xmlns="http://www.w3.org/2000/svg"
          animate={controls}
          variants={{
            normal: { rotate: 0 },
            animate: { rotate: [0, -10, 8, -6, 4, -2, 1, 0] },
          }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          style={{ transformOrigin: 'center' }}
        >
          {/* Dim base — always shows the full bolt silhouette */}
          <path
            d={ZAP_PATH}
            fill="currentColor"
            className="text-muted-foreground/20"
          />
          {/* Colored fill — clips from top, revealing upward from the bottom */}
          <path
            d={ZAP_PATH}
            style={{
              fill: fillColor ?? 'transparent',
              clipPath: `inset(${100 - fillPercent}% 0 0 0)`,
              transition: 'clip-path 0.4s ease, fill 0.35s ease',
            }}
          />
        </motion.svg>
      </div>
    );
  },
);

ZapIcon.displayName = 'ZapIcon';

export { ZapIcon };
