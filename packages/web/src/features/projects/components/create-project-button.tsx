import {
  PlatformAdminLimit,
  ProjectWithLimits,
  TelemetryEventName,
} from '@activepieces/shared';
import { t } from 'i18next';
import { Plus } from 'lucide-react';
import React, { useState } from 'react';

import { AnimatedIconButton } from '@/components/custom/animated-icon-button';
import { PlusIcon } from '@/components/icons/plus';
import { useTelemetry } from '@/components/providers/telemetry-provider';
import { Button } from '@/components/ui/button';
import { SidebarMenuButton } from '@/components/ui/sidebar-shadcn';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  PLATFORM_FEATURES,
  LockedGem,
  useEnterpriseGate,
  useFeatureGate,
  useTeamProjectLimitGuard,
} from '@/features/billing';
import { AdminControl, adminControl } from '@/lib/admin-control';
import { cn } from '@/lib/utils';

import { NewProjectDialog } from './new-project-dialog';

export function CreateProjectButton({
  variant,
  projects,
  onCreate,
  className,
}: CreateProjectButtonProps) {
  const { hasReachedLimit, used, limit } = useTeamProjectLimitGuard({
    projects,
  });
  const projectsGate = useFeatureGate({
    locked: hasReachedLimit,
    feature: PLATFORM_FEATURES.projects,
  });
  const gate = useEnterpriseGate({
    unlocked: !hasReachedLimit,
    featureKey: PLATFORM_FEATURES.projects.featureKey,
  });
  const [createOpen, setCreateOpen] = useState(false);
  const { capture } = useTelemetry();
  const reportBlocked = () =>
    capture({
      name: TelemetryEventName.PLATFORM_ADMIN_GATE_BLOCKED,
      payload: {
        feature: PLATFORM_FEATURES.projects.featureKey,
        control: AdminControl.PROJECTS_NEW_OPEN,
      },
    });

  const trigger = triggerFor({
    variant,
    className,
    crown: projectsGate.crown,
    locked: projectsGate.locked,
    onClick: () => {
      if (!gate.locked) {
        setCreateOpen(true);
        return;
      }
      reportBlocked();
      capture({
        name: TelemetryEventName.PLATFORM_ADMIN_LIMIT_REACHED,
        payload: {
          limit: PlatformAdminLimit.TEAM_PROJECTS,
          used,
          allowed: limit ?? 0,
        },
      });
      if (gate.access === 'community') {
        projectsGate.open();
        return;
      }
      gate.run(() => setCreateOpen(true));
    },
  });

  const triggerNode =
    variant === 'icon' ? (
      <TooltipTrigger
        asChild
        aria-label={
          projectsGate.locked
            ? `${t('Create Project')}, ${t('Requires a plan upgrade')}`
            : t('Create Project')
        }
      >
        {trigger}
      </TooltipTrigger>
    ) : (
      trigger
    );

  const dialog = (
    <>
      {triggerNode}
      <NewProjectDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreate={onCreate}
      />
      {projectsGate.dialog}
    </>
  );

  if (variant !== 'icon') {
    return dialog;
  }

  return (
    <Tooltip>
      {dialog}
      <TooltipContent side="bottom">
        <span className="flex flex-col">
          <span>{t('Create Project')}</span>
          {projectsGate.locked && (
            <span className="opacity-70">{t('Requires a plan upgrade')}</span>
          )}
        </span>
      </TooltipContent>
    </Tooltip>
  );
}

function triggerFor({
  variant,
  className,
  crown,
  locked,
  onClick,
}: TriggerForParams) {
  const control = {
    ...adminControl(locked ? undefined : AdminControl.PROJECTS_NEW_OPEN),
    onClick,
  };
  switch (variant) {
    case 'icon':
      return (
        <Button
          variant="ghost"
          size="icon-xs"
          className={cn('hover:bg-gray-4', className)}
          {...control}
        >
          {locked ? <LockedGem className="size-4 text-accent-11" /> : <Plus />}
        </Button>
      );
    case 'full':
      return crown ? (
        <Button
          size="sm"
          className={cn('has-[>svg]:px-2.5', className)}
          {...control}
        >
          {crown}
          {t('New Project')}
        </Button>
      ) : (
        <AnimatedIconButton
          icon={PlusIcon}
          iconSize={16}
          size="sm"
          className={className}
          {...control}
        >
          {t('New Project')}
        </AnimatedIconButton>
      );
    case 'sidebar-menu':
      return (
        <SidebarMenuButton
          className={cn('text-gray-11 gap-2', className)}
          {...control}
        >
          {locked ? (
            <LockedGem className="size-4 text-accent-11" />
          ) : (
            <Plus className="size-4" />
          )}
          <span>{t('Add team project')}</span>
        </SidebarMenuButton>
      );
  }
}

type CreateProjectButtonVariant = 'icon' | 'full' | 'sidebar-menu';

type TriggerForParams = {
  variant: CreateProjectButtonVariant;
  className?: string;
  crown: React.ReactNode;
  locked: boolean;
  onClick?: () => void;
};

type CreateProjectButtonProps = {
  variant: CreateProjectButtonVariant;
  projects: Pick<ProjectWithLimits, 'type'>[];
  onCreate?: (project: ProjectWithLimits) => void;
  className?: string;
};
