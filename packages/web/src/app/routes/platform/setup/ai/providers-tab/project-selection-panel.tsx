import { Project, ProjectType } from '@activepieces/shared';
import { ColumnDef } from '@tanstack/react-table';
import { t } from 'i18next';
import { FolderOpen, Search } from 'lucide-react';
import { useMemo, useState } from 'react';

import { ProjectAvatar } from '@/app/routes/platform/infra/workers/project-avatar';
import { DataTable, RowDataWithActions } from '@/components/custom/data-table';
import { InputWithIcon } from '@/components/custom/input-with-icon';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { useStableCallback } from '@/hooks/use-stable-callback';

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

  const toggleProject = useStableCallback((projectId: string) => {
    onChange(
      selectedIds.includes(projectId)
        ? selectedIds.filter((id) => id !== projectId)
        : [...selectedIds, projectId],
    );
  });
  const toggleRows = useStableCallback(() => {
    const rowIds = rows.map((project) => project.id);
    onChange(
      allRowsSelected
        ? selectedIds.filter((id) => !rowIds.includes(id))
        : [...new Set([...selectedIds, ...rowIds])],
    );
  });

  const isSelected = useStableCallback((id: string) =>
    selectedIds.includes(id),
  );
  const isPageSelected = useStableCallback(() => allRowsSelected);

  const columns = useMemo(
    (): ColumnDef<RowDataWithActions<Project>>[] => [
      {
        accessorKey: 'name',
        header: () => (
          <div className="flex items-center gap-2.5">
            <Checkbox
              aria-label={t('Select all projects on this page')}
              checked={isPageSelected()}
              onCheckedChange={toggleRows}
            />
            <span>{t('Project')}</span>
          </div>
        ),
        cell: ({ row }) => (
          <div className="flex items-center gap-2.5">
            <Checkbox
              aria-label={t('Select {name}', {
                name: row.original.displayName,
              })}
              checked={isSelected(row.original.id)}
              onClick={(event) => event.stopPropagation()}
              onCheckedChange={() => toggleProject(row.original.id)}
            />
            <ProjectAvatar project={row.original} size="sm" />
            <span className="min-w-0 truncate text-sm font-medium">
              {row.original.displayName}
            </span>
            {row.original.type === ProjectType.PERSONAL && (
              <Badge variant="outline">{t('Personal')}</Badge>
            )}
          </div>
        ),
      },
    ],
    [isSelected, isPageSelected, toggleProject, toggleRows],
  );

  return (
    <div className="flex flex-col gap-3">
      <DataTable
        columns={columns}
        page={{ data: rows, next: null, previous: null }}
        isLoading={false}
        isError={false}
        errorStateEntity={t('projects')}
        hidePagination={true}
        onRowClick={(row) => toggleProject(row.id)}
        emptyStateTextTitle={t('No projects found')}
        emptyStateTextDescription={
          showSelectedOnly
            ? t('No project is selected yet.')
            : t('No project matches your search.')
        }
        emptyStateIcon={<FolderOpen className="size-10 text-gray-11" />}
        customFilters={[
          <InputWithIcon
            key="search"
            icon={<Search className="size-4 shrink-0 text-gray-11" />}
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(0);
            }}
            placeholder={t('Search {count} projects', {
              count: projects.length,
            })}
            className="max-w-xs grow-0"
          />,
          <SelectedOnlyButton
            key="selected-only"
            pressed={showSelectedOnly}
            onToggle={() => {
              setShowSelectedOnly(!showSelectedOnly);
              setPage(0);
            }}
          />,
        ]}
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

const PAGE_SIZE = 10;
