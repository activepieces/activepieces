import { Permission, SeekPage } from '@activepieces/core-utils';
import { McpOAuthClientRow } from '@activepieces/shared';
import { InfiniteData, UseInfiniteQueryResult } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { t } from 'i18next';
import { Plug } from 'lucide-react';

import { ConfirmationDeleteDialog } from '@/components/custom/delete-dialog';
import { LoadingSpinner } from '@/components/custom/spinner';
import { TextWithTooltip } from '@/components/custom/text-with-tooltip';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuthorization } from '@/hooks/authorization-hooks';
import { authenticationSession } from '@/lib/authentication-session';

import { mcpClientIdentity } from './mcp-client-identity';
import { mcpClientsMutations, mcpClientsQueries } from './mcp-clients-hooks';

export function ConnectedClients() {
  const projectId = authenticationSession.getProjectId()!;
  const { checkAccess } = useAuthorization();
  const canSeeEveryone = checkAccess(Permission.WRITE_MCP);

  const mine = mcpClientsQueries.useMyClients();
  const project = mcpClientsQueries.useProjectClients({
    projectId,
    enabled: canSeeEveryone,
  });
  const revokeMine = mcpClientsMutations.useRevokeMine();
  const revokeForProject = mcpClientsMutations.useRevokeForProject(projectId);

  return (
    <div className="flex flex-col gap-8">
      <ClientList
        title={t('Your connected clients')}
        description={t(
          'Every client you signed in from, and what it can reach.',
        )}
        query={mine}
        showOwner={false}
        onRevoke={(id) => revokeMine.mutateAsync([id])}
      />
      {canSeeEveryone && (
        <ClientList
          title={t('Connected clients in this project')}
          description={t(
            'Every grant a member holds scoped to this project. Grants that span all projects stay with their holder.',
          )}
          query={project}
          showOwner={true}
          onRevoke={(id) => revokeForProject.mutateAsync([id])}
        />
      )}
    </div>
  );
}

function ClientList({
  title,
  description,
  query,
  showOwner,
  onRevoke,
}: ClientListProps) {
  const rows = query.data?.pages.flatMap((page) => page.data) ?? [];
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-col gap-0.5">
        <h2 className="text-sm font-medium">{title}</h2>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <div className="rounded-md border divide-y">
        {query.isLoading && (
          <div className="flex items-center justify-center py-10">
            <LoadingSpinner />
          </div>
        )}
        {!query.isLoading && rows.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-10 text-center">
            <Plug className="size-6 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              {t('Nothing is connected yet. Use a card above to connect one.')}
            </p>
          </div>
        )}
        {rows.map((row) => (
          <ClientRow
            key={row.id}
            row={row}
            showOwner={showOwner}
            onRevoke={onRevoke}
          />
        ))}
      </div>
      {query.hasNextPage && (
        <Button
          variant="ghost"
          size="sm"
          className="self-start"
          loading={query.isFetchingNextPage}
          onClick={() => query.fetchNextPage()}
        >
          {t('Load more')}
        </Button>
      )}
    </div>
  );
}

function ClientRow({
  row,
  showOwner,
  onRevoke,
}: {
  row: McpOAuthClientRow;
  showOwner: boolean;
  onRevoke: (id: string) => Promise<void>;
}) {
  const label = mcpClientIdentity.label(row.clientKey, row.clientName);
  const owner = row.user
    ? `${row.user.firstName} ${row.user.lastName}`.trim() || row.user.email
    : null;

  return (
    <div className="flex items-center gap-3 px-3 py-2.5">
      <img
        src={mcpClientIdentity.icon(row.clientKey)}
        alt=""
        className="size-5 shrink-0"
      />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <div className="flex items-center gap-2 min-w-0">
          <TextWithTooltip tooltipMessage={label}>
            <span className="truncate text-sm font-medium">{label}</span>
          </TextWithTooltip>
          <Badge variant="outline" className="shrink-0">
            {row.connectsFrom === 'local' ? t('Local') : t('Remote')}
          </Badge>
        </div>
        <span className="truncate text-xs text-muted-foreground">
          {row.projectName ?? t('All projects')}
          {showOwner && owner ? ` · ${owner}` : ''} · {lastSeen(row)}
        </span>
      </div>
      <ConfirmationDeleteDialog
        title={t('Revoke access')}
        message={t(
          'This ends the grant for {label}. Access ends within 15 minutes, and the client will ask to sign in again.',
          { label },
        )}
        entityName={label}
        buttonText={t('Revoke')}
        isDanger
        mutationFn={() => onRevoke(row.id)}
      >
        <Button variant="ghost" size="sm" className="shrink-0">
          {t('Revoke')}
        </Button>
      </ConfirmationDeleteDialog>
    </div>
  );
}

function lastSeen(row: McpOAuthClientRow): string {
  const at = dayjs(row.lastUsedAt ?? row.created);
  if (at.isSame(dayjs(), 'day')) {
    return t('Active today');
  }
  return t('Last used {date}', { date: at.format('MMM D') });
}

type ClientListProps = {
  title: string;
  description: string;
  query: UseInfiniteQueryResult<InfiniteData<SeekPage<McpOAuthClientRow>>>;
  showOwner: boolean;
  onRevoke: (id: string) => Promise<void>;
};
