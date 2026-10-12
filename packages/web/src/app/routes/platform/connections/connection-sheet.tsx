import {
  AppConnectionScope,
  PlatformAppConnectionsListItem,
} from '@activepieces/shared';
import { t } from 'i18next';
import { ArrowUpRight, Cable, Trash2 } from 'lucide-react';
import { ReactNode, useState } from 'react';
import { Link } from 'react-router-dom';

import { adminLayout } from '@/app/components/admin';
import { CopyTextTooltip } from '@/components/custom/clipboard/copy-text-tooltip';
import { FormattedDate } from '@/components/custom/formatted-date';
import { DefaultTag } from '@/components/custom/global-connection-utils';
import { TextWithTooltip } from '@/components/custom/text-with-tooltip';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { LockedGem } from '@/features/billing';
import { EditGlobalConnectionDialog } from '@/features/connections';
import { PieceIconWithPieceName, piecesHooks } from '@/features/pieces';
import { getProjectName } from '@/features/projects';
import { AdminControl, adminControl } from '@/lib/admin-control';
import { cn } from '@/lib/utils';

import {
  GlobalConnectionAccess,
  ReconnectConnectionDialog,
} from './connection-actions';
import {
  ConnectionStatus,
  OwnerCell,
  connectionCellsUtils,
} from './connection-cells';

export const ConnectionSheet = ({
  connection,
  access,
  onChanged,
  onDelete,
  onOpenChange,
}: ConnectionSheetProps) => (
  <Sheet open={connection !== null} onOpenChange={onOpenChange}>
    <SheetContent
      className={cn(adminLayout.sheet.sm, 'flex flex-col gap-0 p-0')}
      onOpenAutoFocus={(event) => event.preventDefault()}
    >
      {connection && (
        <ConnectionDetails
          key={connection.id}
          connection={connection}
          access={access}
          onChanged={onChanged}
          onDelete={() => onDelete(connection)}
        />
      )}
    </SheetContent>
  </Sheet>
);

const ConnectionDetails = ({
  connection,
  access,
  onChanged,
  onDelete,
}: ConnectionDetailsProps) => {
  const [reconnecting, setReconnecting] = useState(false);
  const { summary } = piecesHooks.usePieceSummary({
    name: connection.pieceName,
  });
  const isGlobal = connection.scope === AppConnectionScope.PLATFORM;
  const locked = isGlobal && access.locked;
  const project = isGlobal ? undefined : connection.projects[0];
  const guarded = (run: () => void) => (locked ? access.upgrade : run);

  return (
    <>
      <SheetHeader className="flex-row items-center gap-3 border-b px-6 py-4">
        <PieceIconWithPieceName
          pieceName={connection.pieceName}
          showTooltip={false}
          size="md"
        />
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <TextWithTooltip tooltipMessage={connection.displayName}>
            <SheetTitle className="truncate text-base">
              {connection.displayName}
            </SheetTitle>
          </TextWithTooltip>
          <SheetDescription className="truncate">
            {[
              summary?.displayName ?? connection.pieceName,
              isGlobal ? t('Global connection') : t('Project connection'),
            ].join(' · ')}
          </SheetDescription>
        </div>
      </SheetHeader>
      <dl className="flex flex-1 flex-col divide-y divide-gray-6 overflow-y-auto px-6">
        <Fact label={t('Status')}>
          <ConnectionStatus status={connection.status} />
        </Fact>
        <Fact label={isGlobal ? t('Shared with') : t('Project')}>
          {isGlobal ? (
            <span className="flex flex-wrap items-center justify-end gap-2">
              {connection.projects.length === 0
                ? t('No projects')
                : connection.projects
                    .map((sharedWith) => getProjectName(sharedWith))
                    .join(', ')}
              {connection.preSelectForNewProjects && <DefaultTag />}
              {!locked && (
                <EditGlobalConnectionDialog
                  connectionId={connection.id}
                  currentName={connection.displayName}
                  projectIds={connection.projectIds}
                  preSelectForNewProjects={
                    connection.preSelectForNewProjects ?? false
                  }
                  userHasPermissionToEdit
                  onEdit={onChanged}
                />
              )}
            </span>
          ) : project ? (
            <Link
              to={connectionCellsUtils.projectConnectionsPath(project.id)}
              className="hover:underline"
            >
              {getProjectName(project)}
            </Link>
          ) : (
            '—'
          )}
        </Fact>
        <Fact label={t('Owner')}>
          <OwnerCell owner={connection.owner} />
        </Fact>
        <Fact label={t('External ID')}>
          <CopyTextTooltip
            title={t('External ID')}
            text={connection.externalId}
            controlId={AdminControl.CONNECTIONS_EXTERNAL_ID_COPY}
          >
            <span className="block max-w-56 truncate font-mono text-xs">
              {connection.externalId}
            </span>
          </CopyTextTooltip>
        </Fact>
        <Fact label={t('Created')}>
          <FormattedDate date={new Date(connection.created)} />
        </Fact>
        <Fact label={t('Updated')}>
          <FormattedDate date={new Date(connection.updated)} />
        </Fact>
      </dl>
      <SheetFooter className="flex-row flex-wrap gap-2 border-t px-6 py-4 sm:justify-start">
        {isGlobal && (
          <Button
            {...adminControl(
              locked
                ? undefined
                : AdminControl.CONNECTIONS_CONNECTION_RECONNECT_OPEN,
            )}
            variant="outline"
            disabled={!locked && connection.projects.length === 0}
            onClick={guarded(() => setReconnecting(true))}
          >
            {locked ? <LockedGem className="text-accent-11" /> : <Cable />}
            {t('Reconnect')}
          </Button>
        )}
        {project && (
          <Button variant="outline" asChild>
            <Link to={connectionCellsUtils.projectConnectionsPath(project.id)}>
              <ArrowUpRight />
              {t('Open project')}
            </Link>
          </Button>
        )}
        {isGlobal && (
          <Button
            {...adminControl(
              locked
                ? undefined
                : AdminControl.CONNECTIONS_CONNECTION_DELETE_OPEN,
            )}
            variant={locked ? 'outline' : 'destructive'}
            className="sm:ml-auto"
            onClick={guarded(onDelete)}
          >
            {locked ? <LockedGem className="text-accent-11" /> : <Trash2 />}
            {t('Delete')}
          </Button>
        )}
      </SheetFooter>
      <ReconnectConnectionDialog
        connection={connection}
        open={reconnecting}
        onOpenChange={setReconnecting}
        onReconnected={onChanged}
      />
    </>
  );
};

const Fact = ({ label, children }: { label: string; children: ReactNode }) => (
  <div className="flex min-h-12 items-center justify-between gap-4 py-3 text-sm">
    <dt className="shrink-0 text-gray-11">{label}</dt>
    <dd className="flex min-w-0 justify-end text-right text-gray-12">
      {children}
    </dd>
  </div>
);

type ConnectionSheetProps = {
  connection: PlatformAppConnectionsListItem | null;
  access: GlobalConnectionAccess;
  onChanged: () => void;
  onDelete: (connection: PlatformAppConnectionsListItem) => void;
  onOpenChange: (open: boolean) => void;
};

type ConnectionDetailsProps = {
  connection: PlatformAppConnectionsListItem;
  access: GlobalConnectionAccess;
  onChanged: () => void;
  onDelete: () => void;
};
