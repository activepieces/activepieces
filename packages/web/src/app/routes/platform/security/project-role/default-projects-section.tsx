import { ProjectType } from '@activepieces/shared';
import { t } from 'i18next';
import { X } from 'lucide-react';
import { useState } from 'react';

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
import { PLATFORM_FEATURES, useFeatureGate } from '@/features/billing';
import { newMemberSettingsMutations } from '@/features/platform-admin';
import { projectCollectionUtils } from '@/features/projects/stores/project-collection';
import { platformHooks } from '@/hooks/platform-hooks';

import { sampleData } from '../../sample-data';

import { AddDefaultProjectsDialog } from './add-default-projects-dialog';

export function DefaultProjectsSection() {
  const { platform } = platformHooks.useCurrentPlatform();
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

  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-end justify-between gap-4">
        <div className="flex min-w-0 flex-col gap-1">
          <h2 className="text-base font-medium">{t('Default projects')}</h2>
          <p className="max-w-2xl text-sm text-gray-11">
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
        <Item variant="outline" size="sm" className="bg-panel">
          <ItemContent>
            <ItemTitle>{t('No default projects yet')}</ItemTitle>
            <ItemDescription>
              {t('Add one and new members join it automatically.')}
            </ItemDescription>
          </ItemContent>
        </Item>
      ) : (
        <div className="flex flex-col gap-3">
          <ul className="divide-y rounded-lg border bg-panel">
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
                <span className="ml-auto shrink-0 tabular-nums text-gray-11">
                  {t('projectMemberCount', { count: project.memberCount })}
                </span>
                <span className="flex w-8 shrink-0 justify-center">
                  {gate.locked ? (
                    removeIconButton({
                      projectName: project.displayName,
                      onClick: gate.open,
                    })
                  ) : (
                    <RemoveDefaultProjectButton
                      projectName={project.displayName}
                      onRemove={() => removeDefaultProject(project.id)}
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
        </div>
      )}
      <AddDefaultProjectsDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        teamProjects={teamProjects}
        defaultProjectIds={platform.defaultProjectIds}
        isSaving={isPending}
        onSave={saveDefaultProjects}
      />
      {gate.dialog}
    </section>
  );
}

function RemoveDefaultProjectButton({
  projectName,
  onRemove,
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
      onError={() => internalErrorToast()}
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
      className="text-gray-11"
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
};

type DefaultProject = {
  id: string;
  displayName: string;
  memberCount: number;
};
