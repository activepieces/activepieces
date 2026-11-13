import { ProjectWithLimits } from '@activepieces/shared';
import { t } from 'i18next';

import { CreateProjectButton } from '@/features/projects';

export function NoTeamProjectsState({ onCreate }: NoTeamProjectsStateProps) {
  return (
    <div className="flex flex-col items-start gap-3 rounded-lg border p-3">
      <p className="text-sm text-gray-11">
        {t(
          'Personal projects are off, so they need a project to start in. Create a project first.',
        )}
      </p>
      <CreateProjectButton
        variant="full"
        projects={NO_TEAM_PROJECTS}
        onCreate={onCreate}
      />
    </div>
  );
}

const NO_TEAM_PROJECTS: Pick<ProjectWithLimits, 'type'>[] = [];

type NoTeamProjectsStateProps = {
  onCreate: (project: ProjectWithLimits) => void;
};
