import { Template, TemplateStatus, TemplateType } from '@activepieces/shared';
import {
  Add01Icon,
  Archive02Icon,
  CheckmarkCircle02Icon,
  DashboardSquare01Icon,
  Delete02Icon,
  PencilEdit01Icon,
  PuzzleIcon,
} from '@hugeicons/core-free-icons';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';
import { t } from 'i18next';
import { useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import { AdminPageHeader } from '@/app/routes/platform/admin-page-header';
import { ConfirmDialog } from '@/components/custom/confirm-dialog';
import {
  BulkAction,
  DataTable,
  RowDataWithActions,
} from '@/components/custom/data-table';
import { DataTableColumnHeader } from '@/components/custom/data-table/data-table-column-header';
import { DataTableFilter } from '@/components/custom/data-table/data-table-filter';
import { HugeiconsIcon } from '@/components/custom/hugeicons-icon';
import {
  DateCell,
  MutedCell,
  NameCell,
  TagsCell,
} from '@/components/custom/list/list-cells';
import { ListSearch, ListToolbar } from '@/components/custom/list/list-toolbar';
import { RowMenu } from '@/components/custom/list/row-menu';
import { Page } from '@/components/custom/page';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { PieceIcon, piecesHooks } from '@/features/pieces';
import {
  templateKeys,
  templatesApi,
  templatesHooks,
  templatesMutations,
} from '@/features/templates';
import { platformHooks } from '@/hooks/platform-hooks';
import { useStableCallback } from '@/hooks/use-stable-callback';
import { AdminControl, adminControl } from '@/lib/admin-control';

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
    queryKey: [...templateKeys.platformCustom, search, category],
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
  const clearSelectionAfterDelete = useRef<(() => void) | null>(null);

  const bulkDeleteMutation = templatesMutations.useBulkDeleteTemplates();
  const { mutate: setStatus } = templatesMutations.useSetTemplateStatus();

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

  const setTemplateStatus = useStableCallback(
    ({
      template,
      nextStatus,
    }: {
      template: Template;
      nextStatus: TemplateStatus;
    }) =>
      setStatus({
        template,
        status: nextStatus,
        previousStatus: template.status,
      }),
  );

  const columns = useMemo(
    (): ColumnDef<RowDataWithActions<Template>>[] => [
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
        cell: ({ row }) => (
          <DateCell value={row.original.created} mode="short" />
        ),
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
                    icon: PencilEdit01Icon,
                    onSelect: () => setEditing(row.original),
                    control: AdminControl.TEMPLATES_EDIT_OPEN,
                  },
                  {
                    label: archived ? t('Publish') : t('Archive'),
                    icon: archived ? CheckmarkCircle02Icon : Archive02Icon,
                    control: archived
                      ? AdminControl.TEMPLATES_PUBLISH_RUN
                      : AdminControl.TEMPLATES_ARCHIVE_RUN,
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
                    icon: Delete02Icon,
                    destructive: true,
                    onSelect: () => setDeleting([row.original]),
                    control: AdminControl.TEMPLATES_DELETE_OPEN,
                  },
                ]}
              />
            </div>
          );
        },
      },
    ],
    [setTemplateStatus],
  );

  const bulkActions: BulkAction<Template>[] = [
    {
      render: (selectedRows, resetSelection) => (
        <Button
          {...adminControl(AdminControl.TEMPLATES_DELETE_OPEN)}
          variant="ghost"
          size="sm"
          className="text-danger-11 hover:text-danger-11"
          onClick={(e) => {
            e.stopPropagation();
            clearSelectionAfterDelete.current = resetSelection;
            setDeleting(selectedRows);
          }}
        >
          <HugeiconsIcon icon={Delete02Icon} />
          {t('Delete')}
        </Button>
      ),
    },
  ];

  const filtered = search !== '' || category !== '';
  const newTemplateButton = (
    <CreateTemplateDialog>
      <Button {...adminControl(AdminControl.TEMPLATES_NEW_OPEN)}>
        <HugeiconsIcon icon={Add01Icon} />
        {t('New template')}
      </Button>
    </CreateTemplateDialog>
  );

  return (
    <Page>
      <AdminPageHeader page="templates">{newTemplateButton}</AdminPageHeader>
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
        emptyStateIcon={<HugeiconsIcon icon={DashboardSquare01Icon} />}
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
          template={editing}
        />
      )}
      {deleting && (
        <ConfirmDialog
          open
          onOpenChange={(open) => {
            if (!open) {
              setDeleting(null);
              clearSelectionAfterDelete.current = null;
            }
          }}
          title={
            deleting.length === 1
              ? t('Delete {name}?', { name: deleting[0].name })
              : t('Delete {count} templates?', { count: deleting.length })
          }
          description={
            deleting.length === 1
              ? t(
                  'Builders can no longer start a flow from this template. Flows already created from it keep working.',
                )
              : t(
                  'Builders can no longer start a flow from these templates. Flows already created from them keep working.',
                )
          }
          confirmLabel={t('Delete')}
          controlId={AdminControl.TEMPLATES_DELETE_CONFIRM}
          errorTitle={
            deleting.length === 1
              ? t("Couldn't delete the template")
              : t("Couldn't delete the templates")
          }
          onConfirm={async () => {
            await bulkDeleteMutation.mutateAsync(deleting);
            clearSelectionAfterDelete.current?.();
          }}
        />
      )}
    </Page>
  );
};

function TemplatePieces({ names }: { names: string[] }) {
  const { summaries } = piecesHooks.usePieceSummariesByNames({
    names,
    skipProjectFilter: true,
  });
  const uniqueNames = [...new Set(names)];
  if (uniqueNames.length === 0) {
    return <MutedCell>{null}</MutedCell>;
  }
  const byName = new Map(summaries.map((piece) => [piece.name, piece]));
  const shown = uniqueNames.slice(0, MAX_PIECE_LOGOS);
  const rest = uniqueNames.length - shown.length;
  return (
    <div className="flex items-center gap-1">
      {shown.map((name) => {
        const piece = byName.get(name);
        return piece ? (
          <PieceIcon
            key={name}
            size="xs"
            border
            displayName={piece.displayName}
            logoUrl={piece.logoUrl}
            showTooltip
          />
        ) : (
          <Tooltip key={name}>
            <TooltipTrigger asChild>
              <span
                aria-label={pieceLabel(name)}
                className="flex size-6 shrink-0 items-center justify-center rounded-md border bg-gray-3 text-gray-11 [&_svg]:size-3.5"
              >
                <HugeiconsIcon icon={PuzzleIcon} />
              </span>
            </TooltipTrigger>
            <TooltipContent>
              {t('{name} (not installed)', { name: pieceLabel(name) })}
            </TooltipContent>
          </Tooltip>
        );
      })}
      {rest > 0 && (
        <span className="text-xs text-gray-11 tabular-nums">+{rest}</span>
      )}
    </div>
  );
}

function pieceLabel(name: string): string {
  return name.replace(/^@[^/]+\/piece-/, '').replace(/-/g, ' ');
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
