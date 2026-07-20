import { ProjectType } from '@activepieces/shared';
import { t } from 'i18next';
import {
  Loader2,
  LucideIcon,
  MessageCircle,
  Table2,
  Workflow,
} from 'lucide-react';
import { useMemo, useState } from 'react';

import { useEmbedding } from '@/components/providers/embed-provider';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { projectCollectionUtils } from '@/features/projects';
import { platformHooks } from '@/hooks/platform-hooks';
import { authenticationSession } from '@/lib/authentication-session';
import { cn } from '@/lib/utils';

import { CreateProjectSelect } from './create-project-select';
import { useCreateActions } from './use-create-actions';

export function CreatePanel({ onClose }: { onClose: () => void }) {
  const { embedState } = useEmbedding();
  const { platform } = platformHooks.useCurrentPlatform();
  const chatEnabled = platform.plan.chatEnabled;
  const { data: projects = [] } = projectCollectionUtils.useAll();
  const defaultProjectId = useMemo(() => {
    const personal = projects.find((p) => p.type === ProjectType.PERSONAL);
    return (
      personal?.id ??
      authenticationSession.getProjectId() ??
      projects[0]?.id ??
      null
    );
  }, [projects]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    defaultProjectId,
  );
  const {
    createChat,
    createFlow,
    createTable,
    isCreatingFlow,
    isCreatingTable,
  } = useCreateActions({ onClose });

  const projectId = selectedProjectId ?? defaultProjectId;
  const run = (action: (projectId: string) => void) => {
    if (projectId) {
      action(projectId);
    }
  };

  const chatTile: CreateTileConfig = {
    key: 'chat',
    label: t('Chat'),
    caption: t('Ask AI to get things done'),
    icon: MessageCircle,
    iconClassName: 'bg-violet-500/10 text-violet-600 dark:text-violet-400',
    onClick: () => run(createChat),
  };
  const flowTile: CreateTileConfig = {
    key: 'flow',
    label: t('Flow'),
    caption: t('Build an automation'),
    icon: Workflow,
    iconClassName: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
    loading: isCreatingFlow,
    onClick: () => run(createFlow),
  };
  const baseTiles: CreateTileConfig[] = chatEnabled
    ? [chatTile, flowTile]
    : [flowTile];
  const tableTile: CreateTileConfig = {
    key: 'table',
    label: t('Table'),
    caption: t('Store & organize data'),
    icon: Table2,
    iconClassName: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    loading: isCreatingTable,
    onClick: () => run(createTable),
  };
  const tiles = embedState.hideTables ? baseTiles : [...baseTiles, tableTile];

  const disabled = isCreatingFlow || isCreatingTable || !projectId;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2 pl-1">
        <span className="text-sm font-semibold">{t('Create new')}</span>
        <CreateProjectSelect
          projects={projects}
          value={selectedProjectId}
          onChange={setSelectedProjectId}
        />
      </div>
      <TooltipProvider delayDuration={200}>
        <div
          className={cn(
            'grid gap-2',
            // Cap the two-tile layout to the same column width tiles get in the
            // three-up grid so a missing tile (e.g. chat off) doesn't blow the
            // remaining tiles up to fill the fixed-width popover.
            tiles.length >= 3 ? 'grid-cols-3' : 'grid-cols-2 max-w-[182px]',
          )}
        >
          {tiles.map((tile) => (
            <CreateTile key={tile.key} tile={tile} disabled={disabled} />
          ))}
        </div>
      </TooltipProvider>
    </div>
  );
}

function CreateTile({
  tile,
  disabled,
}: {
  tile: CreateTileConfig;
  disabled: boolean;
}) {
  const Icon = tile.icon;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={tile.onClick}
          disabled={disabled}
          className={cn(
            'group flex aspect-square flex-col items-center justify-center gap-2 rounded-xl border border-border/60 bg-background/50 p-2 text-center transition-all',
            'hover:border-primary/40 hover:bg-accent hover:shadow-sm',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            'disabled:pointer-events-none disabled:opacity-60',
          )}
        >
          <span
            className={cn(
              'flex size-9 items-center justify-center rounded-lg transition-transform group-hover:scale-105',
              tile.iconClassName,
            )}
          >
            {tile.loading ? (
              <Loader2 className="size-[18px] animate-spin" />
            ) : (
              <Icon className="size-[18px]" />
            )}
          </span>
          <span className="text-[13px] font-semibold leading-none">
            {tile.label}
          </span>
        </button>
      </TooltipTrigger>
      <TooltipContent side="bottom">{tile.caption}</TooltipContent>
    </Tooltip>
  );
}

type CreateTileConfig = {
  key: string;
  label: string;
  caption: string;
  icon: LucideIcon;
  iconClassName: string;
  loading?: boolean;
  onClick: () => void;
};
