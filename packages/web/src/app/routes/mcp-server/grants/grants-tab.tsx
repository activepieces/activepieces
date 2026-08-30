import {
  McpOAuthClientKey,
  PLATFORM_WIDE_PROJECT_FILTER_VALUE,
} from '@activepieces/shared';
import { t } from 'i18next';
import { CheckIcon, FolderOpen, Plug, User } from 'lucide-react';
import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

import {
  CURSOR_QUERY_PARAM,
  DataTable,
  DataTableFilters,
  LIMIT_QUERY_PARAM,
} from '@/components/custom/data-table';
import { ConfirmationDeleteDialog } from '@/components/custom/delete-dialog';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/custom/empty';
import { Button } from '@/components/ui/button';
import { platformUserHooks } from '@/features/platform-admin/hooks/platform-user-hooks';
import { projectCollectionUtils } from '@/features/projects';
import { userHooks } from '@/hooks/user-hooks';

import { mcpClientDisplay } from '../mcp-client-display';
import { mcpGrantsMutations, mcpGrantsQueries } from '../mcp-grants-hooks';
import { useMcpNav } from '../mcp-nav';
import { PageBand } from '../page-band';

import { buildGrantsColumns } from './grants-columns';

const DOCS_URL = 'https://www.activepieces.com/docs/mcp/overview';
const DEFAULT_PAGE_SIZE = 10;

export function GrantsTab() {
  const nav = useMcpNav();
  const [searchParams] = useSearchParams();
  const { data: currentUser } = userHooks.useCurrentUser();
  const { data: projects = [] } = projectCollectionUtils.useAll();
  const { data: users } = platformUserHooks.useUsers();
  const request = useMemo(
    () => ({
      cursor: searchParams.get(CURSOR_QUERY_PARAM) ?? undefined,
      limit: Number(searchParams.get(LIMIT_QUERY_PARAM)) || DEFAULT_PAGE_SIZE,
      projectIds: undefinedIfEmpty(searchParams.getAll('project')),
      memberIds: undefinedIfEmpty(searchParams.getAll('member')),
      clientKeys: undefinedIfEmpty(
        searchParams.getAll('client').filter(isClientKey),
      ),
    }),
    [searchParams],
  );
  const hasActiveFilters =
    request.projectIds !== undefined ||
    request.memberIds !== undefined ||
    request.clientKeys !== undefined;

  const { data, isLoading, isError } = mcpGrantsQueries.useGrants({
    request,
    showErrorDialog: true,
  });
  const revoke = mcpGrantsMutations.useRevoke();

  const columns = buildGrantsColumns({
    currentUserId: currentUser?.id,
    onRevoke: async (ids) => {
      await revoke.mutateAsync(ids);
    },
  });

  if (
    !isLoading &&
    !isError &&
    !hasActiveFilters &&
    (data?.data.length ?? 0) === 0
  ) {
    return (
      <PageBand className="py-8">
        <Empty className="border border-dashed py-20">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Plug />
            </EmptyMedia>
            <EmptyTitle>{t('Nothing has connected yet')}</EmptyTitle>
            <EmptyDescription>
              {t(
                'When a client signs in with the link, it appears here with what it can reach.',
              )}
            </EmptyDescription>
            <Button className="mt-4" onClick={() => nav.showTab('connect')}>
              {t('Set it up in your client')} →
            </Button>
          </EmptyHeader>
        </Empty>
      </PageBand>
    );
  }

  return (
    <PageBand className="flex flex-col gap-2 py-8">
      <DataTable
        columns={columns}
        page={data}
        isLoading={isLoading}
        filters={buildFilters({ projects, members: users?.data ?? [] })}
        selectColumn={true}
        bordered={true}
        toolbarButtons={[
          <span key="expiry" className="text-sm text-muted-foreground">
            {t('each expires 30 days after sign-in')}
          </span>,
        ]}
        bulkActions={[
          {
            render: (rows, resetSelection) => (
              <ConfirmationDeleteDialog
                title={t('Revoke access')}
                message={t(
                  'Revoking {entityName}. Access ends within 15 minutes. The client will ask to sign in again.',
                  { entityName: t('revokedGrants', { count: rows.length }) },
                )}
                entityName={t('revokedGrants', { count: rows.length })}
                buttonText={t('Revoke')}
                isDanger
                showToast={false}
                mutationFn={async () => {
                  await revoke.mutateAsync(rows.map((row) => row.id));
                  resetSelection();
                }}
              >
                <Button variant="destructive" size="sm">
                  {t('revokeSelectedCount', { count: rows.length })}
                </Button>
              </ConfirmationDeleteDialog>
            ),
          },
        ]}
        emptyStateTextTitle={t('No connections match these filters')}
        emptyStateTextDescription={t('Clear a filter to see more.')}
        emptyStateIcon={<Plug className="size-10" />}
      />

      <div className="flex flex-wrap items-center justify-between gap-4 text-[13px] text-muted-foreground">
        <span>
          {t(
            'Two rows for one client is normal — signing in again creates a second connection. Revoking one leaves the other alive.',
          )}
        </span>
        <a
          href={DOCS_URL}
          target="_blank"
          rel="noreferrer"
          className="font-semibold text-primary hover:underline"
        >
          {t('How connecting works')} ↗
        </a>
      </div>
    </PageBand>
  );
}

function undefinedIfEmpty<T>(values: T[]): T[] | undefined {
  return values.length === 0 ? undefined : values;
}

function isClientKey(value: string): value is McpOAuthClientKey {
  return McpOAuthClientKey.safeParse(value).success;
}

function buildFilters({
  projects,
  members,
}: {
  projects: { id: string; displayName: string }[];
  members: { id: string; email: string; firstName: string; lastName: string }[];
}): DataTableFilters<string>[] {
  const filters: DataTableFilters<string>[] = [];

  if (projects.length > 1) {
    filters.push({
      type: 'select',
      title: t('Project'),
      accessorKey: 'project',
      icon: FolderOpen,
      options: [
        ...projects.map((project) => ({
          label: project.displayName,
          value: project.id,
        })),
        {
          label: t('All projects'),
          value: PLATFORM_WIDE_PROJECT_FILTER_VALUE,
        },
      ],
    });
  }

  if (members.length > 1) {
    filters.push({
      type: 'select',
      title: t('Member'),
      accessorKey: 'member',
      icon: User,
      options: members.map((member) => ({
        label: `${member.firstName} ${member.lastName}`.trim() || member.email,
        value: member.id,
      })),
    });
  }

  filters.push({
    type: 'select',
    title: t('Client'),
    accessorKey: 'client',
    icon: CheckIcon,
    options: McpOAuthClientKey.options.map((clientKey) => ({
      label: mcpClientDisplay.label({ key: clientKey, clientName: null }),
      value: clientKey,
      icon: mcpClientDisplay.icon(clientKey),
    })),
  });

  return filters;
}
