import { useReducedMotion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';

import { cn } from '@/lib/utils';

import { MCP_CLIENT_BRANDING } from '../mcp-client-display';

export function ClientRotator() {
  const [index, setIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [widths, setWidths] = useState<number[]>([]);
  const itemRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const measure = () =>
      setWidths(itemRefs.current.map((item) => item?.offsetWidth ?? 0));
    measure();
    document.fonts.ready.then(measure).catch(() => undefined);
  }, []);

  useEffect(() => {
    if (reduceMotion || isPaused) return;
    const timer = setInterval(
      () => setIndex((current) => (current + 1) % ROTATING_CLIENTS.length),
      ROTATE_MS,
    );
    return () => clearInterval(timer);
  }, [reduceMotion, isPaused]);

  const width = widths[index];

  return (
    <span
      className="relative inline-block h-[1.25em] transition-[width] duration-200 motion-reduce:transition-none"
      style={width ? { width } : undefined}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {ROTATING_CLIENTS.map((client, position) => {
        const isActive = position === index;
        return (
          <span
            key={client.name}
            ref={(element) => {
              itemRefs.current[position] = element;
            }}
            aria-hidden={!isActive}
            style={{
              color: `color-mix(in oklab, ${client.tint} 45%, currentColor)`,
            }}
            className={cn(
              'absolute left-0 top-0 inline-flex h-full items-center gap-2.5 whitespace-nowrap transition-all duration-200 motion-reduce:transition-none',
              isActive
                ? 'translate-y-0 opacity-100'
                : 'pointer-events-none translate-y-1 opacity-0',
            )}
          >
            <img
              src={client.icon}
              alt=""
              className={cn(
                'size-[0.9em] shrink-0 object-contain',
                client.invertOnDark && 'dark:invert dark:hue-rotate-180',
              )}
            />
            {client.name}
          </span>
        );
      })}
    </span>
  );
}

const ROTATE_MS = 2500;

const ROTATING_CLIENTS = [
  {
    name: 'Claude',
    icon: MCP_CLIENT_BRANDING.claude.icon,
    tint: '#d97757',
    invertOnDark: false,
  },
  {
    name: 'ChatGPT',
    icon: MCP_CLIENT_BRANDING.chatgpt.icon,
    tint: '#10a37f',
    invertOnDark: false,
  },
  {
    name: 'Cursor',
    icon: MCP_CLIENT_BRANDING.cursor.icon,
    tint: '#8a8a8a',
    invertOnDark: true,
  },
  {
    name: 'Codex',
    icon: MCP_CLIENT_BRANDING.codex.icon,
    tint: '#8a8a8a',
    invertOnDark: true,
  },
  {
    name: 'Gemini',
    icon: MCP_CLIENT_BRANDING['gemini-cli'].icon,
    tint: '#4285f4',
    invertOnDark: false,
  },
  {
    name: 'VS Code',
    icon: MCP_CLIENT_BRANDING.vscode.icon,
    tint: '#007acc',
    invertOnDark: false,
  },
  {
    name: 'Windsurf',
    icon: MCP_CLIENT_BRANDING.windsurf.icon,
    tint: '#34e8bb',
    invertOnDark: true,
  },
];
