import { useReducedMotion } from 'motion/react';
import { useEffect, useState } from 'react';

import { cn } from '@/lib/utils';

import { ClientIcon } from '../client-icon';
import { MCP_CLIENT_BRANDING } from '../mcp-client-display';

export function ClientRotator() {
  const [index, setIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (reduceMotion || isPaused) return;
    const timer = setInterval(
      () => setIndex((current) => (current + 1) % ROTATING_CLIENTS.length),
      ROTATE_MS,
    );
    return () => clearInterval(timer);
  }, [reduceMotion, isPaused]);

  return (
    <span
      className="inline-grid"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {ROTATING_CLIENTS.map((client, position) => {
        const isActive = position === index;
        return (
          <span
            key={client.name}
            aria-hidden={!isActive}
            style={{
              backgroundColor: `color-mix(in oklab, ${client.tint} 14%, transparent)`,
            }}
            className={cn(
              'col-start-1 row-start-1 inline-flex items-center gap-2 justify-self-start rounded-xl py-1 pl-1.5 pr-3 transition-all duration-200 motion-reduce:transition-none',
              isActive
                ? 'translate-y-0 opacity-100'
                : 'pointer-events-none translate-y-1 opacity-0',
            )}
          >
            <ClientIcon icon={client.icon} className="size-7 rounded-lg" />
            {client.name}
          </span>
        );
      })}
    </span>
  );
}

const ROTATE_MS = 2500;

const ROTATING_CLIENTS = [
  { name: 'Claude', icon: MCP_CLIENT_BRANDING.claude.icon, tint: '#d97757' },
  { name: 'ChatGPT', icon: MCP_CLIENT_BRANDING.chatgpt.icon, tint: '#10a37f' },
  { name: 'Cursor', icon: MCP_CLIENT_BRANDING.cursor.icon, tint: '#8a8a8a' },
  { name: 'Codex', icon: MCP_CLIENT_BRANDING.codex.icon, tint: '#8a8a8a' },
  {
    name: 'Gemini',
    icon: MCP_CLIENT_BRANDING['gemini-cli'].icon,
    tint: '#4285f4',
  },
  { name: 'VS Code', icon: MCP_CLIENT_BRANDING.vscode.icon, tint: '#007acc' },
  {
    name: 'Windsurf',
    icon: MCP_CLIENT_BRANDING.windsurf.icon,
    tint: '#34e8bb',
  },
];
