import {
  AppConnectionScope,
  PlatformAppConnectionsListItem,
} from '@activepieces/shared';
import { t } from 'i18next';
import { Globe } from 'lucide-react';
import { Link } from 'react-router-dom';

import { DefaultTag } from '@/components/custom/global-connection-utils';
import { TextWithTooltip } from '@/components/custom/text-with-tooltip';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { getProjectName } from '@/features/projects';
import { projectConnectionsPath } from '@/lib/route-utils';

export const ProjectCell = ({
  connection,
}: {
  connection: PlatformAppConnectionsListItem;
}) => {
  if (connection.scope === AppConnectionScope.PLATFORM) {
    return (
      <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
        <Badge variant="accent" className="bg-gray-5">
          <Globe />
          {t('Global')}
        </Badge>
        {connection.projects.length === 0 ? (
          <span className="shrink-0 text-gray-11">{t('No projects')}</span>
        ) : (
          <NameListTooltip
            names={connection.projects.map((project) =>
              getProjectName(project),
            )}
          >
            <span
              tabIndex={0}
              className="shrink-0 cursor-default text-gray-11 underline decoration-dashed underline-offset-2"
            >
              {t('{count, plural, =1 {1 project} other {# projects}}', {
                count: connection.projects.length,
              })}
            </span>
          </NameListTooltip>
        )}
        {connection.preSelectForNewProjects && <DefaultTag />}
      </div>
    );
  }
  const project = connection.projects[0];
  if (!project) {
    return <span className="text-gray-11">{t('N/A')}</span>;
  }
  const name = getProjectName(project);
  return (
    <Link to={projectConnectionsPath(project.id)} className="min-w-0">
      <TextWithTooltip tooltipMessage={name}>
        <span className="block truncate text-accent-11 hover:underline">
          {name}
        </span>
      </TextWithTooltip>
    </Link>
  );
};

export const OwnerCell = ({
  owner,
}: {
  owner: PlatformAppConnectionsListItem['owner'];
}) => {
  if (!owner) {
    return <span className="text-gray-11">{t('N/A')}</span>;
  }
  const fullName = [owner.firstName, owner.lastName].filter(Boolean).join(' ');
  return (
    <TextWithTooltip tooltipMessage={owner.email}>
      <span className="block truncate">{fullName || owner.email}</span>
    </TextWithTooltip>
  );
};

export const UsedByCell = ({
  flows,
  flowCount,
}: Pick<PlatformAppConnectionsListItem, 'flows' | 'flowCount'>) => {
  if (flowCount === 0) {
    return <span className="text-gray-11">{t('Unused')}</span>;
  }
  return (
    <NameListTooltip
      names={flows.map((flow) => flow.displayName)}
      total={flowCount}
    >
      <span
        tabIndex={0}
        className="cursor-default underline decoration-dashed underline-offset-2"
      >
        {t('{count, plural, =1 {1 flow} other {# flows}}', {
          count: flowCount,
        })}
      </span>
    </NameListTooltip>
  );
};

const NameListTooltip = ({
  names,
  total = names.length,
  children,
}: {
  names: string[];
  total?: number;
  children: React.ReactNode;
}) => {
  if (names.length === 0) {
    return children;
  }
  const shown = names.slice(0, MAX_NAMES_IN_TOOLTIP);
  const hidden = total - shown.length;
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent>
        <ul className="flex max-w-[260px] flex-col gap-1">
          {shown.map((name, index) => (
            <li key={`${name}-${index}`} className="truncate">
              {name}
            </li>
          ))}
          {hidden > 0 && (
            <li className="text-gray-11">
              {t('and {count} more', { count: hidden })}
            </li>
          )}
        </ul>
      </TooltipContent>
    </Tooltip>
  );
};

const MAX_NAMES_IN_TOOLTIP = 10;
