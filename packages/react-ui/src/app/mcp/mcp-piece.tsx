import { useMutation } from '@tanstack/react-query';
import { t } from 'i18next';
import { PlugIcon, Trash2, Unplug, Link2Icon } from 'lucide-react';
import { useState } from 'react';

import { ConfirmationDeleteDialog } from '@/components/delete-dialog';
import { Button } from '@/components/ui/button';
import { PermissionNeededTooltip } from '@/components/ui/permission-needed-tooltip';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import {
  TooltipContent,
  TooltipTrigger,
  Tooltip,
} from '@/components/ui/tooltip';
import { toast } from '@/components/ui/use-toast';
import { piecesHooks } from '@/features/pieces/lib/pieces-hook';
import {
  isNil,
  McpPieceStatus,
  McpPieceWithConnection,
} from '@activepieces/shared';

import { Card, CardContent } from '../../components/ui/card';
import { mcpApi } from '../../features/mcp/lib/mcp-api';
import { mcpHooks } from '../../features/mcp/lib/mcp-hooks';
import { PieceIcon } from '../../features/pieces/components/piece-icon';

import { McpPieceDialog } from './mcp-piece-dialog';

type McpPieceProps = {
  piece: McpPieceWithConnection;
  pieceInfo: {
    displayName: string;
    logoUrl?: string;
  };
  onDelete: (piece: McpPieceWithConnection) => void;
  isLoading?: boolean;
  hasPermissionToEdit: boolean;
};

export const McpPiece = ({
  piece,
  pieceInfo,
  onDelete,
  isLoading = false,
  hasPermissionToEdit,
}: McpPieceProps) => {
  const { pieceModel, isLoading: isPieceLoading } = piecesHooks.usePiece({
    name: piece.pieceName,
  });

  const { refetch: refetchMcp } = mcpHooks.useMcp();
  const { mutate: updatePieceStatus, isPending: isStatusUpdatePending } =
    useMutation({
      mutationFn: async (status: McpPieceStatus) => {
        setStatus(status === McpPieceStatus.ENABLED);
        await mcpApi.updatePiece({
          pieceId: piece.id,
          status,
        });
        return status;
      },
      onSuccess: (status) => {
        toast({
          title: `${t('MCP piece')} (${pieceModel?.displayName})`,
          description: t(
            `${
              status === McpPieceStatus.ENABLED ? 'Enabled' : 'Disabled'
            } successfully`,
          ),
        });
        refetchMcp();
      },
      onError: () => {
        toast({
          title: `${t('MCP piece')} (${pieceModel?.displayName})`,
          description: t('Failed to update piece status'),
          variant: 'destructive',
        });
      },
    });
  const [status, setStatus] = useState(piece.status === McpPieceStatus.ENABLED);

  const connectionRequired = !isNil(pieceModel?.auth);
  const connectionMissing = connectionRequired && !piece.connection;

  if (isLoading || isPieceLoading) {
    return (
      <Card className="overflow-hidden transition-all duration-200 relative hover:shadow-sm group border-border">
        <CardContent className="flex flex-row items-start p-4 gap-3 min-w-[420px]">
          <div className="flex items-center space-x-3 min-w-0 py-1.5">
            <div className="relative">
              <Skeleton className="h-10 w-10 rounded-full" />
              <Skeleton className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full" />
            </div>
            <div className="min-w-0 flex flex-col gap-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const displayName = piece.connection
    ? piece.connection.displayName
    : pieceInfo.displayName;

  // Toggle status helper function
  const toggleStatus = (checked: boolean) => {
    if (hasPermissionToEdit) {
      updatePieceStatus(
        checked ? McpPieceStatus.ENABLED : McpPieceStatus.DISABLED,
      );
    }
  };

  return (
    <Card className="overflow-hidden transition-all duration-200 relative hover:shadow-sm group border-border">
      <CardContent className="flex flex-row items-center p-4 justify-between">
        <div className="flex items-center space-x-3 min-w-0 py-1.5 flex-1">
          <div className="relative flex-shrink-0">
            <PieceIcon
              displayName={pieceInfo.displayName}
              logoUrl={pieceInfo.logoUrl}
              size="md"
              showTooltip={true}
              circle={true}
              border={true}
            />
            {piece.connection && (
              <div className="absolute -bottom-1 -right-1 bg-primary text-white rounded-full p-0.5">
                <PlugIcon className="h-3 w-3" />
              </div>
            )}
            {connectionMissing && (
              <div className="absolute -bottom-1 -right-1 bg-amber-500 text-white rounded-full p-0.5">
                <Unplug className="h-3 w-3" />
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="font-medium text-foreground truncate flex items-center gap-1.5">
              {pieceInfo.displayName}
            </h4>
            {piece.connection ? (
              <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-full">
                {displayName}
              </p>
            ) : connectionMissing ? (
              <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                <span className="text-amber-500">
                  {t('Connection required')}
                </span>
              </p>
            ) : null}
          </div>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0 ml-2">
          <PermissionNeededTooltip hasPermission={hasPermissionToEdit}>
            <Switch
              checked={status}
              onCheckedChange={toggleStatus}
              disabled={!hasPermissionToEdit || isStatusUpdatePending}
              className="scale-75"
            />
          </PermissionNeededTooltip>

          {pieceModel?.auth && (
            <PermissionNeededTooltip hasPermission={hasPermissionToEdit}>
              <Tooltip>
                <McpPieceDialog mcpPieceToUpdate={piece}>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      disabled={!hasPermissionToEdit}
                    >
                      <Link2Icon className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                </McpPieceDialog>

                <TooltipContent>
                  {t(connectionMissing ? 'Add Connection' : 'Edit Connection')}
                </TooltipContent>
              </Tooltip>
            </PermissionNeededTooltip>
          )}
          <PermissionNeededTooltip hasPermission={hasPermissionToEdit}>
            <Tooltip>
              <ConfirmationDeleteDialog
                title={`${t('Delete')} ${displayName}`}
                message={
                  <div>
                    {t(
                      "Are you sure you want to delete this tool from your MCP? if you delete it you won't be able to use it in your MCP client.",
                    )}
                  </div>
                }
                mutationFn={async () => {
                  onDelete(piece);
                }}
                entityName={t('piece')}
              >
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    disabled={!hasPermissionToEdit}
                  >
                    <Trash2 className="h-4 w-4 text-destructive transition-colors duration-200 group-hover:text-destructive/90" />
                  </Button>
                </TooltipTrigger>
              </ConfirmationDeleteDialog>
              <TooltipContent>{t('Delete')}</TooltipContent>
            </Tooltip>
          </PermissionNeededTooltip>
        </div>
      </CardContent>
    </Card>
  );
};
