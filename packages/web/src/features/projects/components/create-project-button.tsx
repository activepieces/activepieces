import { ProjectWithLimits, TelemetryEventName } from '@activepieces/shared';
import { t } from 'i18next';
import { Crown, Plus } from 'lucide-react';
import React from 'react';

import { AnimatedIconButton } from '@/components/custom/animated-icon-button';
import { PlusIcon } from '@/components/icons/plus';
import { useTelemetry } from '@/components/providers/telemetry-provider';
import { Button } from '@/components/ui/button';
import { SidebarMenuButton } from '@/components/ui/sidebar-shadcn';
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
          {locked ? <Crown className="text-accent-11" /> : <Plus />}
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
