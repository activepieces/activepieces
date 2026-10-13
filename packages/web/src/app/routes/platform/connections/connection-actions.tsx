import {
  AppConnectionScope,
  PlatformAppConnectionsListItem,
} from '@activepieces/shared';
import { t } from 'i18next';
import { ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';

import { AdminFetchErrorState, adminLayout } from '@/app/components/admin';
import { CreateOrEditConnectionDialog } from '@/app/connections/create-edit-connection-dialog';
import { ReconnectButtonDialog } from '@/app/connections/reconnect-button-dialog';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { SkeletonList } from '@/components/ui/skeleton';
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
        adminFeedback
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
  const { pieceModel, isError, refetch } = piecesHooks.usePiece({
    name: connection.pieceName,
    version: connection.pieceVersion,
    enabled: open,
  });
  if (!open) {
    return null;
  }
  if (!pieceModel) {
    return (
      <Dialog open onOpenChange={onOpenChange}>
        <DialogContent className={adminLayout.dialog.md}>
          <DialogHeader>
            <DialogTitle>{t('Reconnect')}</DialogTitle>
          </DialogHeader>
          {isError ? (
            <AdminFetchErrorState entity={t('this piece')} onRetry={refetch} />
          ) : (
            <SkeletonList numberOfItems={3} className="h-10" />
          )}
        </DialogContent>
      </Dialog>
    );
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
