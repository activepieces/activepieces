import {
  PROJECT_COLOR_PALETTE,
  Project,
  ProjectType,
} from '@activepieces/shared';
import { ColumnDef } from '@tanstack/react-table';
import { t } from 'i18next';
import { FolderOpen, Search } from 'lucide-react';
import { useState } from 'react';

import { DataTable, RowDataWithActions } from '@/components/custom/data-table';
import { InputWithIcon } from '@/components/custom/input-with-icon';
import { Checkbox } from '@/components/ui/checkbox';

import { SelectedOnlyButton } from '../components/selected-only-button';
import { pageSlice, TablePagination } from '../components/table-pagination';

export function ProjectSelectionPanel({
  projects,
  selectedIds,
  onChange,
}: {
  projects: Project[];
  selectedIds: string[];
  onChange: (projectIds: string[]) => void;
}) {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [showSelectedOnly, setShowSelectedOnly] = useState(false);

  const filtered = projects
    .filter((project) =>
      project.displayName.toLowerCase().includes(search.trim().toLowerCase()),
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

  const columns: ColumnDef<RowDataWithActions<Project>>[] = [
    {
      accessorKey: 'name',
      header: () => (
        <div className="flex items-center gap-2.5">
          <Checkbox checked={allRowsSelected} onCheckedChange={toggleRows} />
          <span>{t('Project')}</span>
        </div>
      ),
      cell: ({ row }) => (
        <div className="flex items-center gap-2.5">
          <Checkbox
            checked={selectedIds.includes(row.original.id)}
            className="pointer-events-none"
          />
          <ProjectSwatch project={row.original} />
          <span className="text-sm font-medium">
            {row.original.displayName}
          </span>
          {row.original.type === ProjectType.PERSONAL && (
            <span className="rounded-full bg-muted px-1.5 py-px text-[10px] text-muted-foreground">
              {t('Personal')}
            </span>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-border/60">
      <div className="flex flex-wrap items-center gap-2 p-3">
        <InputWithIcon
          icon={<Search className="size-4 shrink-0 text-muted-foreground" />}
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(0);
          }}
          placeholder={t('Search {count} projects', { count: projects.length })}
          className="max-w-xs grow-0"
        />
        <SelectedOnlyButton
          pressed={showSelectedOnly}
          onToggle={() => {
            setShowSelectedOnly(!showSelectedOnly);
            setPage(0);
          }}
        />
      </div>
      <div className="border-t border-border/60 [&_tbody_tr:last-child]:border-b-0 [&_thead]:border-t-0">
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
      </div>
      <TablePagination
        page={currentPage}
        pageSize={PAGE_SIZE}
        total={filtered.length}
        onPageChange={setPage}
        className="border-t border-border/60 p-3"
      />
    </div>
  );
}

export function ProjectSwatch({ project }: { project: Project }) {
  const palette = project.icon?.color
    ? PROJECT_COLOR_PALETTE[project.icon.color]
    : undefined;
  return (
    <span
      className="flex size-5 shrink-0 items-center justify-center rounded-sm bg-muted text-[10px] font-medium"
      style={
        palette
          ? { backgroundColor: palette.color, color: palette.textColor }
          : undefined
      }
    >
      {project.displayName.charAt(0).toUpperCase()}
    </span>
  );
}

const PAGE_SIZE = 10;
