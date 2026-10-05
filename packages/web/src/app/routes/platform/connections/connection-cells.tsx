import {
  AppConnectionScope,
  AppConnectionStatus,
  PlatformAppConnectionOwner,
  PlatformAppConnectionsListItem,
} from '@activepieces/shared';
import { t } from 'i18next';
import React from 'react';
import { Link } from 'react-router-dom';

import { DefaultTag } from '@/components/custom/global-connection-utils';
import { MutedCell, NameCell } from '@/components/custom/list/list-cells';
import { StatusDot } from '@/components/custom/status-dot';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { PieceIcon } from '@/features/pieces/components/piece-icon';
import { piecesHooks } from '@/features/pieces/hooks/pieces-hooks';
import { getProjectName } from '@/features/projects';
import { projectConnectionsPath } from '@/lib/route-utils';

export function ConnectionNameCell({
  pieceName,
  displayName,
}: {
  pieceName: string;
  displayName: string;
}) {
  const { summary } = piecesHooks.usePieceSummary({ name: pieceName });
  return (
    <NameCell
      media={
        <PieceIcon
          size="xs"
          border={true}
          displayName={summary?.displayName}
          logoUrl={summary?.logoUrl}
          showTooltip={false}
        />
      }
      title={displayName}
    />
  );
}

export function ConnectionStatus({ status }: { status: AppConnectionStatus }) {
  return (
    <StatusDot tone={CONNECTION_STATUS_TONE[status]}>
      {connectionStatusLabel(status)}
    </StatusDot>
  );
}

export function WhereCell({
  connection,
}: {
  connection: PlatformAppConnectionsListItem;
}) {
  const { projects } = connection;
  if (connection.scope !== AppConnectionScope.PLATFORM) {
    const project = projects[0];
    if (!project) {
      return <MutedCell>{null}</MutedCell>;
    }
    return (
      <Link
        to={projectConnectionsPath(project.id)}
        onClick={(event) => event.stopPropagation()}
        className="block w-fit max-w-full truncate text-gray-12 hover:underline"
      >
        {getProjectName(project)}
      </Link>
    );
  }
  return (
    <span className="flex min-w-0 items-center gap-2">
      <NameList names={projects.map((project) => getProjectName(project))}>
        <span className="min-w-0 truncate text-gray-11">
          {[
            t('Global'),
            t(
              '{count, plural, =0 {no projects} =1 {1 project} other {# projects}}',
              { count: projects.length },
            ),
          ].join(' · ')}
        </span>
      </NameList>
      {connection.preSelectForNewProjects && <DefaultTag />}
    </span>
  );
}

export function UsedByCell({
  connection,
}: {
  connection: PlatformAppConnectionsListItem;
}) {
  if (connection.flowCount === 0) {
    return <MutedCell>{t('Unused')}</MutedCell>;
  }
  return (
    <NameList
      names={connection.flows.map((flow) => flow.displayName)}
      total={connection.flowCount}
    >
      <span className="block w-fit max-w-full truncate">
        {t('{count, plural, =1 {1 flow} other {# flows}}', {
          count: connection.flowCount,
        })}
      </span>
    </NameList>
  );
}

function NameList({
  names,
  total = names.length,
  children,
}: {
  names: string[];
  total?: number;
  children: React.ReactElement;
}) {
  if (names.length === 0) {
    return children;
  }
  const shown = names.slice(0, MAX_NAMES_SHOWN);
  const hidden = total - shown.length;
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
          {hidden > 0 && (
            <li className="opacity-70">
              {t('and {count} more', { count: hidden })}
            </li>
          )}
        </ul>
      </TooltipContent>
    </Tooltip>
  );
}

export function ownerLabel({
  owner,
}: {
  owner:
    | Pick<PlatformAppConnectionOwner, 'firstName' | 'lastName' | 'email'>
    | null
    | undefined;
}): string {
  if (!owner) {
    return t('Platform');
  }
  const fullName = [owner.firstName, owner.lastName].filter(Boolean).join(' ');
  return fullName || owner.email;
}

export function connectionStatusLabel(status: AppConnectionStatus): string {
  switch (status) {
    case AppConnectionStatus.ACTIVE:
      return t('Active');
    case AppConnectionStatus.MISSING:
      return t('Missing');
    case AppConnectionStatus.ERROR:
      return t('Error');
  }
}

const CONNECTION_STATUS_TONE: Record<
  AppConnectionStatus,
  'success' | 'warning' | 'danger'
> = {
  [AppConnectionStatus.ACTIVE]: 'success',
  [AppConnectionStatus.MISSING]: 'warning',
  [AppConnectionStatus.ERROR]: 'danger',
};

const MAX_NAMES_SHOWN = 10;
