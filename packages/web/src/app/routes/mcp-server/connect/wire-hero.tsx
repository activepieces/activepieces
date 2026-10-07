import { t } from 'i18next';
import {
  Bot,
  CheckCheck,
  LucideIcon,
  ScrollText,
  Table2,
  Workflow,
  Wrench,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { LogoPlate } from '@/components/custom/logo-plate';
import { cn } from '@/lib/utils';

import { ClientIcon } from '../client-icon';
import { MCP_CLIENT_BRANDING } from '../mcp-client-display';

export function WireHero({ brandName }: { brandName: string }) {
  const stageRef = useRef<HTMLDivElement>(null);
  const nodeRefs = useRef(new Map<string, HTMLElement>());
  const [layout, setLayout] = useState<StageLayout | null>(null);
  const animate = !prefersReducedMotion();

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const measure = () => {
      const rects = new Map<string, Box>();
      nodeRefs.current.forEach((element, id) => {
        rects.set(id, {
          left: element.offsetLeft - element.offsetWidth / 2,
          top: element.offsetTop - element.offsetHeight / 2,
          width: element.offsetWidth,
          height: element.offsetHeight,
        });
      });
      setLayout({
        width: stage.clientWidth,
        height: stage.clientHeight,
        rects,
      });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(stage);
    return () => observer.disconnect();
  }, []);

  const nodes = buildNodes();

  return (
    <div ref={stageRef} className="relative h-[460px] w-full max-w-[1100px]">
      {layout && (
        <svg
          className="absolute inset-0"
          width={layout.width}
          height={layout.height}
          aria-hidden
        >
          {WIRES.map((wire, index) => {
            const from = anchor({ box: layout.rects.get(wire.from[0]), side: wire.from[1] });
            const to = anchor({ box: layout.rects.get(wire.to[0]), side: wire.to[1] });
            if (!from || !to) return null;
            const delay = `${0.3 + index * 0.08}s`;
            return (
              <g key={`${wire.from[0]}-${wire.to[0]}`}>
                <path
                  d={route({ from, to, route: wire.route })}
                  fill="none"
                  strokeWidth={1.5}
                  pathLength={1}
                  strokeDasharray={1}
                  strokeDashoffset={animate ? 1 : 0}
                  className="stroke-gray-7"
                >
                  {animate && (
                    <animate
                      attributeName="stroke-dashoffset"
                      from="1"
                      to="0"
                      dur="0.9s"
                      begin={delay}
                      fill="freeze"
                      calcMode="spline"
                      keySplines="0.25 0.1 0.25 1"
                      keyTimes="0;1"
                    />
                  )}
                </path>
                <circle cx={from.x} cy={from.y} r={3} className="fill-gray-9" />
                <circle cx={to.x} cy={to.y} r={3} className="fill-gray-9" />
              </g>
            );
          })}
        </svg>
      )}

      <div className="absolute left-1/2 top-1/2 flex w-[560px] max-w-full -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-4 text-center">
        <h1 className="text-4xl font-semibold leading-tight tracking-tight">
          {t('Do more with {brand}, everywhere you use AI.', {
            brand: brandName,
          })}
        </h1>
        <p className="text-base text-gray-11">
          {t(
            'Connect Claude, Cursor, ChatGPT or any MCP client. One-time OAuth sign-in, no API keys, revoke anytime.',
          )}
        </p>
      </div>

      {nodes.map((node, index) => (
        <div
          key={node.id}
          ref={(element) => {
            if (element) nodeRefs.current.set(node.id, element);
            else nodeRefs.current.delete(node.id);
          }}
          style={{
            left: `${node.x * 100}%`,
            top: `${node.y * 100}%`,
            animationDelay: `${index * 60}ms`,
          }}
          className="absolute -translate-x-1/2 -translate-y-1/2 animate-in fade-in zoom-in-95 duration-500 fill-mode-both motion-reduce:animate-none"
        >
          <NodeChip node={node} />
        </div>
      ))}
    </div>
  );
}

function NodeChip({ node }: { node: HeroNode }) {
  if (node.kind === 'apps') {
    return (
      <div className="flex items-center gap-1.5 rounded-xl border bg-panel p-1.5 shadow-sm">
        {APP_LOGOS.map((app) => (
          <LogoPlate
            key={app.name}
            src={app.logo}
            alt={app.name}
            title={app.name}
            className="size-8 rounded-lg p-1.5"
          />
        ))}
      </div>
    );
  }
  return (
    <div
      className={cn(
        'flex h-10 items-center gap-2 whitespace-nowrap rounded-xl border bg-panel px-3 text-sm font-medium shadow-sm',
      )}
    >
      {node.kind === 'client' ? (
        <ClientIcon icon={node.logo} className="size-6 rounded-md" />
      ) : (
        <node.icon className="size-4 text-gray-11" />
      )}
      {node.label}
    </div>
  );
}

function buildNodes(): HeroNode[] {
  return [
    { id: 'apps', kind: 'apps', x: 0.5, y: 0.07 },
    {
      id: 'claude',
      kind: 'client',
      x: 0.12,
      y: 0.2,
      label: MCP_CLIENT_BRANDING.claude.name,
      logo: MCP_CLIENT_BRANDING.claude.icon,
    },
    {
      id: 'vscode',
      kind: 'client',
      x: 0.88,
      y: 0.2,
      label: MCP_CLIENT_BRANDING.vscode.name,
      logo: MCP_CLIENT_BRANDING.vscode.icon,
    },
    { id: 'runs', kind: 'feature', x: 0.07, y: 0.5, label: t('Runs and audit'), icon: ScrollText },
    { id: 'tools', kind: 'feature', x: 0.93, y: 0.5, label: t('MCP tools'), icon: Wrench },
    {
      id: 'cursor',
      kind: 'client',
      x: 0.12,
      y: 0.8,
      label: MCP_CLIENT_BRANDING.cursor.name,
      logo: MCP_CLIENT_BRANDING.cursor.icon,
    },
    {
      id: 'chatgpt',
      kind: 'client',
      x: 0.88,
      y: 0.8,
      label: MCP_CLIENT_BRANDING.chatgpt.name,
      logo: MCP_CLIENT_BRANDING.chatgpt.icon,
    },
    { id: 'flows', kind: 'feature', x: 0.3, y: 0.93, label: t('Flows'), icon: Workflow },
    { id: 'agents', kind: 'feature', x: 0.43, y: 0.93, label: t('Agents'), icon: Bot },
    { id: 'tables', kind: 'feature', x: 0.57, y: 0.93, label: t('Tables'), icon: Table2 },
    { id: 'approvals', kind: 'feature', x: 0.7, y: 0.93, label: t('Approvals'), icon: CheckCheck },
  ];
}

function anchor({ box, side }: { box: Box | undefined; side: Side }): Point | null {
  if (!box) return null;
  const gap = 6;
  switch (side) {
    case 'left':
      return { x: box.left - gap, y: box.top + box.height / 2 };
    case 'right':
      return { x: box.left + box.width + gap, y: box.top + box.height / 2 };
    case 'top':
      return { x: box.left + box.width / 2, y: box.top - gap };
    case 'bottom':
      return { x: box.left + box.width / 2, y: box.top + box.height + gap };
  }
}

function route({ from, to, route: kind }: { from: Point; to: Point; route: Route }): string {
  const radius = 10;
  if (kind === 'hvh') {
    if (Math.abs(from.y - to.y) < 1) return `M ${from.x} ${from.y} H ${to.x}`;
    const midX = (from.x + to.x) / 2;
    const dirX = Math.sign(to.x - from.x);
    const dirY = Math.sign(to.y - from.y);
    const r = Math.min(radius, Math.abs(to.y - from.y) / 2, Math.abs(midX - from.x));
    return [
      `M ${from.x} ${from.y}`,
      `H ${midX - dirX * r}`,
      `Q ${midX} ${from.y} ${midX} ${from.y + dirY * r}`,
      `V ${to.y - dirY * r}`,
      `Q ${midX} ${to.y} ${midX + dirX * r} ${to.y}`,
      `H ${to.x}`,
    ].join(' ');
  }
  if (Math.abs(from.x - to.x) < 1) return `M ${from.x} ${from.y} V ${to.y}`;
  const midY = (from.y + to.y) / 2;
  const dirX = Math.sign(to.x - from.x);
  const dirY = Math.sign(to.y - from.y);
  const r = Math.min(radius, Math.abs(to.x - from.x) / 2, Math.abs(midY - from.y));
  return [
    `M ${from.x} ${from.y}`,
    `V ${midY - dirY * r}`,
    `Q ${from.x} ${midY} ${from.x + dirX * r} ${midY}`,
    `H ${to.x - dirX * r}`,
    `Q ${to.x} ${midY} ${to.x} ${midY + dirY * r}`,
    `V ${to.y}`,
  ].join(' ');
}

function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

const APP_LOGOS = [
  { name: 'Slack', logo: 'https://cdn.activepieces.com/pieces/slack.png' },
  { name: 'GitHub', logo: 'https://cdn.activepieces.com/pieces/github.png' },
  { name: 'Notion', logo: 'https://cdn.activepieces.com/pieces/notion.png' },
  { name: 'Gmail', logo: 'https://cdn.activepieces.com/pieces/gmail.png' },
  {
    name: 'Google Sheets',
    logo: 'https://cdn.activepieces.com/pieces/google-sheets.png',
  },
];

const WIRES: Wire[] = [
  { from: ['claude', 'right'], to: ['apps', 'left'], route: 'hvh' },
  { from: ['apps', 'right'], to: ['vscode', 'left'], route: 'hvh' },
  { from: ['claude', 'bottom'], to: ['runs', 'top'], route: 'vhv' },
  { from: ['vscode', 'bottom'], to: ['tools', 'top'], route: 'vhv' },
  { from: ['runs', 'bottom'], to: ['cursor', 'top'], route: 'vhv' },
  { from: ['tools', 'bottom'], to: ['chatgpt', 'top'], route: 'vhv' },
  { from: ['cursor', 'right'], to: ['flows', 'left'], route: 'hvh' },
  { from: ['approvals', 'right'], to: ['chatgpt', 'left'], route: 'hvh' },
  { from: ['flows', 'right'], to: ['agents', 'left'], route: 'hvh' },
  { from: ['agents', 'right'], to: ['tables', 'left'], route: 'hvh' },
  { from: ['tables', 'right'], to: ['approvals', 'left'], route: 'hvh' },
];

type Side = 'top' | 'right' | 'bottom' | 'left';
type Route = 'hvh' | 'vhv';
type Point = { x: number; y: number };
type Box = { left: number; top: number; width: number; height: number };
type StageLayout = { width: number; height: number; rects: Map<string, Box> };
type Wire = { from: [string, Side]; to: [string, Side]; route: Route };
type HeroNode =
  | { id: string; kind: 'apps'; x: number; y: number }
  | { id: string; kind: 'client'; x: number; y: number; label: string; logo: string }
  | { id: string; kind: 'feature'; x: number; y: number; label: string; icon: LucideIcon };
