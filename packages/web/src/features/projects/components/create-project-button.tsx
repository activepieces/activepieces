import { ProjectWithLimits, TelemetryEventName } from '@activepieces/shared';
import { Add01Icon, CrownIcon } from '@hugeicons/core-free-icons';
import { t } from 'i18next';
import React from 'react';

import { HugeiconsIcon } from '@/components/custom/hugeicons-icon';
import { IconButton } from '@/components/custom/icon-button';
import { useTelemetry } from '@/components/providers/telemetry-provider';
import { Button } from '@/components/ui/button';
import { SidebarMenuButton } from '@/components/ui/sidebar';
import {
  PLATFORM_FEATURES,
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
  const { hasReachedLimit, teamProjectLimitContent } = useTeamProjectLimitGuard(
    { projects },
  );
  const projectsGate = useFeatureGate({
    locked: hasReachedLimit,
    feature: PLATFORM_FEATURES.projects,
  });
  const { capture } = useTelemetry();

  const trigger = triggerFor({
    variant,
    className,
    crown: projectsGate.crown,
    locked: projectsGate.locked,
  });

  return (
    <NewProjectDialog
      onCreate={onCreate}
      onBlocked={() =>
        capture({
          name: TelemetryEventName.PLATFORM_ADMIN_GATE_BLOCKED,
          payload: {
            feature: PLATFORM_FEATURES.projects.featureKey,
            control: AdminControl.PROJECTS_NEW_OPEN,
          },
        })
      }
      gate={{
        locked: hasReachedLimit,
        content: teamProjectLimitContent,
      }}
    >
      {trigger}
    </NewProjectDialog>
  );
}

function triggerFor({ variant, className, crown, locked }: TriggerForParams) {
  const control = adminControl(
    locked ? undefined : AdminControl.PROJECTS_NEW_OPEN,
  );
  switch (variant) {
    case 'icon':
      return (
        <Button
          variant="ghost"
          size="icon"
          className={cn('h-6 w-6 hover:bg-gray-4', className)}
          {...control}
        >
          {locked ? (
            <HugeiconsIcon icon={CrownIcon} className="text-accent-11" />
          ) : (
            <HugeiconsIcon icon={Add01Icon} />
          )}
        </Button>
      );
    case 'full':
      return crown ? (
        <Button className={className} {...control}>
          {crown}
          {t('New project')}
        </Button>
      ) : (
        <IconButton icon={Add01Icon} className={className} {...control}>
          {t('New project')}
        </IconButton>
      );
    case 'sidebar-menu':
      return (
        <SidebarMenuButton
          className={cn('text-gray-11 gap-2', className)}
          {...control}
        >
          {locked ? (
            <HugeiconsIcon icon={CrownIcon} className="size-4 text-accent-11" />
          ) : (
            <HugeiconsIcon icon={Add01Icon} className="size-4" />
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
};

type CreateProjectButtonProps = {
  variant: CreateProjectButtonVariant;
  projects: Pick<ProjectWithLimits, 'type'>[];
  onCreate?: (project: ProjectWithLimits) => void;
  className?: string;
};
