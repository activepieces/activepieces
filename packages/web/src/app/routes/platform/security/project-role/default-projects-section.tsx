import { ErrorCode } from '@activepieces/core-utils';
import { ProjectType } from '@activepieces/shared';
import { t } from 'i18next';
import { Info, Lock, X } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { AnimatedIconButton } from '@/components/custom/animated-icon-button';
import { ConfirmationDeleteDialog } from '@/components/custom/delete-dialog';
import { TextWithTooltip } from '@/components/custom/text-with-tooltip';
import { PlusIcon } from '@/components/icons/plus';
import { Button } from '@/components/ui/button';
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemTitle,
} from '@/components/ui/item';
import { internalErrorToast } from '@/components/ui/sonner';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { PLATFORM_FEATURES, useFeatureGate } from '@/features/billing';
import { newMemberSettingsMutations } from '@/features/platform-admin';
import { projectCollectionUtils } from '@/features/projects/stores/project-collection';
import { platformHooks } from '@/hooks/platform-hooks';
import { api } from '@/lib/api';

import { sampleData } from '../../sample-data';

import { AddDefaultProjectsDialog } from './add-default-projects-dialog';

export function DefaultProjectsSection() {
  const { platform, refetch: refetchPlatform } =
    platformHooks.useCurrentPlatform();
  const { personalProjectsActive } = platformHooks.useNewMemberSettings();
  const { data: teamProjects } = projectCollectionUtils.useAllPlatformProjects({
    type: [ProjectType.TEAM],
  });
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [showsAll, setShowsAll] = useState(false);
  const gate = useFeatureGate({
    locked: !platform.plan.projectRolesEnabled,
    feature: PLATFORM_FEATURES.projectRoles,
  });

  const { mutateAsync: updateSettingsAsync, isPending } =
    newMemberSettingsMutations.useUpdateNewMemberSettings();

  const saveDefaultProjects = async (defaultProjectIds: string[]) => {
    await updateSettingsAsync({ defaultProjectIds });
    setIsDialogOpen(false);
  };

  const defaultProjects: DefaultProject[] = gate.locked
    ? sampleData.defaultProjects()
    : teamProjects
        .filter((project) => platform.defaultProjectIds.includes(project.id))
        .map((project) => ({
          id: project.id,
          displayName: project.displayName,
          memberCount: project.analytics.totalUsers,
        }));
  const visibleProjects = showsAll
    ? defaultProjects
    : defaultProjects.slice(0, VISIBLE_PROJECT_LIMIT);
  const hiddenCount = defaultProjects.length - visibleProjects.length;
  const isLastRequiredProject =
    !personalProjectsActive && defaultProjects.length === 1;

  const openDialog = () => {
    if (gate.locked) {
      gate.open();
      return;
    }
    setIsDialogOpen(true);
  };

  const removeDefaultProject = async (projectId: string) => {
    await updateSettingsAsync({
      defaultProjectIds: platform.defaultProjectIds.filter(
        (id) => id !== projectId,
      ),
    });
  };

  const handleRemoveError = (error: Error) => {
    if (api.isApError(error, ErrorCode.DEFAULT_PROJECT_REQUIRED)) {
      toast.error(
        t('Keep at least one default project while personal projects are off.'),
      );
      refetchPlatform().catch(() => undefined);
      return;
    }
    internalErrorToast();
  };

  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-end justify-between gap-4">
        <div className="flex min-w-0 flex-col gap-1">
          <h2 className="text-base font-medium">{t('Default projects')}</h2>
          <p className="max-w-2xl text-sm text-muted-foreground">
            {t('All new members join these as Editors.')}
          </p>
        </div>
        <AnimatedIconButton
          icon={PlusIcon}
          iconSize={16}
          size="sm"
          className="shrink-0"
          onClick={openDialog}
        >
          {gate.crown}
          {t('Add project')}
        </AnimatedIconButton>
      </div>
      {defaultProjects.length === 0 ? (
        <Item
          variant="outline"
          size="sm"
          className="bg-background dark:bg-muted/50"
        >
          <ItemContent>
            <ItemTitle>{t('No default projects yet')}</ItemTitle>
            <ItemDescription>
              {t('Add one and new members join it automatically.')}
            </ItemDescription>
          </ItemContent>
        </Item>
      ) : (
        <div className="flex flex-col gap-3">
          <ul className="divide-y rounded-lg border bg-background dark:bg-muted/50">
            {visibleProjects.map((project) => (
              <li
                key={project.id}
                className="flex h-11 items-center gap-3 pl-4 pr-2 text-sm"
              >
                <TextWithTooltip tooltipMessage={project.displayName}>
                  <span className="min-w-0 flex-1 leading-snug font-medium">
                    {project.displayName}
                  </span>
                </TextWithTooltip>
                <span className="ml-auto shrink-0 tabular-nums text-muted-foreground">
                  {t('projectMemberCount', { count: project.memberCount })}
                </span>
                <span className="flex w-8 shrink-0 justify-center">
                  {isLastRequiredProject ? (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div
                          tabIndex={0}
                          aria-label={t(
                            "Can't be removed while personal projects are off.",
                          )}
                          className="flex size-8 items-center justify-center text-muted-foreground"
                        >
                          <Lock className="size-4" />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="top">
                        {t('Required')}
                      </TooltipContent>
                    </Tooltip>
                  ) : gate.locked ? (
                    removeIconButton({
                      projectName: project.displayName,
                      onClick: gate.open,
                    })
                  ) : (
                    <RemoveDefaultProjectButton
                      projectName={project.displayName}
                      onRemove={() => removeDefaultProject(project.id)}
                      onError={handleRemoveError}
                    />
                  )}
                </span>
              </li>
            ))}
          </ul>
          {hiddenCount > 0 && (
            <Button
              variant="link"
              size="sm"
              className="w-fit"
              onClick={() => setShowsAll(true)}
            >
              {t('showAllDefaultProjects', { count: defaultProjects.length })}
            </Button>
          )}
          {isLastRequiredProject && (
            <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
              <Info className="mt-px size-3.5 shrink-0" />
              {t(
                'Keep at least one default project while personal projects are off.',
              )}
            </p>
          )}
        </div>
      )}
      <AddDefaultProjectsDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        teamProjects={teamProjects}
        defaultProjectIds={platform.defaultProjectIds}
        isSaving={isPending}
        requiresAProject={!personalProjectsActive}
        onSave={saveDefaultProjects}
      />
      {gate.dialog}
    </section>
  );
}

function RemoveDefaultProjectButton({
  projectName,
  onRemove,
  onError,
}: RemoveDefaultProjectButtonProps) {
  return (
    <ConfirmationDeleteDialog
      title={t('Remove {project} from default projects?', {
        project: projectName,
      })}
      message={t(
        "New members won't join {project} anymore. Current members keep their access.",
        { project: projectName },
      )}
      entityName={projectName}
      buttonText={t('Remove')}
      mutationFn={onRemove}
      onError={onError}
    >
      {removeIconButton({ projectName })}
    </ConfirmationDeleteDialog>
  );
}

function removeIconButton({ projectName, onClick }: RemoveIconButtonParams) {
  return (
    <Button
      variant="ghost"
      size="icon-sm"
      className="text-muted-foreground"
      aria-label={t('Remove {project}', { project: projectName })}
      onClick={onClick}
    >
      <X className="size-4" />
    </Button>
  );
}

const VISIBLE_PROJECT_LIMIT = 5;

type RemoveIconButtonParams = {
  projectName: string;
  onClick?: () => void;
};

type RemoveDefaultProjectButtonProps = {
  projectName: string;
  onRemove: () => Promise<void>;
  onError: (error: Error) => void;
};

type DefaultProject = {
  id: string;
  displayName: string;
  memberCount: number;
};
