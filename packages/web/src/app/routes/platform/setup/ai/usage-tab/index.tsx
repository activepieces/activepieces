import { ColumnDef } from '@tanstack/react-table';
import { t } from 'i18next';
import { ChartColumn, OctagonAlert, Pencil, Search } from 'lucide-react';
import { useState } from 'react';

import { DataTable, RowDataWithActions } from '@/components/custom/data-table';
import { DataTableColumnHeader } from '@/components/custom/data-table/data-table-column-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatUtils } from '@/lib/format-utils';
import { cn } from '@/lib/utils';

import { SectionHeader } from '../components/section-header';
import { pageSlice, TablePagination } from '../components/table-pagination';
import { MockProjectAiUsage, MockScenario } from '../mock/fixtures';

import { ProjectUsageDialog } from './project-usage-dialog';
import { SetLimitDialog } from './set-limit-dialog';
import { ProjectIconTile, usageMath } from './usage-utils';

export function UsageTab({ scenario }: { scenario: MockScenario }) {
  const [rows, setRows] = useState(scenario.usage);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [detailProjectId, setDetailProjectId] = useState<string | null>(null);

  const filtered = rows.filter((row) =>
    row.projectName.toLowerCase().includes(search.trim().toLowerCase()),
  );
  const { rows: pageRows, page: currentPage } = pageSlice({
    items: filtered,
    page,
    pageSize: PAGE_SIZE,
  });
  const editingRow = rows.find((row) => row.projectId === editingProjectId);
  const detailRow = rows.find((row) => row.projectId === detailProjectId);

  const columns: ColumnDef<RowDataWithActions<MockProjectAiUsage>>[] = [
    {
      accessorKey: 'projectName',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('Project')} />
      ),
      cell: ({ row }) => (
        <div className="flex items-center gap-2.5">
          <ProjectIconTile name={row.original.projectName} className="size-6" />
          <span className="text-sm font-medium">
            {row.original.projectName}
          </span>
        </div>
      ),
    },
    {
      accessorKey: 'creditsUsed',
      size: 140,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('AI credits used')} />
      ),
      cell: ({ row }) => {
        const { reached } = usageMath({ row: row.original });
        return (
          <span
            className={cn('flex items-center gap-1.5 text-sm tabular-nums', {
              'text-destructive': reached,
            })}
          >
            {row.original.creditsUsed.toLocaleString()}
            {reached && (
              <span title={t('Limit reached')} className="inline-flex">
                <OctagonAlert className="size-3.5 shrink-0" />
              </span>
            )}
          </span>
        );
      },
    },
    {
      accessorKey: 'limit',
      size: 140,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('Limit')} />
      ),
      cell: ({ row }) => (
        <Button
          variant="outline"
          size="xs"
          className="text-muted-foreground hover:text-foreground"
          onClick={(event) => {
            event.stopPropagation();
            setEditingProjectId(row.original.projectId);
          }}
        >
          <Pencil className="size-3" />
          {row.original.limit === null
            ? t('Set limit')
            : row.original.limit.toLocaleString()}
        </Button>
      ),
    },
    {
      accessorKey: 'lastActivity',
      size: 120,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('Last activity')} />
      ),
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {formatUtils.formatDateToAgo(new Date(row.original.lastActivity))}
        </span>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-end justify-between gap-3">
        <SectionHeader
          title={t('Projects')}
          count={rows.length}
          description={t(
            'Click a project for a detailed breakdown. Bring-your-own-key numbers are estimates.',
          )}
        />
        <div className="relative w-64 shrink-0">
          <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(0);
            }}
            placeholder={t('Search projects...')}
            className="pl-8"
          />
        </div>
      </div>

      <DataTable
        columns={columns}
        page={{ data: pageRows, next: null, previous: null }}
        isLoading={false}
        hidePagination={true}
        onRowClick={(row) => setDetailProjectId(row.projectId)}
        emptyStateTextTitle={t('No projects found')}
        emptyStateTextDescription={
          search.trim().length > 0
            ? t('No project matches your search.')
            : t(
                'Usage appears here as soon as a project runs chat, agents, or AI steps.',
              )
        }
        emptyStateIcon={
          <ChartColumn className="size-10 text-muted-foreground" />
        }
      />

      <TablePagination
        page={currentPage}
        pageSize={PAGE_SIZE}
        total={filtered.length}
        onPageChange={setPage}
      />

      <SetLimitDialog
        open={editingRow !== undefined}
        onOpenChange={(open) => {
          if (!open) {
            setEditingProjectId(null);
          }
        }}
        projectName={editingRow?.projectName ?? ''}
        currentLimit={editingRow?.limit ?? null}
        onSave={(limit) => {
          setRows((current) =>
            current.map((row) =>
              row.projectId === editingProjectId ? { ...row, limit } : row,
            ),
          );
        }}
      />
      <ProjectUsageDialog
        row={detailRow}
        onOpenChange={(open) => {
          if (!open) {
            setDetailProjectId(null);
          }
        }}
      />
    </div>
  );
}

const PAGE_SIZE = 10;
