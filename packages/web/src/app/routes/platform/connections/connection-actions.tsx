import {
  AppConnectionScope,
  PlatformAppConnectionsListItem,
} from '@activepieces/shared';
import { t } from 'i18next';
import { ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';

import { CreateOrEditConnectionDialog } from '@/app/connections/create-edit-connection-dialog';
import { ReconnectButtonDialog } from '@/app/connections/reconnect-button-dialog';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { LockedGem } from '@/features/billing';
import { EditGlobalConnectionDialog } from '@/features/connections';
import { piecesHooks } from '@/features/pieces';

import { connectionCellsUtils } from './connection-cells';

export const ConnectionRowActions = ({
  connection,
  access,
  onChanged,
}: ConnectionRowActionsProps) => {
  const project = connection.projects[0];
  if (connection.scope !== AppConnectionScope.PLATFORM) {
    if (!project) {
      return null;
    }
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="sm" asChild>
            <Link
              to={connectionCellsUtils.projectConnectionsPath(project.id)}
              aria-label={t('Open project')}
            >
              <ArrowUpRight className="size-4" />
            </Link>
          </Button>
        </TooltipTrigger>
        <TooltipContent>{t('Open project')}</TooltipContent>
      </Tooltip>
    );
  }
  if (access.locked) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            aria-label={t('Upgrade to manage global connections')}
            onClick={access.upgrade}
          >
            <LockedGem className="size-4 text-accent-11" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          {t('Upgrade to manage global connections')}
        </TooltipContent>
      </Tooltip>
    );
  }
  return (
    <>
      <EditGlobalConnectionDialog
        connectionId={connection.id}
        currentName={connection.displayName}
        projectIds={connection.projectIds}
        preSelectForNewProjects={connection.preSelectForNewProjects ?? false}
        userHasPermissionToEdit
        onEdit={onChanged}
      />
      <ReconnectButtonDialog
        connection={connection}
        onConnectionCreated={onChanged}
        hasPermission
      />
    </>
  );
};

export const ReconnectConnectionDialog = ({
  connection,
  open,
  onOpenChange,
  onReconnected,
}: ReconnectConnectionDialogProps) => {
  const { pieceModel, isLoading } = piecesHooks.usePiece({
    name: connection.pieceName,
    version: connection.pieceVersion,
    enabled: open,
  });
  if (!open || isLoading || !pieceModel) {
    return null;
  }
  return (
    <CreateOrEditConnectionDialog
      reconnectConnection={connection}
      isGlobalConnection={connection.scope === AppConnectionScope.PLATFORM}
      piece={pieceModel}
      open={open}
      setOpen={(nextOpen, reconnected) => {
        onOpenChange(nextOpen);
        if (reconnected) {
          onReconnected();
        }
      }}
    />
  );
};

export type GlobalConnectionAccess = {
  locked: boolean;
  upgrade: () => void;
};

type ConnectionRowActionsProps = {
  connection: PlatformAppConnectionsListItem;
  access: GlobalConnectionAccess;
  onChanged: () => void;
};

type ReconnectConnectionDialogProps = {
  connection: PlatformAppConnectionsListItem;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onReconnected: () => void;
};
