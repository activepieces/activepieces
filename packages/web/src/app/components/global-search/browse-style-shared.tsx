import { PROJECT_COLOR_PALETTE } from '@activepieces/shared';
import { t } from 'i18next';
import {
  Check,
  ChevronDown,
  CornerDownLeft,
  FileText,
  Folder,
  PanelRightOpen,
  Table2,
  User,
  Workflow,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import {
  type KeyboardEvent,
  type ReactNode,
  useEffect,
  useRef,
  useState,
} from 'react';

import { CreateProjectButton } from '@/features/projects/components/create-project-button';
import { cn } from '@/lib/utils';

import { type BrowseController } from './use-browse-controller';
import { type SearchResultItem } from './use-global-search-results';

const GLIDE = {
  type: 'spring',
  stiffness: 620,
  damping: 46,
  mass: 0.7,
} as const;

const DENSITY: Record<Density, { row: string; tile: number }> = {
  compact: { row: 'h-12 gap-3 px-2.5', tile: 28 },
  cozy: { row: 'h-14 gap-3.5 px-3', tile: 32 },
  airy: { row: 'h-16 gap-4 px-3.5', tile: 36 },
};

const TILE: Record<
  string,
  {
    tint: string;
    icon: string;
    Icon: React.ComponentType<{ className?: string }>;
  }
> = {
  flow: {
    tint: 'bg-violet-500/[0.12]',
    icon: 'text-violet-500',
    Icon: Workflow,
  },
  table: {
    tint: 'bg-emerald-500/[0.12]',
    icon: 'text-emerald-500',
    Icon: Table2,
  },
  folder: {
    tint: 'bg-amber-500/[0.12]',
    icon: 'text-amber-500',
    Icon: Folder,
  },
  project: { tint: 'bg-sky-500/[0.12]', icon: 'text-sky-500', Icon: User },
  default: {
    tint: 'bg-muted',
    icon: 'text-muted-foreground',
    Icon: FileText,
  },
};

function ItemTile({
  type,
  size = 28,
}: {
  type: SearchResultItem['type'];
  size?: number;
}) {
  const tile = TILE[type] ?? TILE.default;
  return (
    <span
      className={cn(
        'flex shrink-0 items-center justify-center rounded-[10px]',
        tile.tint,
      )}
      style={{ width: size, height: size }}
    >
      <tile.Icon className={cn('size-[18px]', tile.icon)} />
    </span>
  );
}

function ResultRow({
  item,
  selected,
  onClick,
  onHover,
  innerRef,
  density = 'cozy',
  query,
}: {
  item: SearchResultItem;
  selected?: boolean;
  onClick: () => void;
  onHover?: () => void;
  innerRef?: React.Ref<HTMLButtonElement>;
  density?: Density;
  query?: string;
}) {
  const meta = item.folderName ?? item.projectName ?? null;
  const d = DENSITY[density];
  return (
    <button
      ref={innerRef}
      type="button"
      onClick={onClick}
      onMouseMove={onHover}
      onMouseDown={(e) => e.preventDefault()}
      data-selected={selected ? 'true' : undefined}
      className={cn(
        'group relative flex w-full items-center rounded-xl text-left',
        d.row,
      )}
    >
      {selected && (
        <motion.span
          layoutId="browse-row-highlight"
          transition={GLIDE}
          className="absolute inset-0 rounded-xl bg-foreground/[0.07]"
        />
      )}
      <span className="relative z-10 flex w-full items-center gap-3">
        <ItemTile type={item.type} size={d.tile} />
        <span className="min-w-0 flex-1 truncate text-[15px] font-medium text-foreground">
          <Highlight text={item.label} query={query} />
        </span>
        {meta && (
          <span className="shrink-0 truncate text-xs text-muted-foreground/55">
            {meta}
          </span>
        )}
        {item.status === 'ENABLED' && (
          <span className="size-1.5 shrink-0 rounded-full bg-emerald-500" />
        )}
        <CornerDownLeft
          className={cn(
            'size-3.5 shrink-0 text-muted-foreground/50 transition-opacity duration-150',
            selected ? 'opacity-100' : 'opacity-0',
          )}
        />
      </span>
    </button>
  );
}

function EmptyState({ hasQuery }: { hasQuery: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      className="flex flex-col items-center justify-center gap-2 py-20 text-center"
    >
      <div className="flex size-10 items-center justify-center rounded-2xl bg-muted/60">
        <FileText className="size-5 text-muted-foreground/40" />
      </div>
      <p className="text-sm text-muted-foreground/70">
        {hasQuery ? t('No results found.') : t('Nothing here yet.')}
      </p>
    </motion.div>
  );
}

function Skeletons({ density = 'cozy' }: { density?: Density }) {
  const d = DENSITY[density];
  return (
    <div className="flex flex-col">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className={cn('flex items-center', d.row)}>
          <div
            className="shrink-0 animate-pulse rounded-lg bg-muted"
            style={{ width: d.tile, height: d.tile }}
          />
          <div className="ml-3 flex flex-1 flex-col gap-1.5">
            <div
              className="h-3 animate-pulse rounded bg-muted"
              style={{ width: `${46 - i * 6}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

const PAGE = 25;

export function ResultGroups({
  controller,
  density = 'cozy',
  heading,
}: {
  controller: BrowseController;
  density?: Density;
  heading?: (text: string) => ReactNode;
}) {
  const [visibleCount, setVisibleCount] = useState(PAGE);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const selectedRef = useRef<HTMLButtonElement>(null);
  const { category, projectFilter, hasQuery, selectedIndex, rowCount } =
    controller;

  useEffect(() => {
    setVisibleCount(PAGE);
  }, [category, projectFilter, hasQuery]);

  useEffect(() => {
    if (selectedIndex >= visibleCount) setVisibleCount(selectedIndex + PAGE);
  }, [selectedIndex, visibleCount]);

  useEffect(() => {
    selectedRef.current?.scrollIntoView({ block: 'nearest' });
  }, [selectedIndex]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) setVisibleCount((c) => c + PAGE);
      },
      { rootMargin: '0px 0px 200px 0px' },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [visibleCount, category, projectFilter, hasQuery]);

  if (controller.isLoading) return <Skeletons density={density} />;
  if (controller.groups.length === 0)
    return <EmptyState hasQuery={controller.hasQuery} />;

  let itemIndex = -1;
  let rendered = 0;
  const groupsOut: ReactNode[] = [];
  for (const group of controller.groups) {
    if (rendered >= visibleCount) break;
    const rows: ReactNode[] = [];
    for (const item of group.items) {
      if (rendered >= visibleCount) break;
      itemIndex += 1;
      const index = itemIndex;
      const selected = index === selectedIndex;
      rows.push(
        <ResultRow
          key={item.id}
          item={item}
          density={density}
          selected={selected}
          innerRef={selected ? selectedRef : undefined}
          onClick={() => controller.openItem(item)}
          onHover={() => controller.setSelected(index)}
          query={hasQuery ? controller.debouncedSearch : undefined}
        />,
      );
      rendered += 1;
    }
    if (rows.length === 0) continue;
    groupsOut.push(
      <div key={group.type}>
        {group.heading &&
          (heading ? (
            heading(group.heading)
          ) : (
            <div className="px-3 pb-1 pt-1 text-[11px] font-medium uppercase tracking-[0.06em] text-muted-foreground/45">
              {group.heading}
            </div>
          ))}
        {rows}
      </div>,
    );
  }

  return (
    <div className="flex flex-col gap-1">
      {groupsOut}
      {rendered < rowCount && <div ref={sentinelRef} className="h-4 w-full" />}
    </div>
  );
}

export function makeSearchKeyDown(controller: BrowseController) {
  return (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      controller.moveSelection(1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      controller.moveSelection(-1);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      controller.openSelected();
    } else if (controller.search === '' && e.key === 'ArrowRight') {
      e.preventDefault();
      controller.cycleScopeFilter(1);
    } else if (controller.search === '' && e.key === 'ArrowLeft') {
      e.preventDefault();
      controller.cycleScopeFilter(-1);
    }
  };
}

export function ScopeToggle({
  controller,
  align,
}: {
  controller: BrowseController;
  align?: 'center';
}) {
  const isProject = controller.category === 'project';
  const palette = controller.currentProject?.icon
    ? PROJECT_COLOR_PALETTE[controller.currentProject.icon.color]
    : null;
  const label = (active: boolean) =>
    cn(
      'relative z-10 transition-colors duration-200',
      active ? 'text-foreground' : 'text-muted-foreground',
    );
  return (
    <div
      className={cn(
        'relative flex items-center',
        align === 'center' && 'justify-center',
      )}
    >
      <div className="flex items-center gap-1 rounded-xl bg-muted/40 p-1">
        <button
          type="button"
          onClick={() => controller.setCategory('recent')}
          onMouseDown={(e) => e.preventDefault()}
          className="relative rounded-lg px-3 py-1.5 text-[13px] font-medium"
        >
          {!isProject && (
            <motion.span
              layoutId="browse-scope-pill"
              transition={GLIDE}
              className="absolute inset-0 rounded-lg bg-background shadow-sm ring-1 ring-inset ring-foreground/[0.06]"
            />
          )}
          <span className={label(!isProject)}>{t('Recents')}</span>
        </button>
        <button
          type="button"
          onClick={() =>
            isProject
              ? controller.handleProjectMenuOpenChange(
                  !controller.projectMenuOpen,
                )
              : controller.setCategory('project')
          }
          onMouseDown={(e) => e.preventDefault()}
          className="relative flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px] font-medium"
        >
          {isProject && (
            <motion.span
              layoutId="browse-scope-pill"
              transition={GLIDE}
              className="absolute inset-0 rounded-lg bg-background shadow-sm ring-1 ring-inset ring-foreground/[0.06]"
            />
          )}
          {palette && (
            <span
              className="relative z-10 flex size-4 shrink-0 items-center justify-center rounded-[5px] text-[9px] font-bold"
              style={{
                backgroundColor: palette.color,
                color: palette.textColor,
              }}
            >
              {controller.currentProjectName.charAt(0).toUpperCase()}
            </span>
          )}
          <span className={cn('max-w-[170px] truncate', label(isProject))}>
            {controller.currentProjectName || t('Project')}
          </span>
          <ChevronDown
            className={cn(
              'relative z-10 size-3.5 transition-opacity',
              isProject ? 'opacity-50' : 'opacity-25',
            )}
          />
        </button>
      </div>
      <ProjectMenu controller={controller} align={align ? 'right' : 'left'} />
    </div>
  );
}

function ProjectMenu({
  controller,
  align = 'left',
}: {
  controller: BrowseController;
  align?: 'left' | 'right';
}) {
  return (
    <AnimatePresence>
      {controller.projectMenuOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => controller.handleProjectMenuOpenChange(false)}
          />
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.14, ease: [0.32, 0.72, 0, 1] }}
            className={cn(
              'absolute top-full z-50 mt-2 max-h-[300px] min-w-[240px] origin-top overflow-y-auto rounded-2xl border border-foreground/[0.08] bg-popover/95 p-1.5 shadow-xl backdrop-blur-xl',
              align === 'left' ? 'left-0' : 'right-0',
            )}
          >
            {controller.allProjects.map((project) => {
              const palette = project.icon
                ? PROJECT_COLOR_PALETTE[project.icon.color]
                : null;
              const name = project.displayName;
              const isCurrent = project.id === controller.projectId;
              return (
                <div
                  key={project.id}
                  className={cn(
                    'group flex items-center gap-1 rounded-xl pr-1 transition-colors hover:bg-foreground/[0.05]',
                    isCurrent && 'bg-foreground/[0.04]',
                  )}
                >
                  <button
                    type="button"
                    onClick={() => controller.switchProject(project.id)}
                    className="flex min-w-0 flex-1 items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-sm"
                  >
                    <span
                      className="flex size-6 shrink-0 items-center justify-center rounded-lg text-[11px] font-bold"
                      style={{
                        backgroundColor: palette?.color,
                        color: palette?.textColor,
                      }}
                    >
                      {name.charAt(0).toUpperCase()}
                    </span>
                    <span className="min-w-0 flex-1 truncate font-medium">
                      {name}
                    </span>
                    {isCurrent && (
                      <Check className="size-4 shrink-0 text-primary" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      controller.openProject(project.id);
                    }}
                    aria-label={t('Open full view')}
                    title={t('Open full view')}
                    className="flex size-7 shrink-0 items-center justify-center rounded-lg text-muted-foreground/60 transition-colors hover:bg-foreground/[0.08] hover:text-foreground"
                  >
                    <PanelRightOpen className="size-4" />
                  </button>
                </div>
              );
            })}
            <div className="mt-1 border-t border-foreground/[0.06] pt-1">
              <CreateProjectButton
                variant="menu-item"
                projects={controller.allProjects}
                onCreate={(project) => controller.openProject(project.id)}
              />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function Highlight({ text, query }: { text: string; query?: string }) {
  if (!query) return <>{text}</>;
  const lower = text.toLowerCase();
  const q = query.toLowerCase();
  const idx = lower.indexOf(q);
  if (idx === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <span className="font-semibold text-foreground">
        {text.slice(idx, idx + query.length)}
      </span>
      {text.slice(idx + query.length)}
    </>
  );
}

type Density = 'compact' | 'cozy' | 'airy';
