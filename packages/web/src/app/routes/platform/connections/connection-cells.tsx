import {
  AppConnectionScope,
  AppConnectionStatus,
  PlatformAppConnectionOwner,
  PlatformAppConnectionsListItem,
} from '@activepieces/shared';
import { t } from 'i18next';

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
      sub={summary?.displayName}
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

export function UsedInCell({
  connection,
}: {
  connection: PlatformAppConnectionsListItem;
}) {
  const { projects } = connection;
  if (connection.scope !== AppConnectionScope.PLATFORM) {
    return (
      <MutedCell>
        {projects.length > 0 ? getProjectName(projects[0]) : null}
      </MutedCell>
    );
  }
  const label = [
    t('Global'),
    t('{count, plural, =0 {no projects} =1 {1 project} other {# projects}}', {
      count: projects.length,
    }),
  ].join(' · ');
  if (projects.length === 0) {
    return <MutedCell>{label}</MutedCell>;
  }
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="block w-fit max-w-full cursor-default truncate text-gray-11">
          {label}
        </span>
      </TooltipTrigger>
      <TooltipContent>
        <ul className="flex max-w-64 flex-col gap-1">
          {projects.map((project) => (
            <li key={project.id} className="truncate">
              {getProjectName(project)}
            </li>
          ))}
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
