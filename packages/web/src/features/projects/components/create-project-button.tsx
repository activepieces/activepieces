import { ProjectWithLimits } from '@activepieces/shared';
import { t } from 'i18next';
import { Plus } from 'lucide-react';

import { AnimatedIconButton } from '@/components/custom/animated-icon-button';
import { PlusIcon } from '@/components/icons/plus';
import { Button } from '@/components/ui/button';
import { SidebarMenuButton } from '@/components/ui/sidebar-shadcn';
import { useTeamProjectLimitGuard } from '@/features/billing';

import { NewProjectDialog } from './new-project-dialog';

function IconVariant({
  atLimit,
  onLimitReached,
  onCreate,
}: {
  atLimit: boolean;
  onLimitReached: () => void;
  onCreate?: (project: ProjectWithLimits) => void;
}) {
  const button = (
    <Button
      variant="ghost"
      size="icon"
      className="h-6 w-6 hover:bg-accent"
      onClick={atLimit ? onLimitReached : undefined}
    >
      <Plus />
    </Button>
  );
  if (atLimit) {
    return button;
  }
  return <NewProjectDialog onCreate={onCreate}>{button}</NewProjectDialog>;
}

function FullVariant({
  atLimit,
  onLimitReached,
}: {
  atLimit: boolean;
  onLimitReached: () => void;
}) {
  const button = (
    <AnimatedIconButton
      icon={PlusIcon}
      iconSize={16}
      size="sm"
      onClick={atLimit ? onLimitReached : undefined}
    >
      {t('New Project')}
    </AnimatedIconButton>
  );
  if (atLimit) {
    return button;
  }
  return <NewProjectDialog>{button}</NewProjectDialog>;
}

function SidebarMenuVariant({
  atLimit,
  onLimitReached,
  onCreate,
}: {
  atLimit: boolean;
  onLimitReached: () => void;
  onCreate?: (project: ProjectWithLimits) => void;
}) {
  const button = (
    <SidebarMenuButton
      className="text-muted-foreground gap-2"
      onClick={atLimit ? onLimitReached : undefined}
    >
      <Plus className="size-4" />
      <span>{t('Add team project')}</span>
    </SidebarMenuButton>
  );
  if (atLimit) {
    return button;
  }
  return <NewProjectDialog onCreate={onCreate}>{button}</NewProjectDialog>;
}

export function CreateProjectButton({
  variant,
  projects,
  onCreate,
}: {
  variant: 'icon' | 'full' | 'sidebar-menu';
  projects: Pick<ProjectWithLimits, 'type'>[];
  onCreate?: (project: ProjectWithLimits) => void;
}) {
  const {
    hasReachedLimit,
    ensureTeamProjectAvailable,
    teamProjectLimitDialog,
  } = useTeamProjectLimitGuard({ projects });

  const onLimitReached = () => {
    ensureTeamProjectAvailable();
  };

  return (
    <>
      {variant === 'icon' && (
        <IconVariant
          atLimit={hasReachedLimit}
          onLimitReached={onLimitReached}
          onCreate={onCreate}
        />
      )}
      {variant === 'sidebar-menu' && (
        <SidebarMenuVariant
          atLimit={hasReachedLimit}
          onLimitReached={onLimitReached}
          onCreate={onCreate}
        />
      )}
      {variant === 'full' && (
        <FullVariant
          atLimit={hasReachedLimit}
          onLimitReached={onLimitReached}
        />
      )}
      {teamProjectLimitDialog}
    </>
  );
}
