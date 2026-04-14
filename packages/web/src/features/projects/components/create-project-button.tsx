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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { platformHooks } from '@/hooks/platform-hooks';

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

function FullVariant({ disabled }: { disabled: boolean }) {
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
    <NewProjectDialog>
      <AnimatedIconButton icon={PlusIcon} iconSize={16} size="sm">
        {t('New Project')}
      </AnimatedIconButton>
    </NewProjectDialog>
  );
}

export function CreateProjectButton({
  variant,
  projects,
  onCreate,
}: {
  variant: 'icon' | 'full';
  projects: Pick<ProjectWithLimits, 'type'>[];
  onCreate?: (project: ProjectWithLimits) => void;
}) {
  const disabled = useIsCreateProjectDisabled({ projects });
  if (variant === 'icon') {
    return <IconVariant disabled={disabled} onCreate={onCreate} />;
  }
  return <FullVariant disabled={disabled} />;
}
