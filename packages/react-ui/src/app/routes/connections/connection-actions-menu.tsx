import { useMutation } from '@tanstack/react-query';
import { t } from 'i18next';
import { InfoIcon, Trash2 } from 'lucide-react';
import React, { useState } from 'react';

import { ConfirmationDeleteDialog } from '@/components/delete-dialog';
import { Alert } from '@/components/ui/alert';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { PermissionNeededTooltip } from '@/components/ui/permission-needed-tooltip';
import { toast } from '@/components/ui/use-toast';
import { appConnectionsApi } from '@/features/connections/lib/app-connections-api';
import { useAuthorization } from '@/hooks/authorization-hooks';
import {
  AppConnectionWithoutSensitiveData,
  Permission,
} from '@activepieces/shared';

interface ConnectionActionMenuProps {
  connections: AppConnectionWithoutSensitiveData[];
  children?: React.ReactNode;
  refetch: () => void;
  onDelete: () => void;
}

export const ConnectionActionMenu: React.FC<ConnectionActionMenuProps> = ({
  connections,
  children,
  refetch,
  onDelete,
}) => {
  const { checkAccess } = useAuthorization();
  const userHasPermissionToUpdateConnection = checkAccess(
    Permission.WRITE_APP_CONNECTION,
  );
  const [open, setOpen] = useState(false);

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      await Promise.all(ids.map((id) => appConnectionsApi.delete(id)));
    },
    onSuccess: () => {
      refetch();
      onDelete();
    },
    onError: () => {
      toast({
        title: t('Error deleting connections'),
        variant: 'destructive',
      });
    },
  });

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger
        className="p-4 hover:bg-muted cursor-pointer"
        asChild
      >
        {children}
      </DropdownMenuTrigger>
      <DropdownMenuContent
        noAnimationOnOut={true}
        onCloseAutoFocus={(e) => e.preventDefault()}
      >
        <PermissionNeededTooltip
          hasPermission={userHasPermissionToUpdateConnection}
        >
          <ConfirmationDeleteDialog
            title={`${t('Delete')} ${connections
              .map((connection) => connection.displayName)
              .join(', ')}`}
            message={
              <div className="flex flex-col gap-2">
                <div className="gap-2">
                  <span>
                    {t(
                      'Are you sure you want to delete the selected connections? This action cannot be undone.',
                    )}
                  </span>
                  <span> </span>
                  <span className="text-black font-bold">
                    {t(
                      `${
                        Array.from(
                          new Set(
                            connections.flatMap(
                              (connection) => connection.flowIds || [],
                            ),
                          ),
                        ).length
                      } flows will be affected`,
                    )}
                  </span>
                </div>
                <Alert className="mt-4 flex flex-col gap-2">
                  <InfoIcon className="h-5 w-5" />
                  <span className="font-bold">
                    {t(
                      'Deleting connections may cause your Flows or MCP tools to break.',
                    )}
                  </span>
                </Alert>
              </div>
            }
            mutationFn={() =>
              bulkDeleteMutation.mutateAsync(
                connections.map((connection) => connection.id),
              )
            }
            entityName={t('connection')}
          >
            <DropdownMenuItem
              disabled={!userHasPermissionToUpdateConnection}
              onSelect={(e) => e.preventDefault()}
            >
              <div className="flex cursor-pointer  flex-row gap-2 items-center">
                <Trash2 className="h-4 w-4 text-destructive" />
                <span className="text-destructive">{t('Delete')}</span>
              </div>
            </DropdownMenuItem>
          </ConfirmationDeleteDialog>
        </PermissionNeededTooltip>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
