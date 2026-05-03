import {
  AppConnectionKind,
  AppConnectionWithoutSensitiveData,
  Permission,
} from '@activepieces/shared';
import { ColumnDef } from '@tanstack/react-table';
import { t } from 'i18next';
import {
  Copy,
  KeyRound,
  MoreVertical,
  Pencil,
  Search,
  Trash2,
  User,
} from 'lucide-react';
import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { toast } from 'sonner';

import { CopyTextTooltip } from '@/components/custom/clipboard/copy-text-tooltip';
import {
  CURSOR_QUERY_PARAM,
  DataTable,
  DataTableFilters,
  LIMIT_QUERY_PARAM,
  RowDataWithActions,
} from '@/components/custom/data-table';
import { DataTableColumnHeader } from '@/components/custom/data-table/data-table-column-header';
import { ConfirmationDeleteDialog } from '@/components/custom/delete-dialog';
import { FormattedDate } from '@/components/custom/formatted-date';
import { PermissionNeededTooltip } from '@/components/custom/permission-needed-tooltip';
import { PlusIcon } from '@/components/icons/plus';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  appConnectionsMutations,
  appConnectionsQueries,
} from '@/features/connections';
import { useAuthorization } from '@/hooks/authorization-hooks';
import { api } from '@/lib/api';
import { authenticationSession } from '@/lib/authentication-session';

import { CredentialDialog } from '../../connections/credential-dialog';

const revealCredential = async (id: string): Promise<string> => {
  const { value } = await api.post<{ value: string }>(
    `/v1/app-connections/${id}/reveal`,
    {},
  );
  return value;
};

const copyValueToClipboard = async (id: string) => {
  try {
    const value = await revealCredential(id);
    await navigator.clipboard.writeText(value);
    toast.success(t('Value copied to clipboard'));
  } catch {
    toast.error(t('Could not copy value'));
  }
};

export function CredentialsTab() {
  const location = useLocation();
  const projectId = authenticationSession.getProjectId()!;
  const { checkAccess } = useAuthorization();
  const canWrite = checkAccess(Permission.WRITE_APP_CONNECTION);

  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<
    AppConnectionWithoutSensitiveData | undefined
  >(undefined);
  const [deleting, setDeleting] = useState<
    AppConnectionWithoutSensitiveData | undefined
  >(undefined);

  const searchParams = new URLSearchParams(location.search);
  const cursor = searchParams.get(CURSOR_QUERY_PARAM) ?? undefined;
  const limit = searchParams.get(LIMIT_QUERY_PARAM)
    ? parseInt(searchParams.get(LIMIT_QUERY_PARAM)!)
    : 10;
  const displayName = searchParams.get('displayName') ?? undefined;

  const {
    data: credentials,
    isLoading,
    refetch,
  } = appConnectionsQueries.useAppConnections({
    request: {
      projectId,
      cursor,
      limit,
      displayName,
      kind: AppConnectionKind.SECRET,
    },
    extraKeys: ['credentials', location.search, projectId],
    showErrorDialog: true,
  });

  const { mutateAsync: deleteCredential } =
    appConnectionsMutations.useBulkDeleteAppConnections(refetch);

  const filters: DataTableFilters<keyof AppConnectionWithoutSensitiveData>[] = [
    {
      type: 'input',
      title: t('Name'),
      accessorKey: 'displayName',
      icon: Search,
    },
  ];

  const columns: ColumnDef<
    RowDataWithActions<AppConnectionWithoutSensitiveData>,
    unknown
  >[] = [
    {
      accessorKey: 'displayName',
      size: 320,
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t('Name')}
          icon={KeyRound}
        />
      ),
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <div className="shrink-0 flex items-center justify-center w-8 h-8 rounded-md bg-primary/10 text-primary">
            <KeyRound className="w-4 h-4" />
          </div>
          <CopyTextTooltip
            title={t('Copy reference')}
            text={`{{connections['${row.original.externalId}'].secret_text}}`}
          >
            <span className="font-mono text-sm truncate max-w-[260px]">
              {row.original.displayName}
            </span>
          </CopyTextTooltip>
        </div>
      ),
    },
    {
      accessorKey: 'owner',
      size: 220,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('Owner')} icon={User} />
      ),
      cell: ({ row }) =>
        row.original.owner ? (
          <span className="text-sm">
            {row.original.owner.firstName} {row.original.owner.lastName}
          </span>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      accessorKey: 'updated',
      size: 200,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('Last updated')} />
      ),
      cell: ({ row }) => (
        <FormattedDate date={new Date(row.original.updated)} />
      ),
    },
    {
      id: 'actions',
      size: 60,
      cell: ({ row }) => (
        <div className="flex justify-end">
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                aria-label={t('Open menu')}
                onClick={(e) => e.stopPropagation()}
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem
                disabled={!canWrite}
                onSelect={(e) => {
                  e.preventDefault();
                  setEditing(row.original);
                }}
              >
                <Pencil className="h-4 w-4 mr-2" />
                {t('Edit')}
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={!canWrite}
                onSelect={(e) => {
                  e.preventDefault();
                  void copyValueToClipboard(row.original.id);
                }}
              >
                <Copy className="h-4 w-4 mr-2" />
                {t('Copy value')}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                disabled={!canWrite}
                className="text-destructive focus:text-destructive"
                onSelect={(e) => {
                  e.preventDefault();
                  setDeleting(row.original);
                }}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {t('Delete')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ];

  const toolbarButtons = [
    <PermissionNeededTooltip key="new" hasPermission={canWrite}>
      <Button
        disabled={!canWrite}
        size="sm"
        onClick={() => setCreateOpen(true)}
      >
        <PlusIcon size={16} className="mr-1" />
        {t('New credential')}
      </Button>
    </PermissionNeededTooltip>,
  ];

  return (
    <>
      <DataTable
        emptyStateTextTitle={t('No credentials yet')}
        emptyStateTextDescription={t(
          'Create one to securely reference a value from any step input.',
        )}
        emptyStateIcon={<KeyRound className="size-14" />}
        columns={columns}
        page={credentials}
        isLoading={isLoading}
        filters={filters}
        toolbarButtons={toolbarButtons}
      />
      <CredentialDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSaved={() => refetch()}
      />
      <CredentialDialog
        open={!!editing}
        existing={editing}
        onOpenChange={(open) => {
          if (!open) {
            setEditing(undefined);
          }
        }}
        onSaved={() => {
          refetch();
          setEditing(undefined);
        }}
      />
      <ConfirmationDeleteDialog
        title={t('Delete credential')}
        message={t(
          'This permanently deletes the secret value. Flows that reference it will fail at runtime.',
        )}
        entityName={deleting?.displayName ?? ''}
        isDanger
        showToast
        open={!!deleting}
        onOpenChange={(open) => {
          if (!open) {
            setDeleting(undefined);
          }
        }}
        mutationFn={async () => {
          if (!deleting) return;
          await deleteCredential([deleting.id]);
          setDeleting(undefined);
        }}
      />
    </>
  );
}
