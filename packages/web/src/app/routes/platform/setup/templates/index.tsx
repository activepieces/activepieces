import { Template, TemplateStatus, TemplateType } from '@activepieces/shared';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';
import { t } from 'i18next';
import {
  Archive,
  CheckCircle2,
  LayoutGrid,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';

import { ConfirmDialog } from '@/components/custom/confirm-dialog';
import {
  BulkAction,
  DataTable,
  RowDataWithActions,
} from '@/components/custom/data-table';
import { DataTableColumnHeader } from '@/components/custom/data-table/data-table-column-header';
import { DataTableFilter } from '@/components/custom/data-table/data-table-filter';
import {
  DateCell,
  MutedCell,
  NameCell,
  TagsCell,
} from '@/components/custom/list/list-cells';
import { ListSearch, ListToolbar } from '@/components/custom/list/list-toolbar';
import { RowMenu } from '@/components/custom/list/row-menu';
import { Page, PageHeader } from '@/components/custom/page';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PieceIcon, piecesHooks } from '@/features/pieces';
import {
  templatesApi,
  templatesHooks,
  templatesMutations,
} from '@/features/templates';
import { platformHooks } from '@/hooks/platform-hooks';

import { sampleData } from '../../sample-data';

import { CreateTemplateDialog } from './create-template-dialog';
import { UpdateTemplateDialog } from './update-template-dialog';

const PlatformTemplatesPage = () => {
  const { platform } = platformHooks.useCurrentPlatform();
  const isSample = !platform.plan.manageTemplatesEnabled;
  const [searchParams] = useSearchParams();
  const search = searchParams.get(SEARCH_PARAM)?.trim() ?? '';
  const category = searchParams.get(CATEGORY_PARAM) ?? '';
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['templates', 'platform-custom', search, category],
    staleTime: 0,
    placeholderData: keepPreviousData,
    queryFn: () =>
      templatesApi.list({
        type: TemplateType.CUSTOM,
        search: search === '' ? undefined : search,
        category: category === '' ? undefined : category,
      }),
    enabled: platform.plan.manageTemplatesEnabled,
  });
  const { data: knownCategories } = templatesHooks.useTemplateCategories();
  const [editing, setEditing] = useState<Template | null>(null);
  const [deleting, setDeleting] = useState<Template[] | null>(null);

  const bulkDeleteMutation = templatesMutations.useBulkDeleteTemplates({
    onSuccess: () => {
      refetch();
      toast.success(t('Templates deleted successfully'), { duration: 3000 });
    },
  });
  const { mutate: updateStatus } = templatesMutations.useUpdateTemplate({
    onDone: () => refetch(),
  });

  const templates = useMemo(
    () => (isSample ? sampleTemplates({ search, category }) : data?.data ?? []),
    [isSample, data, search, category],
  );
  const categoryOptions = useMemo(
    () =>
      Array.from(
        new Set([
          ...(knownCategories ?? []),
          ...templates.flatMap((template) => template.categories),
          ...(category === '' ? [] : [category]),
        ]),
      )
        .sort((a, b) => a.localeCompare(b))
        .map((value) => ({ label: value, value })),
    [knownCategories, templates, category],
  );

  const setTemplateStatus = ({
    template,
    nextStatus,
  }: {
    template: Template;
    nextStatus: TemplateStatus;
  }) =>
    updateStatus({
      templateId: template.id,
      request: { status: nextStatus, metadata: template.metadata },
    });

  const columns: ColumnDef<RowDataWithActions<Template>>[] = [
    {
      accessorKey: 'name',
      size: 360,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('Template')} />
      ),
      cell: ({ row }) => (
        <NameCell
          stacked
          title={row.original.name}
          badge={
            row.original.status === TemplateStatus.ARCHIVED ? (
              <Badge variant="outline">{t('Archived')}</Badge>
            ) : undefined
          }
          sub={row.original.summary}
        />
      ),
    },
    {
      id: 'pieces',
      size: 136,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('Pieces')} />
      ),
      cell: ({ row }) => <TemplatePieces names={row.original.pieces} />,
    },
    {
      id: 'categories',
      size: 220,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('Categories')} />
      ),
      cell: ({ row }) => <TagsCell tags={row.original.categories} />,
    },
    {
      accessorKey: 'author',
      size: 160,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('Author')} />
      ),
      cell: ({ row }) => <MutedCell>{row.original.author}</MutedCell>,
    },
    {
      accessorKey: 'created',
      size: 112,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('Created')} />
      ),
      cell: ({ row }) => <DateCell value={row.original.created} mode="short" />,
    },
    {
      accessorKey: 'updated',
      size: 132,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('Updated')} />
      ),
      cell: ({ row }) => <DateCell value={row.original.updated} />,
    },
    {
      id: 'actions',
      size: 56,
      cell: ({ row }) => {
        const archived = row.original.status === TemplateStatus.ARCHIVED;
        return (
          <div className="flex justify-end">
            <RowMenu
              items={[
                {
                  label: t('Edit'),
                  icon: Pencil,
                  onSelect: () => setEditing(row.original),
                },
                {
                  label: archived ? t('Publish') : t('Archive'),
                  icon: archived ? CheckCircle2 : Archive,
                  onSelect: () =>
                    setTemplateStatus({
                      template: row.original,
                      nextStatus: archived
                        ? TemplateStatus.PUBLISHED
                        : TemplateStatus.ARCHIVED,
                    }),
                },
                {
                  label: t('Delete'),
                  icon: Trash2,
                  destructive: true,
                  onSelect: () => setDeleting([row.original]),
                },
              ]}
            />
          </div>
        );
      },
    },
  ];

  const bulkActions: BulkAction<Template>[] = [
    {
      render: (selectedRows, resetSelection) => (
        <Button
          variant="ghost"
          size="sm"
          className="text-danger-11 hover:text-danger-11"
          onClick={(e) => {
            e.stopPropagation();
            setDeleting(selectedRows);
            resetSelection();
          }}
        >
          <Trash2 />
          {t('Delete')}
        </Button>
      ),
    },
  ];

  const filtered = search !== '' || category !== '';
  const newTemplateButton = (
    <CreateTemplateDialog onDone={() => refetch()}>
      <Button>
        <Plus />
        {t('New template')}
      </Button>
    </CreateTemplateDialog>
  );

  return (
    <Page>
      <PageHeader
        title={t('Templates')}
        description={t(
          'Flows your teams keep rebuilding, published as one-click starting points for everyone.',
        )}
      >
        {newTemplateButton}
      </PageHeader>
      <ListToolbar
        search={
          <ListSearch
            param={SEARCH_PARAM}
            placeholder={t('Search templates')}
          />
        }
        filters={
          <DataTableFilter
            type="select"
            single
            title={t('Category')}
            accessorKey={CATEGORY_PARAM}
            options={categoryOptions}
          />
        }
      />
      <DataTable
        emptyStateTextTitle={
          filtered ? t('No template matches') : t('No templates yet')
        }
        emptyStateTextDescription={
          filtered
            ? t('Try a different search or clear a filter.')
            : t(
                'Publish a flow your teams keep rebuilding so anyone can start from it instead of a blank canvas.',
              )
        }
        emptyStateIcon={<LayoutGrid />}
        emptyStateAction={filtered ? undefined : newTemplateButton}
        columns={columns}
        page={{ data: templates, next: null, previous: null }}
        onRowClick={(row) => setEditing(row)}
        hidePagination={true}
        isLoading={isLoading && !isSample}
        isError={isError && !isSample}
        errorStateEntity={t('templates')}
        onRetry={refetch}
        selectColumn={true}
        bulkActions={bulkActions}
      />
      {editing && (
        <UpdateTemplateDialog
          open
          onOpenChange={(open) => !open && setEditing(null)}
          onDone={() => refetch()}
          template={editing}
        />
      )}
      {deleting && (
        <ConfirmDialog
          open
          onOpenChange={(open) => !open && setDeleting(null)}
          title={
            deleting.length === 1
              ? t('Delete {name}?', { name: deleting[0].name })
              : t('Delete {count} templates?', { count: deleting.length })
          }
          description={t(
            'Builders can no longer start a flow from these templates. Flows already created from them keep working.',
          )}
          confirmLabel={t('Delete')}
          onConfirm={async () => {
            await bulkDeleteMutation.mutateAsync(
              deleting.map((template) => template.id),
            );
          }}
        />
      )}
    </Page>
  );
};

function TemplatePieces({ names }: { names: string[] }) {
  const { summaries } = piecesHooks.usePieceSummariesByNames({ names });
  if (summaries.length === 0) {
    return <MutedCell>{null}</MutedCell>;
  }
  const shown = summaries.slice(0, MAX_PIECE_LOGOS);
  const rest = summaries.length - shown.length;
  return (
    <div className="flex items-center gap-1">
      {shown.map((piece) => (
        <PieceIcon
          key={piece.name}
          size="xs"
          border
          displayName={piece.displayName}
          logoUrl={piece.logoUrl}
          showTooltip
        />
      ))}
      {rest > 0 && (
        <span className="text-xs text-gray-11 tabular-nums">+{rest}</span>
      )}
    </div>
  );
}

function sampleTemplates({
  search,
  category,
}: {
  search: string;
  category: string;
}): Template[] {
  const query = search.toLowerCase();
  return sampleData
    .templatesPage()
    .data.filter(
      (template) =>
        (category === '' || template.categories.includes(category)) &&
        (query === '' ||
          template.name.toLowerCase().includes(query) ||
          template.summary.toLowerCase().includes(query)),
    );
}

const SEARCH_PARAM = 'search';
const CATEGORY_PARAM = 'category';
const MAX_PIECE_LOGOS = 3;

export { PlatformTemplatesPage };
