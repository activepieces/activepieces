import { t } from 'i18next';
import { ArrowUpRight, History, Table2, Workflow } from 'lucide-react';
import { ComponentType } from 'react';

import {
  StageResource,
  useStageOptional,
} from '@/app/components/workspace-shell/stage-context';
import { useNewWindow } from '@/lib/navigation-utils';
import { cn } from '@/lib/utils';

type StageOpenResourceType = 'flow' | 'table' | 'run';

const ICON_BY_TYPE: Record<
  StageOpenResourceType,
  ComponentType<{ className?: string }>
> = {
  flow: Workflow,
  table: Table2,
  run: History,
};

export function StageOpenChip({
  resourceType,
  resourceId,
  displayName,
}: {
  resourceType: StageOpenResourceType;
  resourceId: string;
  displayName?: string;
}) {
  const stage = useStageOptional();
  const openNewWindow = useNewWindow();
  const Icon = ICON_BY_TYPE[resourceType];
  const fallbackLabelByType: Record<StageOpenResourceType, string> = {
    flow: t('flow'),
    table: t('table'),
    run: t('run'),
  };
  const label = displayName?.trim() || fallbackLabelByType[resourceType];

  const open = () => {
    const resource: StageResource = { type: resourceType, id: resourceId };
    if (stage) {
      stage.open(resource);
    } else {
      openNewWindow(`/${resourceType}s/${resourceId}`);
    }
  };

  return (
    <button
      type="button"
      onClick={open}
      className={cn(
        'group inline-flex max-w-full items-center gap-1.5 rounded-lg border border-border/60 bg-background',
        'px-2.5 py-1.5 text-xs font-medium text-muted-foreground shadow-none transition-colors',
        'hover:bg-foreground/[0.06] hover:text-foreground',
      )}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" />
      <span className="truncate">{t('Opened {label}', { label })}</span>
      <ArrowUpRight className="h-3.5 w-3.5 shrink-0 opacity-60 transition-opacity group-hover:opacity-100" />
    </button>
  );
}
