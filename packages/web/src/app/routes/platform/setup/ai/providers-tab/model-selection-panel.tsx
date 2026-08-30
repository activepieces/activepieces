import { AIProviderModel } from '@activepieces/shared';
import { ColumnDef } from '@tanstack/react-table';
import { t } from 'i18next';
import { Search, Sparkles } from 'lucide-react';
import { useState } from 'react';

import { DataTable, RowDataWithActions } from '@/components/custom/data-table';
import { InputWithIcon } from '@/components/custom/input-with-icon';
import { Checkbox } from '@/components/ui/checkbox';

import { SelectedOnlyButton } from '../components/selected-only-button';
import { pageSlice, TablePagination } from '../components/table-pagination';

export function ModelSelectionPanel({
  models,
  selectedIds,
  onChange,
}: {
  models: AIProviderModel[];
  selectedIds: string[];
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

  const toggleModel = (modelId: string) => {
    onChange(
      selectedIds.includes(modelId)
        ? selectedIds.filter((id) => id !== modelId)
        : [...selectedIds, modelId],
    );
  };
  const toggleRows = () => {
    const rowIds = rows.map((model) => model.id);
    onChange(
      allRowsSelected
        ? selectedIds.filter((id) => !rowIds.includes(id))
        : [...new Set([...selectedIds, ...rowIds])],
    );
  };

  const columns: ColumnDef<RowDataWithActions<AIProviderModel>>[] = [
    {
      accessorKey: 'name',
      header: () => (
        <div className="flex items-center gap-2.5">
          <Checkbox checked={allRowsSelected} onCheckedChange={toggleRows} />
          <span>{t('Model')}</span>
        </div>
      ),
      cell: ({ row }) => (
        <div className="flex items-center gap-2.5">
          <Checkbox
            checked={selectedIds.includes(row.original.id)}
            className="pointer-events-none"
          />
          <div className="flex flex-col gap-0.5">
            <span className="text-sm font-medium">{row.original.name}</span>
            {row.original.id !== row.original.name && (
              <span className="font-mono text-xs text-muted-foreground">
                {row.original.id}
              </span>
            )}
          </div>
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
          placeholder={t('Search models')}
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
          onRowClick={(row) => toggleModel(row.id)}
          emptyStateTextTitle={t('No models found')}
          emptyStateTextDescription={
            showSelectedOnly
              ? t('No model is selected yet.')
              : t('No model matches your search.')
          }
          emptyStateIcon={
            <Sparkles className="size-10 text-muted-foreground" />
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

const PAGE_SIZE = 10;
