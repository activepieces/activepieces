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
import { ReactNode, useEffect, useRef, useState } from 'react';

import { LogoPlate } from '@/components/custom/logo-plate';

export function WireFrame({
  header,
  children,
}: {
  header: ReactNode;
  children: ReactNode;
}) {
  const headerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const nodeRefs = useRef(new Map<string, HTMLElement>());
  const [layout, setLayout] = useState<StageLayout | null>(null);
  const animate = !prefersReducedMotion();

  useEffect(() => {
    const stage = stageRef.current;
    const content = contentRef.current;
    if (!stage || !content) return;
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
      const head = headerRef.current;
      if (head) {
        rects.set(HEADER_ID, {
          left: head.offsetLeft,
          top: head.offsetTop,
          width: head.offsetWidth,
          height: head.offsetHeight,
        });
      }
      rects.set(CONTENT_ID, {
        left: content.offsetLeft,
        top: content.offsetTop,
        width: content.offsetWidth,
        height: content.offsetHeight,
      });
      setLayout({
        width: stage.clientWidth,
        height: stage.clientHeight,
        rects,
        visible: stage.clientWidth >= MIN_FRAME_WIDTH,
      });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(stage);
    observer.observe(content);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={stageRef} className="relative w-full xl:px-[184px] xl:pb-[100px]">
      {layout?.visible && (
        <svg
          className="pointer-events-none absolute inset-0 hidden xl:block"
          width={layout.width}
          height={layout.height}
          aria-hidden
        >
          {WIRES.map((wire, index) => {
            const from = anchor({
              box: layout.rects.get(wire.from[0]),
              side: wire.from[1],
              at: wire.from[2],
            });
            const target = anchor({
              box: layout.rects.get(wire.to[0]),
              side: wire.to[1],
              at: wire.to[2],
            });
            if (!from || !target) return null;
            const to = alignToContent({ wire, from, target });
            return (
              <g key={`${wire.from[0]}-${wire.from[1]}-${wire.to[0]}`}>
                <path
                  d={route({ from, to, kind: wire.route })}
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
                      begin={`${0.2 + index * 0.07}s`}
                      fill="freeze"
                      calcMode="spline"
                      keyTimes="0;1"
                      keySplines="0.25 0.1 0.25 1"
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

      {NODES.map((node, index) => (
        <div
          key={node.id}
          ref={(element) => {
            if (element) nodeRefs.current.set(node.id, element);
            else nodeRefs.current.delete(node.id);
          }}
          style={{
            left: node.left,
            top: node.top,
            animationDelay: `${index * 60}ms`,
          }}
          className="absolute hidden -translate-x-1/2 -translate-y-1/2 animate-in fade-in zoom-in-95 duration-500 fill-mode-both motion-reduce:animate-none xl:block"
        >
          <NodeChip node={node} />
        </div>
      ))}

      <div className="flex justify-center pb-8 xl:h-[176px] xl:items-center xl:pb-0">
        <div ref={headerRef}>{header}</div>
      </div>
      <div ref={contentRef} className="relative xl:mt-14">
        {children}
      </div>
    </div>
  );
}

function NodeChip({ node }: { node: FrameNode }) {
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
    <div className="flex h-9 items-center gap-2 whitespace-nowrap rounded-xl border bg-panel px-3 text-sm font-medium shadow-sm">
      <node.icon className="size-4 text-gray-11" />
      {node.label()}
    </div>
  );
}

function anchor({
  box,
  side,
  at = 0.5,
}: {
  box: Box | undefined;
  side: Side;
  at?: number;
}): Point | null {
  if (!box) return null;
  const gap = 6;
  switch (side) {
    case 'left':
      return { x: box.left - gap, y: box.top + box.height * at };
    case 'right':
      return { x: box.left + box.width + gap, y: box.top + box.height * at };
    case 'top':
      return { x: box.left + box.width * at, y: box.top - gap };
    case 'bottom':
      return { x: box.left + box.width * at, y: box.top + box.height + gap };
  }
}

function route({
  from,
  to,
  kind,
}: {
  from: Point;
  to: Point;
  kind: RouteKind;
}): string {
  const radius = 12;
  const dirX = Math.sign(to.x - from.x);
  const dirY = Math.sign(to.y - from.y);
  const dx = Math.abs(to.x - from.x);
  const dy = Math.abs(to.y - from.y);
  if (dx < 1 || dy < 1) return `M ${from.x} ${from.y} L ${to.x} ${to.y}`;
  const r = Math.min(radius, dx, dy);
  if (kind === 'hv') {
    return `M ${from.x} ${from.y} H ${to.x - dirX * r} Q ${to.x} ${from.y} ${
      to.x
    } ${from.y + dirY * r} V ${to.y}`;
  }
  return `M ${from.x} ${from.y} V ${to.y - dirY * r} Q ${from.x} ${to.y} ${
    from.x + dirX * r
  } ${to.y} H ${to.x}`;
}

function alignToContent({
  wire,
  from,
  target,
}: {
  wire: Wire;
  from: Point;
  target: Point;
}): Point {
  if (wire.to[0] !== CONTENT_ID) return target;
  const isSide = wire.to[1] === 'left' || wire.to[1] === 'right';
  return isSide ? { x: target.x, y: from.y } : { x: from.x, y: target.y };
}

function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

const CONTENT_ID = 'content';
const HEADER_ID = 'header';
const MIN_FRAME_WIDTH = 900;
const GUTTER = '76px';

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

const NODES: FrameNode[] = [
  { id: 'apps', kind: 'apps', left: '120px', top: '88px' },
  {
    id: 'tools',
    kind: 'feature',
    left: 'calc(100% - 110px)',
    top: '88px',
    icon: Wrench,
    label: () => t('MCP tools'),
  },
  {
    id: 'flows',
    kind: 'feature',
    left: GUTTER,
    top: '30%',
    icon: Workflow,
    label: () => t('Flows'),
  },
  {
    id: 'agents',
    kind: 'feature',
    left: GUTTER,
    top: '70%',
    icon: Bot,
    label: () => t('Agents'),
  },
  {
    id: 'tables',
    kind: 'feature',
    left: `calc(100% - ${GUTTER})`,
    top: '30%',
    icon: Table2,
    label: () => t('Tables'),
  },
  {
    id: 'approvals',
    kind: 'feature',
    left: `calc(100% - ${GUTTER})`,
    top: '70%',
    icon: CheckCheck,
    label: () => t('Approvals'),
  },
  {
    id: 'runs',
    kind: 'feature',
    left: '50%',
    top: 'calc(100% - 50px)',
    icon: ScrollText,
    label: () => t('Runs and audit'),
  },
];

const WIRES: Wire[] = [
  { from: [HEADER_ID, 'left'], to: ['apps', 'right'], route: 'hv' },
  { from: [HEADER_ID, 'right'], to: ['tools', 'left'], route: 'hv' },
  { from: ['apps', 'bottom'], to: ['flows', 'top'], route: 'vh' },
  { from: ['flows', 'bottom'], to: ['agents', 'top'], route: 'vh' },
  { from: ['agents', 'bottom'], to: ['runs', 'left'], route: 'vh' },
  { from: ['runs', 'right'], to: ['approvals', 'bottom'], route: 'hv' },
  { from: ['approvals', 'top'], to: ['tables', 'bottom'], route: 'vh' },
  { from: ['tables', 'top'], to: ['tools', 'bottom'], route: 'vh' },
];

type Side = 'top' | 'right' | 'bottom' | 'left';
type RouteKind = 'hv' | 'vh';
type Point = { x: number; y: number };
type Box = { left: number; top: number; width: number; height: number };
type StageLayout = {
  width: number;
  height: number;
  rects: Map<string, Box>;
  visible: boolean;
};
type Wire = {
  from: [string, Side, number?];
  to: [string, Side, number?];
  route: RouteKind;
};
type FrameNode =
  | { id: string; kind: 'apps'; left: string; top: string }
  | {
      id: string;
      kind: 'feature';
      left: string;
      top: string;
      icon: LucideIcon;
      label: () => string;
    };
