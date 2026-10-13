import {
  AppConnectionScope,
  AppConnectionStatus,
  PlatformAppConnectionOwner,
  PlatformAppConnectionsListItem,
} from '@activepieces/shared';
import { t } from 'i18next';
import { Globe } from 'lucide-react';
import { Link } from 'react-router-dom';

import { StatusDot, StatusTone } from '@/app/components/admin';
import { CopyTextTooltip } from '@/components/custom/clipboard/copy-text-tooltip';
import { DefaultTag } from '@/components/custom/global-connection-utils';
import { TextWithTooltip } from '@/components/custom/text-with-tooltip';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { PieceIconWithPieceName } from '@/features/pieces';
import { getProjectName } from '@/features/projects';
import { AdminControl } from '@/lib/admin-control';

export const ConnectionNameCell = ({
  connection,
}: {
  connection: PlatformAppConnectionsListItem;
}) => (
  <CopyTextTooltip
    title={t('External ID')}
    text={connection.externalId || ''}
    controlId={AdminControl.CONNECTIONS_EXTERNAL_ID_COPY}
  >
    <div className="flex w-fit min-w-0 items-center gap-2">
      <PieceIconWithPieceName
        pieceName={connection.pieceName}
        showTooltip={false}
        size="sm"
      />
      <TextWithTooltip tooltipMessage={connection.displayName}>
        <span className="max-w-40 truncate 2xl:max-w-64">
          {connection.displayName}
        </span>
      </TextWithTooltip>
    </div>
  </CopyTextTooltip>
);

export const ConnectionStatus = ({
  status,
}: {
  status: AppConnectionStatus;
}) => (
  <StatusDot tone={CONNECTION_STATUS_TONE[status]}>
    {connectionCellsUtils.statusLabel(status)}
  </StatusDot>
);

export const WhereCell = ({
  connection,
}: {
  connection: PlatformAppConnectionsListItem;
}) => {
  const { projects } = connection;
  if (connection.scope !== AppConnectionScope.PLATFORM) {
    const project = projects[0];
    if (!project) {
      return <span className="text-gray-11">—</span>;
    }
    const name = getProjectName(project);
    return (
      <Link
        to={connectionCellsUtils.projectConnectionsPath(project.id)}
        onClick={(event) => event.stopPropagation()}
        className="block w-fit max-w-full min-w-0"
      >
        <TextWithTooltip tooltipMessage={name}>
          <span className="block max-w-48 truncate text-gray-12 hover:underline">
            {name}
          </span>
        </TextWithTooltip>
      </Link>
    );
  }
  return (
    <span className="flex min-w-0 items-center gap-2">
      <ProjectNames names={projects.map((project) => getProjectName(project))}>
        <span className="flex min-w-0 items-center gap-1.5 text-gray-11">
          <Globe className="size-3.5 shrink-0" />
          <span className="truncate">
            {t(
              '{count, plural, =0 {Global · no projects} =1 {Global · 1 project} other {Global · # projects}}',
              { count: projects.length },
            )}
          </span>
        </span>
      </ProjectNames>
      {connection.preSelectForNewProjects && <DefaultTag />}
    </span>
  );
};

export const OwnerCell = ({
  owner,
}: {
  owner: PlatformAppConnectionsListItem['owner'];
}) => {
  if (!owner) {
    return <span className="text-gray-11">{t('Platform')}</span>;
  }
  return (
    <TextWithTooltip tooltipMessage={owner.email}>
      <span className="block max-w-44 truncate">
        {connectionCellsUtils.ownerLabel(owner)}
      </span>
    </TextWithTooltip>
  );
};

export const ProjectNames = ({
  names,
  children,
}: {
  names: string[];
  children: React.ReactElement;
}) => {
  if (names.length === 0) {
    return children;
  }
  const shown = names.slice(0, MAX_NAMES_SHOWN);
  const hidden = names.length - shown.length;
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent>
        <ul className="flex max-w-64 flex-col gap-1">
          {shown.map((name, index) => (
            <li key={`${name}-${index}`} className="truncate">
              {name}
            </li>
          ))}
          {hidden > 0 && <li>{t('+{count} more', { count: hidden })}</li>}
        </ul>
      </TooltipContent>
    </Tooltip>
  );
};

function ownerLabel(
  owner: Pick<PlatformAppConnectionOwner, 'firstName' | 'lastName' | 'email'>,
): string {
  const fullName = [owner.firstName, owner.lastName].filter(Boolean).join(' ');
  return fullName || owner.email;
}

function statusLabel(status: AppConnectionStatus): string {
  switch (status) {
    case AppConnectionStatus.ACTIVE:
      return t('Active');
    case AppConnectionStatus.MISSING:
      return t('Missing');
    case AppConnectionStatus.ERROR:
      return t('Error');
  }
}

function projectConnectionsPath(projectId: string): string {
  return `/projects/${projectId}/connections`;
}

export const connectionCellsUtils = {
  ownerLabel,
  statusLabel,
  projectConnectionsPath,
};

const CONNECTION_STATUS_TONE: Record<AppConnectionStatus, StatusTone> = {
  [AppConnectionStatus.ACTIVE]: 'success',
  [AppConnectionStatus.ERROR]: 'danger',
  [AppConnectionStatus.MISSING]: 'warning',
};

const MAX_NAMES_SHOWN = 10;
