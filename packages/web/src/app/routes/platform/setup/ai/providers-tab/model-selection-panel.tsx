import { ColumnDef } from '@tanstack/react-table';
import { t } from 'i18next';
import { ExternalLink, Search, Sparkles } from 'lucide-react';
import { useState } from 'react';

import { DataTable, RowDataWithActions } from '@/components/custom/data-table';
import { DataTableColumnHeader } from '@/components/custom/data-table/data-table-column-header';
import { InputWithIcon } from '@/components/custom/input-with-icon';
import { Checkbox } from '@/components/ui/checkbox';
import { Toggle } from '@/components/ui/toggle';

import { pageSlice, TablePagination } from '../components/table-pagination';
import { ModelFacts } from '../mock/fixtures';

export function ModelSelectionPanel({
  models,
  selectedIds,
  onChange,
}: {
  models: ModelFacts[];
  selectedIds: string[];
  onChange: (modelIds: string[]) => void;
}) {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [activeCapabilities, setActiveCapabilities] = useState<CapabilityKey[]>(
    [],
  );

  const filtered = models.filter((model) => {
    const matchesSearch = model.name
      .toLowerCase()
      .includes(search.trim().toLowerCase());
    const matchesCapabilities = activeCapabilities.every(
      (capability) => model[capability],
    );
    return matchesSearch && matchesCapabilities;
  });
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

  const columns: ColumnDef<RowDataWithActions<ModelFacts>>[] = [
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
        <DataTableColumnHeader column={column} title={t('Model')} />
      ),
      cell: ({ row }) => (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-sm font-medium">{row.original.name}</span>
          {CAPABILITY_FILTERS.filter((filter) => row.original[filter.key]).map(
            (filter) => (
              <span
                key={filter.key}
                className="rounded-full bg-muted px-1.5 py-px text-[10px] text-muted-foreground"
              >
                {filter.label}
              </span>
            ),
          )}
        </div>
      ),
    },
    {
      accessorKey: 'contextWindow',
      size: 100,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('Context')} />
      ),
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground tabular-nums">
          {formatContext(row.original.contextWindow)}
        </span>
      ),
    },
    {
      accessorKey: 'cost',
      size: 120,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('Cost / 1M')} />
      ),
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground tabular-nums">
          ${row.original.cost.input}/${row.original.cost.output}
        </span>
      ),
    },
    {
      accessorKey: 'speed',
      size: 90,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('Speed')} />
      ),
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {SPEED_LABELS[row.original.speed]}
        </span>
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
          placeholder={t('Search models')}
          className="min-w-52 flex-1"
        />
        {CAPABILITY_FILTERS.map((filter) => (
          <Toggle
            key={filter.key}
            variant="outline"
            size="sm"
            pressed={activeCapabilities.includes(filter.key)}
            onPressedChange={() => {
              setActiveCapabilities((current) =>
                current.includes(filter.key)
                  ? current.filter((entry) => entry !== filter.key)
                  : [...current, filter.key],
              );
              setPage(0);
            }}
          >
            {filter.label}
          </Toggle>
        ))}
      </div>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span className="tabular-nums">
          {t('{selected} of {total} selected', {
            selected: selectedIds.length,
            total: models.length,
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
        onRowClick={(row) => toggleModel(row.id)}
        emptyStateTextTitle={t('No models found')}
        emptyStateTextDescription={t('No model matches your filters.')}
        emptyStateIcon={<Sparkles className="size-10 text-muted-foreground" />}
        actions={[
          (row) => (
            <a
              href={row.detailsUrl}
              target="_blank"
              rel="noreferrer"
              onClick={(event) => event.stopPropagation()}
              className="rounded-md p-1 text-muted-foreground transition-colors hover:text-foreground"
            >
              <ExternalLink className="size-3.5" />
            </a>
          ),
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

function formatContext(contextWindow: number): string {
  return contextWindow >= 1_000_000
    ? `${contextWindow / 1_000_000}M`
    : `${Math.round(contextWindow / 1_000)}K`;
}

const PAGE_SIZE = 10;

const CAPABILITY_FILTERS: { key: CapabilityKey; label: string }[] = [
  { key: 'vision', label: t('Vision') },
  { key: 'imageGeneration', label: t('Images') },
  { key: 'embeddings', label: t('Embeddings') },
];

const SPEED_LABELS: Record<ModelFacts['speed'], string> = {
  fast: t('Fast'),
  medium: t('Medium'),
  slow: t('Slow'),
};

type CapabilityKey = 'vision' | 'imageGeneration' | 'embeddings';
