import { useQuery, useMutation } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';
import { t } from 'i18next';
import JSZip from 'jszip';
import { Plus, ChevronDown, Undo2, DownloadIcon } from 'lucide-react';
import { useState } from 'react';

import { ConfirmationDeleteDialog } from '@/components/delete-dialog';
import { Button } from '@/components/ui/button';
import { DataTable, RowDataWithActions } from '@/components/ui/data-table';
import { DataTableColumnHeader } from '@/components/ui/data-table/data-table-column-header';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { TableTitle } from '@/components/ui/table-title';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { INTERNAL_ERROR_TOAST, useToast } from '@/components/ui/use-toast';
import { projectReleaseApi } from '@/features/project-version/lib/project-release-api';
import { projectApi } from '@/lib/project-api';
import { formatUtils } from '@/lib/utils';
import { ProjectRelease, ProjectReleaseType } from '@activepieces/shared';

import { GitReleaseDialog } from './git-release-dialog';

const ProjectReleasesPage = () => {
  const { toast } = useToast();
  const [dialogType, setDialogType] = useState<ProjectReleaseType | null>(null);
  const [open, setOpen] = useState(false);
  const [selectedRelease, setSelectedRelease] = useState<ProjectRelease | null>(
    null,
  );
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['project-releases'],
    queryFn: () => projectReleaseApi.list(),
  });

  const { mutate: rollbackProjectRelease, isPending: isRollingBack } =
    useMutation({
      mutationKey: ['rollback-project-release'],
      mutationFn: ({
        projectId,
        releaseId,
      }: {
        projectId: string;
        releaseId: string;
      }) => {
        return projectApi.rollback(projectId, releaseId);
      },
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

  const { mutate: downloadProjectRelease } = useMutation({
    mutationKey: ['download-project-release'],
    mutationFn: ({ releaseId }: { releaseId: string }) => {
      return projectReleaseApi.download(releaseId);
    },
    onSuccess: (data) => {
      const zip = new JSZip();

      data.forEach((obj, index) => {
        const jsonContent = JSON.stringify(obj, null, 2);
        zip.file(`release-${index + 1}.json`, jsonContent);
      });

      zip.generateAsync({ type: 'blob' }).then((content) => {
        const url = window.URL.createObjectURL(content);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute(
          'download',
          `project-release-${selectedRelease?.name}.zip`,
        );
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
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
    {
      accessorKey: 'type',
      accessorFn: (row) => row.type,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('Type')} />
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
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <Button className="h-9 w-full">
                {t('Create Release')}
                <ChevronDown className="h-3 w-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem
                className="cursor-pointer"
                onClick={() => {
                  setDialogType(ProjectReleaseType.GIT);
                  setOpen(true);
                }}
              >
                <div className="flex flex-row gap-2 items-center">
                  <Plus className="h-4 w-4" />
                  <span>{t('From Git')}</span>
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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
                    <Button
                      loading={isRollingBack}
                      variant="ghost"
                      className="size-8 p-0"
                      onClick={() => {
                        setSelectedRelease(row);
                        downloadProjectRelease({ releaseId: row.id });
                      }}
                    >
                      <DownloadIcon className="size-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">{t('Download')}</TooltipContent>
                </Tooltip>
              </div>
            );
          },
          (row) => {
            return (
              <div className="flex items-center justify-center">
                <Tooltip>
                  <TooltipTrigger>
                    <ConfirmationDeleteDialog
                      isDanger={true}
                      title={t('Rollback ' + row.name)}
                      buttonText={t('Apply Changes')}
                      message={t(
                        'Are you sure you want to rollback? This will override all current flows and they will be lost.',
                      )}
                      entityName={`${t('Project Release')} ${row.fileId}`}
                      mutationFn={async () =>
                        rollbackProjectRelease({
                          projectId: row.projectId,
                          releaseId: row.id,
                        })
                      }
                    >
                      <Button
                        loading={isRollingBack}
                        variant="ghost"
                        className="size-8 p-0"
                      >
                        <Undo2 className="size-4" />
                      </Button>
                    </ConfirmationDeleteDialog>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">{t('Rollback')}</TooltipContent>
                </Tooltip>
              </div>
            );
          },
        ]}
      />
      {open && dialogType === ProjectReleaseType.GIT && (
        <GitReleaseDialog open={open} setOpen={setOpen} refetch={refetch} />
      )}
    </div>
  );
};

ProjectReleasesPage.displayName = 'ProjectReleasesPage';
export { ProjectReleasesPage };
