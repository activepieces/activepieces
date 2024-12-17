import { useQuery, useMutation } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';
import { t } from 'i18next';
import { Trash, Plus, Download } from 'lucide-react';

import { ConfirmationDeleteDialog } from '@/components/delete-dialog';
import { Button } from '@/components/ui/button';
import { DataTable, RowDataWithActions } from '@/components/ui/data-table';
import { DataTableColumnHeader } from '@/components/ui/data-table/data-table-column-header';
import { TableTitle } from '@/components/ui/table-title';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { INTERNAL_ERROR_TOAST, useToast } from '@/components/ui/use-toast';
import { projectReleaseApi } from '@/features/project-version/lib/project-release-api';
import { formatUtils } from '@/lib/utils';
import { ProjectRelease } from '@activepieces/shared';

const ProjectReleasesPage = () => {
  const { toast } = useToast();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['project-releases'],
    queryFn: () => projectReleaseApi.list(),
  });

  const { mutate: deleteProjectRelease, isPending: isDeleting } = useMutation({
    mutationKey: ['delete-project-release'],
    mutationFn: (id: string) => projectReleaseApi.delete(id),
    onSuccess: () => {
      refetch();
      toast({
        title: t('Success'),
        description: t('Project Release deleted successfully'),
        duration: 3000,
      });
    },
    onError: () => {
      toast(INTERNAL_ERROR_TOAST);
    },
  });

  const columns: ColumnDef<RowDataWithActions<ProjectRelease>>[] = [
    {
      accessorKey: 'name',
      accessorFn: (row) => row.name,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('Name')} />
      ),
      cell: ({ row }) => <div className="text-left">{row.original.name}</div>,
    },
    {
      accessorKey: 'created',
      accessorFn: (row) => row.created,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('Imported At')} />
      ),
      cell: ({ row }) => (
        <div className="text-left">
          {formatUtils.formatDate(new Date(row.original.created))}
        </div>
      ),
    },
    {
      accessorKey: 'importedBy',
      accessorFn: (row) => row.importedBy,
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t('Imported By')}
          className="text-center"
        />
      ),
      cell: ({ row }) => (
        <div className="text-left">{row.original.importedBy}</div>
      ),
    },
  ];

  return (
    <div className="flex-col w-full">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex flex-col gap-2">
          <TableTitle>{t('Project Releases')}</TableTitle>
          <div className="text-sm text-muted-foreground">
            {t('View all history of imported project releases')}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" className="flex items-center gap-2">
            <Plus className="size-4" />
            {t('Import')}
          </Button>
          <Button size="sm" className="flex items-center gap-2">
            <Download className="size-4" />
            {t('Export')}
          </Button>
        </div>
      </div>
      <DataTable
        columns={columns}
        page={data}
        isLoading={isLoading}
        actions={[
          (row) => {
            return (
              <div className="flex items-center justify-center">
                <Tooltip>
                  <TooltipTrigger>
                    <ConfirmationDeleteDialog
                      isDanger={true}
                      title={t('Delete Release')}
                      message={t(
                        'Deleting this release will remove all associated flows and triggers. Are you sure you want to proceed?',
                      )}
                      entityName={`${t('Project Release')} ${row.fileId}`}
                      mutationFn={async () => deleteProjectRelease(row.id)}
                    >
                      <Button
                        loading={isDeleting}
                        variant="ghost"
                        className="size-8 p-0"
                      >
                        <Trash className="size-4 text-destructive" />
                      </Button>
                    </ConfirmationDeleteDialog>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    {t('Delete Release')}
                  </TooltipContent>
                </Tooltip>
              </div>
            );
          },
        ]}
      />
    </div>
  );
};

ProjectReleasesPage.displayName = 'ProjectReleasesPage';
export { ProjectReleasesPage };
