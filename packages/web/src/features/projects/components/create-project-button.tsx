import { ProjectWithLimits } from '@activepieces/shared';
import { t } from 'i18next';
import { Plus } from 'lucide-react';

import { AnimatedIconButton } from '@/components/custom/animated-icon-button';
import { PlusIcon } from '@/components/icons/plus';
import { Button } from '@/components/ui/button';
import { SidebarMenuButton } from '@/components/ui/sidebar-shadcn';
import { useTeamProjectLimitGuard } from '@/features/billing';

import { NewProjectDialog } from './new-project-dialog';

export function CreateProjectButton({
  variant,
  projects,
  onCreate,
}: CreateProjectButtonProps) {
  const {
    hasReachedLimit,
    ensureTeamProjectAvailable,
    teamProjectLimitDialog,
  } = useTeamProjectLimitGuard({ projects });

  const trigger = triggerFor({
    variant,
    onClick: hasReachedLimit ? () => ensureTeamProjectAvailable() : undefined,
  });

  return (
    <>
      {hasReachedLimit ? (
        trigger
      ) : (
        <NewProjectDialog onCreate={onCreate}>{trigger}</NewProjectDialog>
      )}
      {teamProjectLimitDialog}
    </>
  );
}

function triggerFor({ variant, onClick }: TriggerForParams) {
  switch (variant) {
    case 'icon':
      return (
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 hover:bg-accent"
          onClick={onClick}
        >
          <Plus />
        </Button>
      );
    case 'full':
      return (
        <AnimatedIconButton
          icon={PlusIcon}
          iconSize={16}
          size="sm"
          onClick={onClick}
        >
          {t('New Project')}
        </AnimatedIconButton>
      );
    case 'sidebar-menu':
      return (
        <SidebarMenuButton
          className="text-muted-foreground gap-2"
          onClick={onClick}
        >
          <Plus className="size-4" />
          <span>{t('Add team project')}</span>
        </SidebarMenuButton>
      );
  }
}

type CreateProjectButtonVariant = 'icon' | 'full' | 'sidebar-menu';

type TriggerForParams = {
  variant: CreateProjectButtonVariant;
  onClick?: () => void;
};

type CreateProjectButtonProps = {
  variant: CreateProjectButtonVariant;
  projects: Pick<ProjectWithLimits, 'type'>[];
  onCreate?: (project: ProjectWithLimits) => void;
};
