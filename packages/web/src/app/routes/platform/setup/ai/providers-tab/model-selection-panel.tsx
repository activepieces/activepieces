import { AIProviderModel } from '@activepieces/shared';
import { AiMagicIcon, Search01Icon } from '@hugeicons/core-free-icons';
import { ColumnDef } from '@tanstack/react-table';
import { t } from 'i18next';
import { useMemo, useState } from 'react';

import { DataTable, RowDataWithActions } from '@/components/custom/data-table';
import { HugeiconsIcon } from '@/components/custom/hugeicons-icon';
import { InputWithIcon } from '@/components/custom/input-with-icon';
import { Checkbox } from '@/components/ui/checkbox';
import { useStableCallback } from '@/hooks/use-stable-callback';

import { SelectedOnlyButton } from '../components/selected-only-button';
import { pageSlice, TablePagination } from '../components/table-pagination';

export function ModelSelectionPanel({
  models,
  selectedIds,
  isLoading,
  isError = false,
  onRetry,
  onChange,
}: {
  models: AIProviderModel[];
  selectedIds: string[];
  isLoading: boolean;
  isError?: boolean;
  onRetry?: () => void;
  onChange: (modelIds: string[]) => void;
}) {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [showSelectedOnly, setShowSelectedOnly] = useState(false);

  const filtered = models
    .filter((model) =>
      model.name.toLowerCase().includes(search.trim().toLowerCase()),
    )
    .filter((model) => !showSelectedOnly || selectedIds.includes(model.id));
  const { rows, page: currentPage } = pageSlice({
    items: filtered,
    page,
    pageSize: PAGE_SIZE,
  });
  const allRowsSelected =
    rows.length > 0 && rows.every((model) => selectedIds.includes(model.id));

  const toggleModel = useStableCallback((modelId: string) => {
    onChange(
      selectedIds.includes(modelId)
        ? selectedIds.filter((id) => id !== modelId)
        : [...selectedIds, modelId],
    );
  });
  const toggleRows = useStableCallback(() => {
    const rowIds = rows.map((model) => model.id);
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
    (): ColumnDef<RowDataWithActions<AIProviderModel>>[] => [
      {
        accessorKey: 'name',
        header: () => (
          <div className="flex items-center gap-2.5">
            <Checkbox
              aria-label={t('Select all models on this page')}
              checked={isPageSelected()}
              onCheckedChange={toggleRows}
            />
            <span>{t('Model')}</span>
          </div>
        ),
        cell: ({ row }) => (
          <div className="flex items-center gap-2.5">
            <Checkbox
              aria-label={t('Select {name}', { name: row.original.name })}
              checked={isSelected(row.original.id)}
              onClick={(event) => event.stopPropagation()}
              onCheckedChange={() => toggleModel(row.original.id)}
            />
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-medium">{row.original.name}</span>
              {row.original.id !== row.original.name && (
                <span className="font-mono text-xs text-gray-11">
                  {row.original.id}
                </span>
              )}
            </div>
          </div>
        ),
      },
    ],
    [isSelected, isPageSelected, toggleModel, toggleRows],
  );

  return (
    <div className="flex flex-col gap-3">
      <DataTable
        columns={columns}
        page={{ data: rows, next: null, previous: null }}
        isLoading={isLoading}
        isError={isError}
        errorStateEntity={t('models')}
        onRetry={onRetry}
        hidePagination={true}
        onRowClick={(row) => toggleModel(row.id)}
        emptyStateTextTitle={t('No models found')}
        emptyStateTextDescription={
          showSelectedOnly
            ? t('No model is selected yet.')
            : t('No model matches your search.')
        }
        emptyStateIcon={
          <HugeiconsIcon icon={AiMagicIcon} className="size-10 text-gray-11" />
        }
        customFilters={[
          <InputWithIcon
            key="search"
            icon={
              <HugeiconsIcon
                icon={Search01Icon}
                className="size-4 shrink-0 text-gray-11"
              />
            }
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(0);
            }}
            placeholder={t('Search models')}
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
      {!isError && (
        <TablePagination
          page={currentPage}
          pageSize={PAGE_SIZE}
          total={filtered.length}
          onPageChange={setPage}
        />
      )}
    </div>
  );
}

const PAGE_SIZE = 10;
