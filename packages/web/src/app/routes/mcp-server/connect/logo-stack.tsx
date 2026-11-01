import { cva } from 'class-variance-authority';
import { Plus } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';

import { LogoPlate } from '@/components/custom/logo-plate';
import { cn } from '@/lib/utils';

export function LogoStack({
  logos,
  size,
  showMore = false,
  reveal,
}: {
  logos: string[];
  size: LogoStackSize;
  showMore?: boolean;
  reveal?: { isVisible: boolean; delay: number };
}) {
  const prefersReducedMotion = useReducedMotion();
  const tiles = [
    ...logos.map((logo) => (
      <LogoPlate
        key={logo}
        src={`/app-logos/${logo}.svg`}
        alt=""
        border
        className={tileVariants({ size })}
        innerClassName={logoVariants({ size })}
        imageClassName="transition-none"
      />
    )),
    ...(showMore
      ? [
          <span
            key="more"
            className={cn(
              tileVariants({ size }),
              'flex items-center justify-center border bg-panel text-gray-11',
            )}
          >
            <Plus className="size-4" strokeWidth={1.6} />
          </span>,
        ]
      : []),
  ];
  const isAnimated = reveal !== undefined && !prefersReducedMotion;
  return (
    <span aria-hidden className="inline-flex shrink-0 align-middle">
      {tiles.map((tile, index) => (
        <span
          key={tile.key}
          className={cn(
            'relative shrink-0',
            index < tiles.length - 1 && slotVariants({ size }),
          )}
          style={{ zIndex: index + 1 }}
        >
          {isAnimated ? (
            <motion.span
              className="block"
              initial={hiddenTile(index)}
              animate={reveal.isVisible ? SHOWN_TILE : hiddenTile(index)}
              transition={{
                duration: 0.3,
                delay: reveal.delay + index * TILE_STAGGER,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              {tile}
            </motion.span>
          ) : (
            tile
          )}
        </span>
      ))}
    </span>
  );
}

function hiddenTile(index: number) {
  return { x: -index * TILE_TRAVEL_PX, opacity: 0 };
}

const SHOWN_TILE = { x: 0, opacity: 1 };
const TILE_TRAVEL_PX = 6;
const TILE_STAGGER = 0.02;

const tileVariants = cva('', {
  variants: {
    size: {
      sm: 'size-4.5 rounded-full',
      lg: 'size-9 rounded-[10px] ring-2 ring-panel',
    },
  },
});

const logoVariants = cva('p-0', {
  variants: {
    size: {
      sm: 'size-2.5',
      lg: 'size-5',
    },
  },
});

const slotVariants = cva('', {
  variants: {
    size: {
      sm: 'w-3.25',
      lg: 'w-7.5',
    },
  },
});

type LogoStackSize = 'sm' | 'lg';
