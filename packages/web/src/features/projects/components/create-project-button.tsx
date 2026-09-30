import { ProjectWithLimits } from '@activepieces/shared';
import { t } from 'i18next';
import { Crown, Plus } from 'lucide-react';
import React from 'react';

import { AnimatedIconButton } from '@/components/custom/animated-icon-button';
import { PlusIcon } from '@/components/icons/plus';
import { Button } from '@/components/ui/button';
import { SidebarMenuButton } from '@/components/ui/sidebar';
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
        <Button variant="ghost" size="icon-xs" className={className}>
          {locked ? <Crown className="text-accent-11" /> : <Plus />}
        </Button>
      );
    case 'full':
      return crown ? (
        <Button className={className}>
          {crown}
          {t('New Project')}
        </Button>
      ) : (
        <AnimatedIconButton icon={PlusIcon} iconSize={20} className={className}>
          {t('New Project')}
        </AnimatedIconButton>
      );
    case 'sidebar-menu':
      return (
        <SidebarMenuButton className={cn('text-gray-11 gap-2', className)}>
          {locked ? (
            <Crown className="size-4 text-accent-11" />
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
};

type CreateProjectButtonProps = {
  variant: CreateProjectButtonVariant;
  projects: Pick<ProjectWithLimits, 'type'>[];
  onCreate?: (project: ProjectWithLimits) => void;
  className?: string;
};
