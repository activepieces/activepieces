import { Template, TemplateStatus, TemplateType } from '@activepieces/shared';
import { useQuery } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';
import { t } from 'i18next';
import {
  Archive,
  CheckCircle2,
  LayoutGrid,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

import { ConfirmDialog } from '@/components/custom/confirm-dialog';
import {
  BulkAction,
  DataTable,
  RowDataWithActions,
} from '@/components/custom/data-table';
import { DataTableColumnHeader } from '@/components/custom/data-table/data-table-column-header';
import { DataTableSelectPopover } from '@/components/custom/data-table/data-table-select-popover';
import { Page, PageHeader, Toolbar } from '@/components/custom/page';
import { SearchInput } from '@/components/custom/search-input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PieceIcon, piecesHooks } from '@/features/pieces';
import { templatesApi, templatesMutations } from '@/features/templates';
import { platformHooks } from '@/hooks/platform-hooks';
import { formatUtils } from '@/lib/format-utils';

import { sampleData } from '../../sample-data';

import { CreateTemplateDialog } from './create-template-dialog';
import { UpdateTemplateDialog } from './update-template-dialog';

const PlatformTemplatesPage = () => {
  const { platform } = platformHooks.useCurrentPlatform();
  const isSample = !platform.plan.manageTemplatesEnabled;
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['templates', 'platform-custom'],
    staleTime: 0,
    queryFn: () => templatesApi.list({ type: TemplateType.CUSTOM }),
  });
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [categories, setCategories] = useState<string[]>([]);
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
    () => (isSample ? sampleData.templatesPage().data : data?.data ?? []),
    [isSample, data],
  );
  const publishedCount = templates.filter(
    (template) => template.status === TemplateStatus.PUBLISHED,
  ).length;
  const archivedCount = templates.length - publishedCount;
  const allCategories = useMemo(
    () =>
      Array.from(new Set(templates.flatMap((template) => template.categories)))
        .sort()
        .map((category) => ({ label: category, value: category })),
    [templates],
  );
  const visibleTemplates = useMemo(() => {
    const query = search.trim().toLowerCase();
    return templates.filter(
      (template) =>
        (status === 'all' ||
          (status === 'published') ===
            (template.status === TemplateStatus.PUBLISHED)) &&
        (categories.length === 0 ||
          template.categories.some((category) =>
            categories.includes(category),
          )) &&
        (query === '' ||
          template.name.toLowerCase().includes(query) ||
          template.summary.toLowerCase().includes(query)),
    );
  }, [templates, search, status, categories]);

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
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('Template')} />
      ),
      cell: ({ row }) => (
        <div className="flex min-w-0 flex-col gap-0.5">
          <div className="flex min-w-0 items-center gap-2">
            <span className="truncate font-medium text-gray-12">
              {row.original.name}
            </span>
            {row.original.status === TemplateStatus.ARCHIVED && (
              <Badge variant="outline">{t('Archived')}</Badge>
            )}
          </div>
          <span className="truncate text-xs text-gray-11">
            {row.original.summary || '—'}
          </span>
        </div>
      ),
    },
    {
      id: 'pieces',
      size: 128,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('Pieces')} />
      ),
      cell: ({ row }) => <TemplatePieces names={row.original.pieces} />,
    },
    {
      id: 'categories',
      size: 200,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('Categories')} />
      ),
      cell: ({ row }) =>
        row.original.categories.length === 0 ? (
          <span className="text-gray-11">—</span>
        ) : (
          <div className="flex min-w-0 items-center gap-1">
            {row.original.categories.slice(0, 2).map((category) => (
              <Badge key={category} variant="outline">
                {category}
              </Badge>
            ))}
            {row.original.categories.length > 2 && (
              <span className="text-xs text-gray-11 tabular-nums">
                +{row.original.categories.length - 2}
              </span>
            )}
          </div>
        ),
    },
    {
      accessorKey: 'author',
      size: 180,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('Author')} />
      ),
      cell: ({ row }) => (
        <span className="block truncate text-gray-11">
          {row.original.author || '—'}
        </span>
      ),
    },
    {
      accessorKey: 'updated',
      size: 120,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('Updated')} />
      ),
      cell: ({ row }) => (
        <span className="text-gray-11 tabular-nums">
          {formatUtils.formatDate(new Date(row.original.updated))}
        </span>
      ),
    },
    {
      id: 'actions',
      size: 56,
      cell: ({ row }) => (
        <div className="flex justify-end">
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={t('More actions')}
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              onClick={(e) => e.stopPropagation()}
            >
              <DropdownMenuItem onSelect={() => setEditing(row.original)}>
                <Pencil />
                {t('Edit')}
              </DropdownMenuItem>
              {row.original.status === TemplateStatus.ARCHIVED ? (
                <DropdownMenuItem
                  onSelect={() =>
                    setTemplateStatus({
                      template: row.original,
                      nextStatus: TemplateStatus.PUBLISHED,
                    })
                  }
                >
                  <CheckCircle2 />
                  {t('Publish')}
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem
                  onSelect={() =>
                    setTemplateStatus({
                      template: row.original,
                      nextStatus: TemplateStatus.ARCHIVED,
                    })
                  }
                >
                  <Archive />
                  {t('Archive')}
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onSelect={() => setDeleting([row.original])}
              >
                <Trash2 />
                {t('Delete template')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
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

  return (
    <Page>
      <PageHeader
        title={t('Templates')}
        description={t(
          'Flows your teams keep rebuilding, published as one-click starting points for everyone.',
        )}
      >
        <CreateTemplateDialog onDone={() => refetch()}>
          <Button>
            <Plus />
            {t('New template')}
          </Button>
        </CreateTemplateDialog>
      </PageHeader>
      <Toolbar>
        <div className="w-full max-w-sm">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder={t('Search by name or summary')}
          />
        </div>
        <Tabs
          value={status}
          onValueChange={(value) => setStatus(toStatusFilter(value))}
        >
          <TabsList>
            <TabsTrigger value="all">
              {t('All')}
              <span className="text-gray-11 tabular-nums">
                {templates.length}
              </span>
            </TabsTrigger>
            <TabsTrigger value="published">
              {t('Published')}
              <span className="text-gray-11 tabular-nums">
                {publishedCount}
              </span>
            </TabsTrigger>
            <TabsTrigger value="archived">
              {t('Archived')}
              <span className="text-gray-11 tabular-nums">{archivedCount}</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>
        {allCategories.length > 0 && (
          <DataTableSelectPopover
            title={t('Category')}
            selectedValues={new Set(categories)}
            options={allCategories}
            handleFilterChange={setCategories}
          />
        )}
      </Toolbar>
      <DataTable
        emptyStateTextTitle={
          templates.length === 0
            ? t('No templates yet')
            : t('No template matches')
        }
        emptyStateTextDescription={
          templates.length === 0
            ? t(
                'Publish a flow your teams keep rebuilding so anyone can start from it instead of a blank canvas.',
              )
            : t('Try a different search or clear a filter.')
        }
        emptyStateIcon={<LayoutGrid className="size-6 text-gray-9" />}
        columns={columns}
        page={{ data: visibleTemplates, next: null, previous: null }}
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
    return <span className="text-gray-11">—</span>;
  }
  return (
    <div className="flex items-center gap-1">
      {summaries.slice(0, 3).map((piece) => (
        <PieceIcon
          key={piece.name}
          size="xs"
          border
          displayName={piece.displayName}
          logoUrl={piece.logoUrl}
          showTooltip
        />
      ))}
      {summaries.length > 3 && (
        <span className="text-xs text-gray-11 tabular-nums">
          +{summaries.length - 3}
        </span>
      )}
    </div>
  );
}

function toStatusFilter(value: string): StatusFilter {
  return value === 'published' || value === 'archived' ? value : 'all';
}

export { PlatformTemplatesPage };

type StatusFilter = 'all' | 'published' | 'archived';
