import { ProjectType } from '@activepieces/shared';
import { t } from 'i18next';

import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { projectCollectionUtils } from '@/features/projects/stores/project-collection';
import { platformHooks } from '@/hooks/platform-hooks';

export function InvitedProjectSelect({
  value,
  onValueChange,
  allowNone,
}: InvitedProjectSelectProps) {
  const { activeDefaultProjectIds } = platformHooks.useNewMemberSettings();
  const { data: teamProjects } = projectCollectionUtils.useAllPlatformProjects({
    type: [ProjectType.TEAM],
  });
  const sortedProjects = [...teamProjects].sort((left, right) =>
    left.displayName.localeCompare(right.displayName),
  );

  return (
    <Select
      value={value ?? (allowNone ? NO_PROJECT : undefined)}
      onValueChange={(selected) =>
        onValueChange(selected === NO_PROJECT ? undefined : selected)
      }
    >
      <SelectTrigger aria-label={t('Project')}>
        <SelectValue placeholder={t('Select a project')} />
      </SelectTrigger>
      <SelectContent>
        {allowNone && (
          <SelectItem value={NO_PROJECT}>{t('No project')}</SelectItem>
        )}
        {sortedProjects.map((project) => (
          <SelectItem key={project.id} value={project.id}>
            <span className="flex min-w-0 items-center gap-2">
              <span className="truncate">{project.displayName}</span>
              {activeDefaultProjectIds.includes(project.id) && (
                <Badge
                  variant="accent"
                  className="h-4 shrink-0 px-1.5 py-0 text-xss leading-none"
                >
                  {t('Default')}
                </Badge>
              )}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

const NO_PROJECT = 'no-project';

type InvitedProjectSelectProps = {
  value: string | undefined;
  onValueChange: (projectId: string | undefined) => void;
  allowNone?: boolean;
};
