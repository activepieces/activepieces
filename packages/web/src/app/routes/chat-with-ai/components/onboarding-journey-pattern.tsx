import { motion, useReducedMotion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';

import { cn } from '@/lib/utils';

export function OnboardingJourneyPattern() {
  const reducedMotion = useReducedMotion();
  const rootRef = useRef<HTMLDivElement>(null);
  const lensRef = useRef<HTMLDivElement>(null);
  const [placements, setPlacements] = useState<ScenePlacement[]>([]);

  useEffect(() => {
    const host = rootRef.current?.parentElement;
    if (!host) {
      return;
    }
    const observer = new ResizeObserver(() => {
      setPlacements(
        computeLayout({
          width: host.clientWidth,
          height: host.clientHeight,
        }),
      );
    });
    observer.observe(host);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const host = rootRef.current?.parentElement;
    const lens = lensRef.current;
    if (!host || !lens) {
      return;
    }

    let raf = 0;
    let visible = false;
    let targetX = 0;
    let targetY = 0;
    let x = 0;
    let y = 0;

    const paint = () => {
      x += (targetX - x) * 0.16;
      y += (targetY - y) * 0.16;
      lens.style.setProperty('--ob-mx', `${x.toFixed(1)}px`);
      lens.style.setProperty('--ob-my', `${y.toFixed(1)}px`);
      raf = visible ? requestAnimationFrame(paint) : 0;
    };

    const track = (event: PointerEvent) => {
      const rect = host.getBoundingClientRect();
      targetX = event.clientX - rect.left;
      targetY = event.clientY - rect.top;
    };

    const onEnter = (event: PointerEvent) => {
      track(event);
      x = targetX;
      y = targetY;
      visible = true;
      lens.style.opacity = '1';
      if (!raf) {
        raf = requestAnimationFrame(paint);
      }
    };

    const onLeave = () => {
      visible = false;
      lens.style.opacity = '0';
    };

    host.addEventListener('pointerenter', onEnter);
    host.addEventListener('pointermove', track);
    host.addEventListener('pointerleave', onLeave);
    return () => {
      host.removeEventListener('pointerenter', onEnter);
      host.removeEventListener('pointermove', track);
      host.removeEventListener('pointerleave', onLeave);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div
      ref={rootRef}
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      <svg
        viewBox="0 0 900 520"
        preserveAspectRatio="xMidYMax slice"
        fill="none"
        aria-hidden
        className="h-full w-full text-foreground"
      >
        <defs>
          <pattern
            id="obDotGrid"
            width="26"
            height="26"
            patternUnits="userSpaceOnUse"
          >
            <circle cx="1.2" cy="1.2" r="1.2" fill="currentColor" />
          </pattern>

          <radialGradient id="obGridFade" cx="50%" cy="62%" r="68%">
            <stop offset="0%" stopColor="#fff" stopOpacity="1" />
            <stop offset="62%" stopColor="#fff" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#fff" stopOpacity="0" />
          </radialGradient>
          <mask id="obGridMask">
            <rect width="900" height="520" fill="url(#obGridFade)" />
          </mask>
        </defs>

        <motion.g
          initial={reducedMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
        >
          <rect
            width="900"
            height="520"
            fill="url(#obDotGrid)"
            mask="url(#obGridMask)"
            className="opacity-[0.13] dark:opacity-[0.18]"
          />
        </motion.g>
      </svg>

      <div
        ref={lensRef}
        className="absolute inset-0 opacity-0 transition-opacity duration-500"
        style={{
          maskImage: LENS_MASK,
          WebkitMaskImage: LENS_MASK,
        }}
      >
        <svg
          viewBox="0 0 900 520"
          preserveAspectRatio="xMidYMax slice"
          fill="none"
          aria-hidden
          className="h-full w-full text-primary"
        >
          <rect
            width="900"
            height="520"
            fill="url(#obDotGrid)"
            className="opacity-35"
          />
        </svg>
        {placements.map((placement) => (
          <SceneSprite key={placement.scene.id} placement={placement} />
        ))}
      </div>
    </div>
  );
}

function SceneSprite({ placement }: { placement: ScenePlacement }) {
  const { scene, left, top } = placement;
  return (
    <div
      className="absolute"
      style={{
        left,
        top,
        width: scene.sizePx,
        height: scene.sizePx,
        transform: `rotate(${scene.rot}deg)`,
      }}
    >
      <svg
        viewBox="0 0 48 48"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
        className={cn('size-full overflow-visible', scene.ink)}
      >
        <g
          className="ob-float"
          style={{ animationDelay: `${scene.delayMs}ms` }}
        >
          {scene.paths.map((d, i) => (
            <path key={i} d={d} />
          ))}
        </g>
      </svg>
    </div>
  );
}

function computeLayout({
  width,
  height,
}: {
  width: number;
  height: number;
}): ScenePlacement[] {
  if (width < 140 || height < 80) {
    return [];
  }
  const cols = Math.max(2, Math.min(6, Math.floor(width / 170)));
  const rows = Math.max(1, Math.min(3, Math.floor(height / 130)));
  const cellCount = cols * rows;
  const cellW = width / cols;
  const cellH = height / rows;

  const mains = MURAL_SCENES.slice(0, Math.min(MURAL_SCENES.length, cellCount));
  const fillerRoom = cellCount - mains.length;
  const fillers = FILLER_DOODLES.slice(0, Math.max(0, fillerRoom));
  const chosen = [...mains.slice(0, -1), ...fillers, ...mains.slice(-1)];

  return chosen.map((scene, i) => {
    const cellIndex =
      chosen.length === 1
        ? cellCount - 1
        : Math.round((i * (cellCount - 1)) / (chosen.length - 1));
    const col = cellIndex % cols;
    const row = Math.floor(cellIndex / cols);
    const jitter = JITTER[i % JITTER.length];
    const slackX = Math.max(0, cellW - scene.sizePx);
    const slackY = Math.max(0, cellH - scene.sizePx);
    const left = clamp({
      value: col * cellW + slackX / 2 + jitter.x * slackX * 0.8,
      min: 4,
      max: width - scene.sizePx - 4,
    });
    const top = clamp({
      value: row * cellH + slackY / 2 + jitter.y * slackY * 0.8,
      min: 4,
      max: height - scene.sizePx - 4,
    });
    return { scene, left, top };
  });
}

function clamp({
  value,
  min,
  max,
}: {
  value: number;
  min: number;
  max: number;
}): number {
  return Math.min(Math.max(value, min), Math.max(min, max));
}

const LENS_MASK =
  'radial-gradient(circle 160px at var(--ob-mx, -300px) var(--ob-my, -300px), black 45%, transparent 100%)';

const INK_BLUE = 'text-[#0078BF] dark:text-[#57ABE8]';
const INK_TEAL = 'text-[#00838A] dark:text-[#35B5B0]';
const INK_ORANGE = 'text-[#F0602F] dark:text-[#FF8E5E]';
const INK_SUNFLOWER = 'text-[#D69A00] dark:text-[#F5B93D]';
const INK_PINK = 'text-[#E3399B] dark:text-[#FF7AC1]';
const INK_PURPLE = 'text-[#765BA7] dark:text-[#A98FD6]';

const JITTER = [
  { x: -0.3, y: 0.2 },
  { x: 0.25, y: -0.3 },
  { x: -0.1, y: -0.15 },
  { x: 0.35, y: 0.25 },
  { x: -0.35, y: -0.05 },
  { x: 0.15, y: 0.35 },
  { x: -0.2, y: -0.35 },
  { x: 0.3, y: 0.05 },
  { x: -0.05, y: 0.3 },
  { x: 0.1, y: -0.2 },
];

const MURAL_SCENES: AgentScene[] = [
  {
    id: 'hammock',
    sizePx: 88,
    rot: 0,
    delayMs: 0,
    ink: INK_TEAL,
    paths: [
      'M4.5 40.2c.5-8.2 1.6-16.2 3.4-24.1M43.5 40.3c-.5-8.2-1.6-16.2-3.4-24.1',
      'M7.5 18.5c10.5 7.6 22.5 7.6 33-.2',
      'M15.5 14c1.9-.2 3.4 1.2 3.3 3.1-.1 1.9-1.6 3.3-3.4 3.2-1.8-.1-3-1.5-2.9-3.2.1-1.7 1.3-2.9 3-3.1z',
      'M20.8 19.9c1.3-1.6 2.7-2.4 4.3-2.4 1.5.6 2.7 1.6 3.6 3',
      'M27.5 23.9c1.1-2.8 2.9-4.3 5.4-4.4 1 1.3 1.6 2.8 1.8 4.5',
    ],
  },
  {
    id: 'dancer',
    sizePx: 80,
    rot: -3,
    delayMs: 600,
    ink: INK_PINK,
    paths: [
      'M20 5.2c2.4-.2 4.2 1.6 4.1 4-.1 2.4-2 4.1-4.3 4-2.2-.1-3.8-1.9-3.7-4.1.1-2.2 1.7-3.7 3.9-3.9z',
      'M20 13.4c.4 4.4.3 8.7-.3 13',
      'M19.8 16.5c-2.9-2.3-5-5.1-6.3-8.4M20.2 16.3c3.2-1.8 5.7-4.3 7.5-7.4',
      'M19.7 26.4c-.9 4.3-1.3 8.6-1.2 12.9M19.9 26.6c3.1 2.5 5.5 5.6 7.2 9.3',
      'M30.6 11.2c1.1-.5 2.2 0 2.3 1.1.1 1.1-.9 1.9-2 1.5-1-.3-1.2-1.9-.3-2.6z',
      'M32.9 12.2l.4-6.2c1.1.5 2.2.7 3.4.6',
    ],
  },
  {
    id: 'painter',
    sizePx: 86,
    rot: 0,
    delayMs: 900,
    ink: INK_PURPLE,
    paths: [
      'M26.5 10.5c3.9-.3 7.8-.3 11.7 0 .3 3.6.3 7.2-.1 10.8-3.8.3-7.6.3-11.4 0-.4-3.6-.4-7.2-.2-10.8z',
      'M28 21.8c-1 6-2.3 11.9-3.9 17.7M36.8 21.8c1 6 2.3 11.9 3.9 17.7',
      'M32.3 17.9c-1.8-1.2-2.7-2.3-2.6-3.4 0-.8.7-1.4 1.4-1.3.5 0 1 .3 1.3.9.3-.6.7-.9 1.3-.9.8 0 1.4.6 1.4 1.4 0 1.1-.9 2.2-2.8 3.3z',
      'M14.8 12.2c2.2-.2 3.9 1.4 3.8 3.7-.1 2.2-1.8 3.8-3.9 3.7-2.1-.1-3.5-1.7-3.4-3.8.1-2 1.5-3.4 3.5-3.6z',
      'M15 19.9c.3 4 .2 7.9-.2 11.8',
      'M14.9 31.5c-1.2 2.7-2.1 5.5-2.7 8.4M15 31.7c1.4 2.6 2.4 5.4 3.1 8.2',
      'M15.2 22.5c2.9-.5 5.7-1.4 8.4-2.6M23.4 19.8l2.6-1.1',
      'M15 24.9c-1.9.5-3.6 1.4-5.1 2.7',
      'M7.8 28.3c1.6-1 3.2-.9 4.6.2-.5 1.5-1.7 2.3-3.5 2.2-1.1-.5-1.5-1.3-1.1-2.4z',
    ],
  },
  {
    id: 'guitarist',
    sizePx: 84,
    rot: 2,
    delayMs: 1200,
    ink: INK_ORANGE,
    paths: [
      'M18 6.2c2.3-.2 4 1.5 3.9 3.8-.1 2.3-1.9 3.9-4.1 3.8-2.1-.1-3.6-1.8-3.5-3.9.1-2.1 1.6-3.5 3.7-3.7z',
      'M18.2 13.9c.8 3.9 1 7.8.6 11.7',
      'M18.6 25.4c2.5.1 4.8.5 7 1.1.3 2.7.4 5.4.3 8.1M18.7 25.6c-.2 4.6-.1 9.1.3 13.5',
      'M26.9 17.6c2.8-.2 4.9 1.8 4.8 4.5-.1 2.7-2.3 4.7-4.9 4.5-2.6-.2-4.4-2.2-4.3-4.8.1-2.5 1.9-4.1 4.4-4.2z',
      'M26.8 21.4c.4 0 .6.3.5.7-.1.4-.6.4-.8.1-.1-.3 0-.6.3-.8z',
      'M30.3 19.4c2.9-2.1 5.7-4.3 8.3-6.7M31.4 20.7c2.9-2.1 5.7-4.4 8.3-6.8M38.3 11.5l2 2.4',
      'M18.3 16.8c2.6 1.2 5.1 2.6 7.4 4.3M18.2 15.4c3.4.2 6.7.5 9.9 1.1',
      'M40.6 4.2c1.1-.5 2.2 0 2.3 1.1.1 1.1-.9 1.9-2 1.5-1-.3-1.2-1.9-.3-2.6z',
      'M42.9 5.2l.4-4.2c.9.4 1.9.6 2.9.5',
    ],
  },
  {
    id: 'stargazer',
    sizePx: 82,
    rot: 0,
    delayMs: 1500,
    ink: INK_BLUE,
    paths: [
      'M17.3 15.2c2.1-.2 3.7 1.4 3.6 3.5-.1 2.1-1.7 3.6-3.7 3.5-2-.1-3.4-1.6-3.3-3.6.1-1.9 1.4-3.2 3.4-3.4z',
      'M17.5 22.4c.2 3.7.1 7.4-.3 11.1',
      'M17.3 33.4c-1 2.3-1.8 4.7-2.4 7.2M17.4 33.6c1.2 2.3 2.2 4.7 2.9 7.1',
      'M17.7 24.9c2.5-.2 4.9-.6 7.3-1.2',
      'M24.3 22.9c4.3-3.5 8.6-6.9 13-10.2M27.3 26.5c4.3-3.4 8.6-6.9 12.9-10.3M37.2 12.6l3 3.7M24 23l3.2 3.6',
      'M27.5 27.5c-1.5 4.2-3.3 8.3-5.4 12.3M28.7 27.7c1.9 4 4 7.9 6.4 11.7',
      'M38.9 4.5c.3 1.1 1 1.8 2.1 2.1-1.1.3-1.8 1-2.1 2.1-.3-1.1-1-1.8-2.1-2.1 1.1-.3 1.8-1 2.1-2.1z',
      'M32.5 9.5c.3-.1.5.1.4.4-.1.3-.4.3-.5.1-.1-.2 0-.4.1-.5z',
    ],
  },
  {
    id: 'fetch',
    sizePx: 84,
    rot: 0,
    delayMs: 300,
    ink: INK_SUNFLOWER,
    paths: [
      'M10.8 10.2c2.1-.2 3.7 1.4 3.6 3.5-.1 2.1-1.7 3.6-3.7 3.5-2-.1-3.4-1.6-3.3-3.6.1-1.9 1.4-3.2 3.4-3.4z',
      'M11 17.4c.3 3.9.2 7.7-.2 11.5',
      'M11.2 20c2.7-2.1 4.9-4.7 6.6-7.8M11 21.8c-1.9.9-3.6 2.2-5 3.8',
      'M10.9 28.8c-1.1 2.6-2 5.3-2.6 8.1M11 29c1.3 2.5 2.3 5.2 3 8',
      'M24.5 6.7c1.3-.1 2.3.9 2.3 2.2 0 1.3-1 2.3-2.3 2.2-1.3-.1-2.2-1.1-2.1-2.3.1-1.2.9-2 2.1-2.1z',
      'M19.5 11.5c1.1-1.8 2.5-3.2 4.3-4.2',
      'M31.5 26.5c.5-3.1 2.8-4.9 6.2-4.8 3.3.1 5.5 2 5.8 5.1',
      'M29.8 19.9c1.7-.2 3 1 2.9 2.7-.1 1.7-1.4 2.9-3 2.8-1.6-.1-2.7-1.4-2.6-2.9.1-1.5 1.2-2.5 2.7-2.6z',
      'M28.3 19.9l-1-1.8M31.2 19.5l-.3-2',
      'M43.4 26.6c1.6-.7 2.8-1.8 3.7-3.4',
      'M33.2 27.4c-1.2 1.5-2.2 3.1-3 4.9M41 27.6c.8 1.6 1.8 3 3 4.3',
    ],
  },
];

const FILLER_DOODLES: AgentScene[] = [
  {
    id: 'heart',
    sizePx: 36,
    rot: 8,
    delayMs: 450,
    ink: INK_PINK,
    paths: [
      'M20 32.8c-7.4-4.8-11-9.2-10.8-13.6.1-3.3 2.7-5.6 5.7-5.4 2.2.1 3.9 1.4 5.1 3.8 1.2-2.4 3-3.7 5.2-3.8 3.1-.2 5.6 2.2 5.7 5.5.1 4.4-3.5 8.8-10.9 13.5z',
    ],
  },
  {
    id: 'star',
    sizePx: 34,
    rot: 10,
    delayMs: 1050,
    ink: INK_SUNFLOWER,
    paths: [
      'M20 4.3l4.3 9.9 10.6 1.2-7.9 7 2.4 10.4-9.4-5.4-9.4 5.2 2.6-10.3-7.8-7.2 10.6-1z',
    ],
  },
  {
    id: 'spiral',
    sizePx: 36,
    rot: 6,
    delayMs: 1650,
    ink: INK_ORANGE,
    paths: [
      'M20.2 19.8c.3-2.5 3.3-2.9 4.7-1 1.7 2.4.3 5.7-2.4 6.7-3.4 1.3-7.1-.9-7.8-4.6-.8-4.3 2.4-8.3 6.8-8.8 5.1-.6 9.6 3.1 10 8.3',
    ],
  },
];

type AgentScene = {
  id: string;
  sizePx: number;
  rot: number;
  delayMs: number;
  ink: string;
  paths: string[];
};

type ScenePlacement = {
  scene: AgentScene;
  left: number;
  top: number;
};
