import {
  SECRET_MANAGER_PROVIDERS_METADATA,
  SecretManagerConnectionScope,
  SecretManagerConnectionWithStatus,
} from '@activepieces/shared';
import { ColumnDef } from '@tanstack/react-table';
import { t } from 'i18next';
import {
  KeyRound,
  Pencil,
  RefreshCcw,
  Trash,
  Globe,
  Activity,
  XIcon,
} from 'lucide-react';

import { DashboardPageHeader } from '@/app/components/dashboard-page-header';
import LockedFeatureGuard from '@/app/components/locked-feature-guard';
import { AnimatedIconButton } from '@/components/custom/animated-icon-button';
import { DataTable, RowDataWithActions } from '@/components/custom/data-table';
import { DataTableColumnHeader } from '@/components/custom/data-table/data-table-column-header';
import { ConfirmationDeleteDialog } from '@/components/custom/delete-dialog';
import { StatusIconWithText } from '@/components/custom/status-icon-with-text';
import { PlusIcon } from '@/components/icons/plus';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { PieceIcon } from '@/features/pieces';
import { secretManagersHooks } from '@/features/secret-managers';
import { platformHooks } from '@/hooks/platform-hooks';

import AddEditSecretManagerConnectionDialog from './connect-secret-manager-dialog';

const SecretManagersPage = () => {
  const { platform } = platformHooks.useCurrentPlatform();
  const { data: connections, isLoading: isLoadingConnections } =
    secretManagersHooks.useListSecretManagerConnections({
      listForPlatform: true,
    });
  const { mutate: deleteConnection } =
    secretManagersHooks.useDeleteSecretManagerConnection();

  const isLoading = isLoadingConnections;

  const page = connections
    ? { data: connections, next: null, previous: null }
    : undefined;

  const columns: ColumnDef<
    RowDataWithActions<SecretManagerConnectionWithStatus>,
    unknown
  >[] = [
    {
      accessorKey: 'name',
      size: 240,
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t('Name')}
          icon={KeyRound}
        />
      ),
      cell: ({ row }) => {
        const provider = SECRET_MANAGER_PROVIDERS_METADATA.find(
          (p) => p.id === row.original.providerId,
        );
        return (
          <div className="flex items-center gap-2 w-fit">
            <PieceIcon
              size="md"
              border={true}
              displayName={provider?.name}
              logoUrl={provider?.logo}
              showTooltip={true}
            />
            <span>{row.original.name}</span>
          </div>
        );
      },
    },
    {
      accessorKey: 'scope',
      size: 100,
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t('Scope')}
          icon={Globe}
        />
      ),
      cell: ({ row }) => {
        const connection = row.original;
        if (connection.scope === SecretManagerConnectionScope.PLATFORM) {
          return (
            <Badge variant="outline" className="text-xs">
              {t('Platform')}
            </Badge>
          );
        }
        return (
          <Badge variant="outline" className="text-xs">
            {t('Project')}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'connection',
      size: 100,
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t('Status')}
          icon={Activity}
        />
      ),
      cell: ({ row }) => {
        const { configured, connected } = row.original.connection;
        if (!configured) {
          return (
            <Badge variant="outline" className="text-xs text-muted-foreground">
              {t('Not configured')}
            </Badge>
          );
        }
        if (connected) {
          return (
            <StatusIconWithText
              icon={Activity}
              text={t('Connected')}
              variant="success"
            />
          );
        }
        return (
          <StatusIconWithText
            icon={XIcon}
            text={t('Disconnected')}
            variant="error"
          />
        );
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const connection = row.original;
        return (
          <div className="flex items-center gap-1 justify-end">
            <AddEditSecretManagerConnectionDialog connection={connection}>
              <Button variant="ghost" size="sm">
                <Pencil className="size-4" />
              </Button>
            </AddEditSecretManagerConnectionDialog>
            <SecretManagerClearCacheButton connection={connection} />
            <ConfirmationDeleteDialog
              title={t('Delete Connection')}
              message={t(
                'Are you sure you want to delete this secret manager connection?',
              )}
              warning={t(
                'Deleting this secret manager connection will break all flows/app connections using it.',
              )}
              entityName={connection.name}
              mutationFn={async () => deleteConnection(connection.id)}
            >
              <div>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <Trash className="size-4 text-destructive" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{t('Delete')}</TooltipContent>
                </Tooltip>
              </div>
            </ConfirmationDeleteDialog>
          </div>
        );
      },
    },
  ];

  return (
    <LockedFeatureGuard
      featureKey="SECRET_MANAGERS"
      locked={!platform.plan.secretManagersEnabled}
      lockTitle={t('Enable Secret Managers')}
      lockDescription={t('Manage your secrets from a single and secure place')}
    >
      <div className="flex-col w-full">
        <DashboardPageHeader
          title={t('Secret Managers')}
          description={t('Manage Secret Manager connections')}
        >
          <AddEditSecretManagerConnectionDialog>
            <AnimatedIconButton icon={PlusIcon} iconSize={16} size="sm">
              {t('New Connection')}
            </AnimatedIconButton>
          </AddEditSecretManagerConnectionDialog>
        </DashboardPageHeader>
        <DataTable
          emptyStateTextTitle={t('No connections found')}
          emptyStateTextDescription={t(
            'Add a secret manager connection to manage your secrets',
          )}
          emptyStateIcon={<KeyRound className="size-14" />}
          columns={columns}
          page={page}
          isLoading={isLoading}
          hidePagination={true}
        />
      </div>
    </LockedFeatureGuard>
  );
};

export default SecretManagersPage;

const SecretManagerClearCacheButton = ({
  connection,
}: {
  connection: SecretManagerConnectionWithStatus;
}) => {
  const { mutate: clearCache, isPending: isClearingCache } =
    secretManagersHooks.useClearCache();
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          loading={isClearingCache}
          onClick={() => clearCache(connection.id)}
        >
          <RefreshCcw className="size-4" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>{t('Clear Cache')}</TooltipContent>
    </Tooltip>
  );
};
