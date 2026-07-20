import {
  ProjectType,
  TeamProjectsLimit,
  ProjectWithLimits,
} from '@activepieces/shared';
import { t } from 'i18next';
import { Plus } from 'lucide-react';

import { AnimatedIconButton } from '@/components/custom/animated-icon-button';
import { PlusIcon } from '@/components/icons/plus';
import { Button } from '@/components/ui/button';
import { SidebarMenuButton } from '@/components/ui/sidebar-shadcn';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { platformHooks } from '@/hooks/platform-hooks';
import { cn } from '@/lib/utils';

import { NewProjectDialog } from './new-project-dialog';

function useIsCreateProjectDisabled({
  projects,
}: {
  projects: Pick<ProjectWithLimits, 'type'>[];
}) {
  const { platform } = platformHooks.useCurrentPlatform();
  if (platform.plan.teamProjectsLimit === TeamProjectsLimit.ONE) {
    const teamProjects = projects.filter(
      (project) => project.type === ProjectType.TEAM,
    );
    return teamProjects.length >= 1;
  }
  return false;
}

function UpgradeTooltip({ children }: { children: React.ReactNode }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent className="max-w-[250px]">
        <p className="text-xs mb-1">
          {t('Upgrade your plan to create additional team projects.')}{' '}
          <button
            className="text-xs text-primary underline hover:no-underline"
            onClick={() =>
              window.open('https://www.activepieces.com/pricing', '_blank')
            }
          >
            {t('View Plans')}
          </button>
        </p>
      </TooltipContent>
    </Tooltip>
  );
}

function IconVariant({
  disabled,
  onCreate,
}: {
  disabled: boolean;
  onCreate?: (project: ProjectWithLimits) => void;
}) {
  if (disabled) {
    return (
      <UpgradeTooltip>
        <div>
          <Button variant="ghost" size="icon" disabled className="h-6 w-6">
            <Plus />
          </Button>
        </div>
      </UpgradeTooltip>
    );
  }
  return (
    <NewProjectDialog onCreate={onCreate}>
      <Button variant="ghost" size="icon" className="h-6 w-6 hover:bg-accent">
        <Plus />
      </Button>
    </NewProjectDialog>
  );
}

function FullVariant({
  disabled,
  onCreate,
}: {
  disabled: boolean;
  onCreate?: (project: ProjectWithLimits) => void;
}) {
  if (disabled) {
    return (
      <UpgradeTooltip>
        <div>
          <AnimatedIconButton icon={PlusIcon} iconSize={16} size="sm" disabled>
            {t('New Project')}
          </AnimatedIconButton>
        </div>
      </UpgradeTooltip>
    );
  }
  return (
    <NewProjectDialog onCreate={onCreate}>
      <AnimatedIconButton icon={PlusIcon} iconSize={16} size="sm">
        {t('New Project')}
      </AnimatedIconButton>
    </NewProjectDialog>
  );
}

function GhostVariant({
  disabled,
  onCreate,
}: {
  disabled: boolean;
  onCreate?: (project: ProjectWithLimits) => void;
}) {
  const button = (
    <Button
      variant="ghost"
      size="sm"
      disabled={disabled}
      className="gap-2 text-primary hover:bg-primary/5 hover:text-primary"
    >
      <Plus className="size-4" />
      {t('New Project')}
    </Button>
  );
  if (disabled) {
    return (
      <UpgradeTooltip>
        <div>{button}</div>
      </UpgradeTooltip>
    );
  }
  return <NewProjectDialog onCreate={onCreate}>{button}</NewProjectDialog>;
}

function SidebarMenuVariant({
  disabled,
  onCreate,
}: {
  disabled: boolean;
  onCreate?: (project: ProjectWithLimits) => void;
}) {
  if (disabled) {
    return (
      <UpgradeTooltip>
        <SidebarMenuButton disabled className="text-muted-foreground gap-2">
          <Plus className="size-4" />
          <span>{t('Add team project')}</span>
        </SidebarMenuButton>
      </UpgradeTooltip>
    );
  }
  return (
    <NewProjectDialog onCreate={onCreate}>
      <SidebarMenuButton className="text-muted-foreground gap-2">
        <Plus className="size-4" />
        <span>{t('Add team project')}</span>
      </SidebarMenuButton>
    </NewProjectDialog>
  );
}

function MenuItemVariant({
  disabled,
  onCreate,
}: {
  disabled: boolean;
  onCreate?: (project: ProjectWithLimits) => void;
}) {
  const rowClass =
    'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm font-medium transition-colors';
  const iconChip = (
    <span className="flex size-5 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
      <Plus className="size-3.5" strokeWidth={2.5} />
    </span>
  );
  if (disabled) {
    return (
      <UpgradeTooltip>
        <button type="button" disabled className={cn(rowClass, 'opacity-50')}>
          {iconChip}
          <span>{t('New project')}</span>
        </button>
      </UpgradeTooltip>
    );
  }
  return (
    <NewProjectDialog onCreate={onCreate}>
      <button type="button" className={cn(rowClass, 'hover:bg-accent')}>
        {iconChip}
        <span>{t('New project')}</span>
      </button>
    </NewProjectDialog>
  );
}

export function CreateProjectButton({
  variant,
  projects,
  onCreate,
}: {
  variant: 'icon' | 'full' | 'ghost' | 'sidebar-menu' | 'menu-item';
  projects: Pick<ProjectWithLimits, 'type'>[];
  onCreate?: (project: ProjectWithLimits) => void;
}) {
  const disabled = useIsCreateProjectDisabled({ projects });
  if (variant === 'icon') {
    return <IconVariant disabled={disabled} onCreate={onCreate} />;
  }
  if (variant === 'ghost') {
    return <GhostVariant disabled={disabled} onCreate={onCreate} />;
  }
  if (variant === 'sidebar-menu') {
    return <SidebarMenuVariant disabled={disabled} onCreate={onCreate} />;
  }
  if (variant === 'menu-item') {
    return <MenuItemVariant disabled={disabled} onCreate={onCreate} />;
  }
  return <FullVariant disabled={disabled} onCreate={onCreate} />;
}
