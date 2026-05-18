import { Permission, VariableWithoutSensitiveData } from '@activepieces/shared';
import { ColumnDef } from '@tanstack/react-table';
import { t } from 'i18next';
import {
  Copy,
  Link2,
  MoreVertical,
  Pencil,
  Search,
  Trash2,
  Variable,
  Workflow,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

import { VariableDialog } from '@/app/variables/variable-dialog';
import {
  BulkAction,
  DataTable,
  DataTableFilters,
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
import { variablesApi } from '@/features/variables/api/variables';
import {
  variablesMutations,
  variablesQueries,
} from '@/features/variables/hooks/variables-hooks';
import { useAuthorization } from '@/hooks/authorization-hooks';
import { ownerColumnHooks } from '@/hooks/owner-column-hooks';
import { authenticationSession } from '@/lib/authentication-session';

const copyValueToClipboard = async (id: string) => {
  try {
    const { value } = await variablesApi.reveal(id);
    await navigator.clipboard.writeText(value);
    toast.success(t('Value copied to clipboard'));
  } catch {
    toast.error(t('Could not copy value'));
  }
};

const copyReferenceToClipboard = async (name: string) => {
  try {
    await navigator.clipboard.writeText(`{{variables['${name}']}}`);
    toast.success(t('Reference copied to clipboard'));
  } catch {
    toast.error(t('Could not copy reference'));
  }
};

function VariablesPage() {
  const projectId = authenticationSession.getProjectId()!;
  const { checkAccess } = useAuthorization();
  const canWrite = checkAccess(Permission.WRITE_VARIABLE);

  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<
    VariableWithoutSensitiveData | undefined
  >(undefined);
  const [deleting, setDeleting] = useState<
    VariableWithoutSensitiveData | undefined
  >(undefined);
  const [selectedRows, setSelectedRows] = useState<
    VariableWithoutSensitiveData[]
  >([]);
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);

  const { cursor, limit, name, ownerEmails } =
    variablesQueries.useListSearchParams();

  const {
    data: variables,
    isLoading,
    refetch,
  } = variablesQueries.useVariables({
    request: {
      projectId,
      cursor,
      limit,
      name,
    },
    extraKeys: [
      'variables',
      cursor ?? '',
      String(limit),
      name ?? '',
      projectId,
    ],
    showErrorDialog: true,
  });

  const { mutateAsync: deleteVariable } =
    variablesMutations.useBulkDeleteVariables(refetch);

  const { data: owners } = variablesQueries.useVariableOwners(projectId);

  const filteredData = useMemo(() => {
    if (!variables?.data) return undefined;
    if (ownerEmails.length === 0) return variables;
    return {
      data: variables.data.filter(
        (v) => v.owner && ownerEmails.includes(v.owner.email),
      ),
      next: variables.next,
      previous: variables.previous,
    };
  }, [variables, ownerEmails]);

  const filters: DataTableFilters<keyof VariableWithoutSensitiveData>[] =
    ownerColumnHooks.useOwnerColumnFilter<VariableWithoutSensitiveData>(
      [
        {
          type: 'input',
          title: t('Name'),
          accessorKey: 'name',
          icon: Search,
        },
      ],
      1,
      owners,
    );

  const columns: ColumnDef<
    RowDataWithActions<VariableWithoutSensitiveData>,
    unknown
  >[] = ownerColumnHooks.useOwnerColumn<VariableWithoutSensitiveData>(
    [
      {
        accessorKey: 'name',
        size: 280,
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={t('Name')}
            icon={Variable}
          />
        ),
        cell: ({ row }) => (
          <div className="flex items-center gap-2 min-w-0">
            <div className="shrink-0 flex items-center justify-center w-8 h-8 rounded-md bg-primary/10 text-primary">
              <Variable className="w-4 h-4" />
            </div>
            <span className="font-mono text-sm truncate">
              {row.original.name}
            </span>
          </div>
        ),
      },
      {
        accessorKey: 'flowIds',
        size: 140,
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={t('Used in')}
            icon={Workflow}
          />
        ),
        cell: ({ row }) => {
          const count = row.original.flowIds?.length ?? 0;
          return (
            <span className="text-sm text-muted-foreground">
              {t('{count, plural, =0 {No flows} =1 {1 flow} other {# flows}}', {
                count,
              })}
            </span>
          );
        },
      },
      {
        accessorKey: 'updated',
        size: 180,
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
              <DropdownMenuContent align="end" className="w-48">
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
                  onSelect={(e) => {
                    e.preventDefault();
                    void copyReferenceToClipboard(row.original.name);
                  }}
                >
                  <Link2 className="h-4 w-4 mr-2" />
                  {t('Copy reference')}
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
    ],
    2,
  );

  const bulkActions: BulkAction<VariableWithoutSensitiveData>[] = useMemo(
    () => [
      {
        render: (_rows, resetSelection) => (
          <>
            {selectedRows.length > 0 && (
              <ConfirmationDeleteDialog
                title={t('Delete variables')}
                message={t(
                  'This permanently deletes the selected variables. Flows that reference them will fail at runtime.',
                )}
                entityName={t('variable')}
                buttonText={t('Delete')}
                isDanger
                showToast
                open={showBulkDeleteDialog}
                onOpenChange={setShowBulkDeleteDialog}
                mutationFn={async () => {
                  await deleteVariable(selectedRows.map((row) => row.id));
                  resetSelection();
                  setSelectedRows([]);
                }}
              >
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  disabled={!canWrite}
                  onClick={() => setShowBulkDeleteDialog(true)}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  {t('Delete')} ({selectedRows.length})
                </Button>
              </ConfirmationDeleteDialog>
            )}
          </>
        ),
      },
    ],
    [selectedRows, showBulkDeleteDialog, canWrite, deleteVariable],
  );

  const toolbarButtons = [
    <PermissionNeededTooltip key="new" hasPermission={canWrite}>
      <Button
        disabled={!canWrite}
        size="sm"
        onClick={() => setCreateOpen(true)}
      >
        <PlusIcon size={16} className="mr-1" />
        {t('New variable')}
      </Button>
    </PermissionNeededTooltip>,
  ];

  return (
    <div className="flex flex-col w-full">
      <DataTable
        emptyStateTextTitle={t('No variables yet')}
        emptyStateTextDescription={t(
          'Create one to reference a value from any step input.',
        )}
        emptyStateIcon={<Variable className="size-14" />}
        columns={columns}
        page={filteredData}
        isLoading={isLoading}
        filters={filters}
        toolbarButtons={toolbarButtons}
        selectColumn={true}
        onSelectedRowsChange={setSelectedRows}
        bulkActions={bulkActions}
      />
      <VariableDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSaved={() => refetch()}
      />
      <VariableDialog
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
        title={t('Delete variable')}
        message={t(
          'This permanently deletes the variable. Flows that reference it will fail at runtime.',
        )}
        entityName={deleting?.name ?? ''}
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
          await deleteVariable([deleting.id]);
          setDeleting(undefined);
        }}
      />
    </div>
  );
}

export { VariablesPage };
