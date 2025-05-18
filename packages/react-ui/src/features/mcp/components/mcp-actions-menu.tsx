import { UseMutationResult } from '@tanstack/react-query';
import { t } from 'i18next';
import {
  EllipsisVertical,
  PencilIcon,
  TrashIcon,
} from 'lucide-react';

import { ConfirmationDeleteDialog } from '@/components/delete-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { PermissionNeededTooltip } from '@/components/ui/permission-needed-tooltip';
import { useAuthorization } from '@/hooks/authorization-hooks';
import { McpWithPieces, Permission } from '@activepieces/shared';

import RenameMcpDialog from './rename-mcp-dialog'; // Adjusted path

const McpActionsMenu = ({
  mcp,
  refetch,
  deleteMutation,
}: {
  mcp: McpWithPieces;
  refetch: () => void;
  deleteMutation: UseMutationResult<void, Error, string[], unknown>;
}) => {
  const userHasPermissionToUpdateMcp = useAuthorization().checkAccess(
    Permission.WRITE_MCP,
  );

  return (
    <DropdownMenu modal={true}>
      <DropdownMenuTrigger asChild>
        <div className="rounded-full p-2 hover:bg-muted cursor-pointer">
          <EllipsisVertical className="h-6 w-6" />
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <PermissionNeededTooltip hasPermission={userHasPermissionToUpdateMcp}>
          <RenameMcpDialog
            mcpName={mcp.name}
            mcpId={mcp.id}
            onRename={() => {
              refetch();
            }}
          >
            <DropdownMenuItem
              disabled={!userHasPermissionToUpdateMcp}
              onSelect={(e) => e.preventDefault()}
            >
              <PermissionNeededTooltip
                hasPermission={userHasPermissionToUpdateMcp}
              >
                <div className="flex items-center gap-2">
                  <PencilIcon className="h-4 w-4" />
                  {t('Rename')}
                </div>
              </PermissionNeededTooltip>
            </DropdownMenuItem>
          </RenameMcpDialog>
        </PermissionNeededTooltip>

        <PermissionNeededTooltip hasPermission={userHasPermissionToUpdateMcp}>
          <DropdownMenuItem
            disabled={!userHasPermissionToUpdateMcp}
            onSelect={(e) => e.preventDefault()}
          >
            <ConfirmationDeleteDialog
              title={`${t('Delete')} ${mcp.name}`}
              message={t(
                'Are you sure you want to delete this MCP server? This action cannot be undone.',
              )}
              entityName={mcp.name}
              mutationFn={async () => {
                await deleteMutation.mutateAsync([mcp.id]);
                refetch();
              }}
            >
              <div className="flex items-center gap-2 text-destructive">
                <TrashIcon className="h-4 w-4" />
                {t('Delete')}
              </div>
            </ConfirmationDeleteDialog>
          </DropdownMenuItem>
        </PermissionNeededTooltip>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

McpActionsMenu.displayName = 'McpActionsMenu';
export { McpActionsMenu }; 