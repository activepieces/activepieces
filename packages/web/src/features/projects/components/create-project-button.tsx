import { ProjectWithLimits } from '@activepieces/shared';
import { Add01Icon, CrownIcon } from '@hugeicons/core-free-icons';
import { t } from 'i18next';
import React from 'react';

import { HugeiconsIcon } from '@/components/custom/hugeicons-icon';
import { IconButton } from '@/components/custom/icon-button';
import { Button } from '@/components/ui/button';
import { SidebarMenuButton } from '@/components/ui/sidebar-shadcn';
import {
  PLATFORM_FEATURES,
  useFeatureGate,
  useTeamProjectLimitGuard,
} from '@/features/billing';
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

  const trigger = triggerFor({
    variant,
    className,
    crown: projectsGate.crown,
    locked: projectsGate.locked,
  });

  return (
    <NewProjectDialog
      onCreate={onCreate}
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
  switch (variant) {
    case 'icon':
      return (
        <Button
          variant="ghost"
          size="icon"
          className={cn('h-6 w-6 hover:bg-gray-4', className)}
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
        <Button size="sm" className={className}>
          {crown}
          {t('New Project')}
        </Button>
      ) : (
        <IconButton icon={Add01Icon} size="sm" className={className}>
          {t('New Project')}
        </IconButton>
      );
    case 'sidebar-menu':
      return (
        <SidebarMenuButton className={cn('text-gray-11 gap-2', className)}>
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
