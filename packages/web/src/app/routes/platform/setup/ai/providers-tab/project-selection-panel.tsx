import { PROJECT_COLOR_PALETTE } from '@activepieces/shared';
import { ColumnDef } from '@tanstack/react-table';
import { t } from 'i18next';
import { FolderOpen, Search } from 'lucide-react';
import { useState } from 'react';

import { DataTable, RowDataWithActions } from '@/components/custom/data-table';
import { DataTableColumnHeader } from '@/components/custom/data-table/data-table-column-header';
import { InputWithIcon } from '@/components/custom/input-with-icon';
import { Checkbox } from '@/components/ui/checkbox';
import { Toggle } from '@/components/ui/toggle';

import { pageSlice, TablePagination } from '../components/table-pagination';
import { MockProject } from '../mock/fixtures';

export function ProjectSelectionPanel({
  projects,
  selectedIds,
  onChange,
}: {
  projects: MockProject[];
  selectedIds: string[];
  onChange: (projectIds: string[]) => void;
}) {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [showSelectedOnly, setShowSelectedOnly] = useState(false);

  const filtered = projects
    .filter((project) =>
      project.name.toLowerCase().includes(search.trim().toLowerCase()),
    )
    .filter((project) => !showSelectedOnly || selectedIds.includes(project.id));
  const { rows, page: currentPage } = pageSlice({
    items: filtered,
    page,
    pageSize: PAGE_SIZE,
  });
  const allRowsSelected =
    rows.length > 0 &&
    rows.every((project) => selectedIds.includes(project.id));

  const toggleProject = (projectId: string) => {
    onChange(
      selectedIds.includes(projectId)
        ? selectedIds.filter((id) => id !== projectId)
        : [...selectedIds, projectId],
    );
  };
  const toggleRows = () => {
    const rowIds = rows.map((project) => project.id);
    onChange(
      allRowsSelected
        ? selectedIds.filter((id) => !rowIds.includes(id))
        : [...new Set([...selectedIds, ...rowIds])],
    );
  };

  const columns: ColumnDef<RowDataWithActions<MockProject>>[] = [
    {
      accessorKey: 'select',
      size: 40,
      header: () => (
        <Checkbox checked={allRowsSelected} onCheckedChange={toggleRows} />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={selectedIds.includes(row.original.id)}
          className="pointer-events-none"
        />
      ),
    },
    {
      accessorKey: 'name',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('Project')} />
      ),
      cell: ({ row }) => (
        <div className="flex items-center gap-2.5">
          <ProjectSwatch project={row.original} />
          <span className="text-sm font-medium">{row.original.name}</span>
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <InputWithIcon
          icon={<Search className="size-4 shrink-0 text-muted-foreground" />}
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(0);
          }}
          placeholder={t('Search {count} projects', { count: projects.length })}
          className="min-w-52 flex-1"
        />
        <Toggle
          variant="outline"
          size="sm"
          pressed={showSelectedOnly}
          onPressedChange={(pressed) => {
            setShowSelectedOnly(pressed);
            setPage(0);
          }}
        >
          {t('Selected only')}
        </Toggle>
      </div>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span className="tabular-nums">
          {t('{selected} of {total} selected', {
            selected: selectedIds.length,
            total: projects.length,
          })}
        </span>
        <button
          type="button"
          className="transition-colors hover:text-foreground"
          onClick={() => onChange([])}
        >
          {t('Clear')}
        </button>
      </div>
      <DataTable
        columns={columns}
        page={{ data: rows, next: null, previous: null }}
        isLoading={false}
        hidePagination={true}
        onRowClick={(row) => toggleProject(row.id)}
        emptyStateTextTitle={t('No projects found')}
        emptyStateTextDescription={
          showSelectedOnly
            ? t('No project is selected yet.')
            : t('No project matches your search.')
        }
        emptyStateIcon={
          <FolderOpen className="size-10 text-muted-foreground" />
        }
      />
      <TablePagination
        page={currentPage}
        pageSize={PAGE_SIZE}
        total={filtered.length}
        onPageChange={setPage}
      />
    </div>
  );
}

export function ProjectSwatch({ project }: { project: MockProject }) {
  return (
    <span
      className="flex size-5 shrink-0 items-center justify-center rounded-sm text-[10px] font-medium"
      style={{
        backgroundColor: PROJECT_COLOR_PALETTE[project.color].color,
        color: PROJECT_COLOR_PALETTE[project.color].textColor,
      }}
    >
      {project.name.charAt(0).toUpperCase()}
    </span>
  );
}

const PAGE_SIZE = 10;
