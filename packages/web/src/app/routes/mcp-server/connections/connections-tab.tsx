import {
  McpOAuthClientKey,
  McpOAuthGrantFacets,
  PLATFORM_WIDE_GRANT_FILTER_VALUE,
} from '@activepieces/shared';
import { t } from 'i18next';
import { CheckIcon, FolderOpen, Plug, User } from 'lucide-react';
import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

import { DataTable, DataTableFilters } from '@/components/custom/data-table';
import { ConfirmationDeleteDialog } from '@/components/custom/delete-dialog';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/custom/empty';
import { Button } from '@/components/ui/button';
import { userHooks } from '@/hooks/user-hooks';

import { mcpClientBranding } from '../mcp-client-branding';
import { mcpGrantsMutations, mcpGrantsQueries } from '../mcp-grants-hooks';
import { useMcpNav } from '../mcp-nav';
import { PageContent } from '../page-content';

import { buildConnectionsColumns } from './connections-columns';

const DOCS_URL = 'https://www.activepieces.com/docs/mcp/overview';

export function ConnectionsTab() {
  const nav = useMcpNav();
  const [searchParams] = useSearchParams();
  const { data: currentUser } = userHooks.useCurrentUser();
  const request = useMemo(
    () => ({
      cursor: searchParams.get('cursor') ?? undefined,
      limit: Number(searchParams.get('limit')) || undefined,
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

  const { data, isLoading } = mcpGrantsQueries.useGrants(request);
  const revoke = mcpGrantsMutations.useRevoke();

  const facets = data?.facets;
  const columns = buildConnectionsColumns({
    currentUserId: currentUser?.id,
    onRevoke: async (ids) => {
      await revoke.mutateAsync(ids);
    },
  });

  if (!isLoading && !hasActiveFilters && (facets?.total ?? 0) === 0) {
    return (
      <PageContent className="px-6 py-8 lg:px-12">
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
            <Button className="mt-4" onClick={nav.showLanding}>
              {t('Set it up in your client')} →
            </Button>
          </EmptyHeader>
        </Empty>
      </PageContent>
    );
  }

  return (
    <PageContent className="flex flex-col gap-2 px-6 py-8 lg:px-12">
      <DataTable
        columns={columns}
        page={data}
        isLoading={isLoading}
        filters={buildFilters(facets)}
        selectColumn={true}
        bordered={true}
        toolbarButtons={[
          <span key="count" className="text-sm text-muted-foreground">
            {t('connectionsCount', { count: facets?.total ?? 0 })}
            {' · '}
            {t('each expires 30 days after sign-in')}
          </span>,
        ]}
        bulkActions={[
          {
            render: (rows, resetSelection) => (
              <ConfirmationDeleteDialog
                title={t('Revoke access')}
                message={t(
                  'Access ends within 15 minutes. The client will ask to sign in again.',
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
                  {t('revokeCount', { count: rows.length })}
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
    </PageContent>
  );
}

function undefinedIfEmpty<T>(values: T[]): T[] | undefined {
  return values.length === 0 ? undefined : values;
}

function isClientKey(value: string): value is McpOAuthClientKey {
  return McpOAuthClientKey.safeParse(value).success;
}

function buildFilters(
  facets: McpOAuthGrantFacets | undefined,
): DataTableFilters<string>[] {
  if (!facets) {
    return [];
  }

  const filters: DataTableFilters<string>[] = [];

  if (facets.byProject.length > 1) {
    filters.push({
      type: 'select',
      title: t('Project'),
      accessorKey: 'project',
      icon: FolderOpen,
      options: facets.byProject.map(({ projectId, projectName, count }) => ({
        label: projectName ?? t('All projects'),
        value: projectId ?? PLATFORM_WIDE_GRANT_FILTER_VALUE,
        count,
      })),
    });
  }

  if (facets.byMember.length > 1) {
    filters.push({
      type: 'select',
      title: t('Member'),
      accessorKey: 'member',
      icon: User,
      options: facets.byMember.map(({ member, count }) => ({
        label: `${member.firstName} ${member.lastName}`.trim() || member.email,
        value: member.id,
        count,
      })),
    });
  }

  filters.push({
    type: 'select',
    title: t('Client'),
    accessorKey: 'client',
    icon: CheckIcon,
    options: facets.byClient.map(({ clientKey, clientName, count }) => ({
      label: mcpClientBranding.label(clientKey, clientName),
      value: clientKey,
      icon: mcpClientBranding.icon(clientKey),
      count,
    })),
  });

  return filters;
}
