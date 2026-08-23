import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { t } from 'i18next';
import { Plug, Unplug } from 'lucide-react';

import { ConfirmationDeleteDialog } from '@/components/custom/delete-dialog';
import { LoadingSpinner } from '@/components/custom/spinner';
import { TextWithTooltip } from '@/components/custom/text-with-tooltip';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { authenticationSession } from '@/lib/authentication-session';

import { mcpClientIdentity } from './mcp-client-identity';
import {
  McpClientGrantRow,
  mcpClientsMutations,
  mcpClientsQueries,
} from './mcp-clients-hooks';

dayjs.extend(relativeTime);

export function ConnectedClients() {
  const projectId = authenticationSession.getProjectId()!;
  const {
    rows,
    canSeeEveryone,
    isLoading,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = mcpClientsQueries.useClientsReachingProject();
  const revokeMine = mcpClientsMutations.useRevokeMine();
  const revokeForProject = mcpClientsMutations.useRevokeForProject(projectId);

  return (
    <div className="flex flex-col gap-5">
      <p className="text-base text-muted-foreground">
        {t(
          'Every grant that can reach this project. Grants scoped to all projects stay with their holder.',
        )}
      </p>

      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <LoadingSpinner />
        </div>
      )}

      {!isLoading && rows.length === 0 && (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed py-16 text-center">
          <Plug className="size-6 text-muted-foreground" />
          <p className="text-base text-muted-foreground">
            {t('Nothing is connected yet. Pick a client on the Connect tab.')}
          </p>
        </div>
      )}

      {!isLoading && rows.length > 0 && (
        <div className="divide-y rounded-xl border">
          {rows.map((row) => (
            <ClientRow
              key={row.id}
              row={row}
              showMember={canSeeEveryone}
              onRevoke={() =>
                row.isMine
                  ? revokeMine.mutateAsync([row.id])
                  : revokeForProject.mutateAsync([row.id])
              }
            />
          ))}
        </div>
      )}

      {hasNextPage && (
        <Button
          variant="ghost"
          size="sm"
          className="self-start"
          loading={isFetchingNextPage}
          onClick={fetchNextPage}
        >
          {t('Load more')}
        </Button>
      )}
    </div>
  );
}

function ClientRow({
  row,
  showMember,
  onRevoke,
}: {
  row: McpClientGrantRow;
  showMember: boolean;
  onRevoke: () => Promise<void>;
}) {
  const label = mcpClientIdentity.label(row.clientKey, row.clientName);
  const subtitle = [showMember ? memberName(row) : null, scopeLabel(row)]
    .filter(Boolean)
    .join(' · ');

  return (
    <div className="flex items-center gap-4 px-4 py-3.5">
      <div className="flex size-10 shrink-0 items-center justify-center rounded-lg border bg-background">
        <img
          src={mcpClientIdentity.icon(row.clientKey)}
          alt=""
          className="size-6"
        />
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <TextWithTooltip tooltipMessage={label}>
          <p className="truncate text-base font-semibold leading-tight">
            {label}
          </p>
        </TextWithTooltip>
        <span className="truncate text-sm text-muted-foreground">
          {subtitle}
        </span>
      </div>

      <ActivityStatus row={row} />

      <Tooltip>
        <TooltipTrigger asChild>
          <div>
            <ConfirmationDeleteDialog
              title={t('Revoke access')}
              message={t(
                'This ends the grant for {label}. Access ends within 15 minutes, and the client will ask to sign in again.',
                { label },
              )}
              entityName={label}
              buttonText={t('Revoke')}
              isDanger
              mutationFn={onRevoke}
            >
              <Button
                variant="ghost"
                size="icon"
                className="size-9 shrink-0 text-muted-foreground hover:text-destructive"
                aria-label={t('Revoke access')}
              >
                <Unplug className="size-4" />
              </Button>
            </ConfirmationDeleteDialog>
          </div>
        </TooltipTrigger>
        <TooltipContent>{t('Revoke access')}</TooltipContent>
      </Tooltip>
    </div>
  );
}

function ActivityStatus({ row }: { row: McpClientGrantRow }) {
  const at = dayjs(row.lastUsedAt ?? row.created);
  const isActive = at.isSame(dayjs(), 'day');

  if (isActive) {
    return (
      <div className="flex shrink-0 items-center gap-3">
        <Badge variant="success" className="gap-1.5">
          <span className="size-1.5 rounded-full bg-success-600" />
          {t('Active')}
        </Badge>
        <span className="hidden text-sm text-muted-foreground sm:inline">
          {at.fromNow()}
        </span>
      </div>
    );
  }

  return (
    <Badge variant="outline" className="shrink-0 font-normal">
      {t('Last used {time}', { time: at.fromNow() })}
    </Badge>
  );
}

function memberName(row: McpClientGrantRow): string {
  if (row.isMine) {
    return t('You');
  }
  if (!row.user) {
    return t('Unknown member');
  }
  return `${row.user.firstName} ${row.user.lastName}`.trim() || row.user.email;
}

function scopeLabel(row: McpClientGrantRow): string {
  return row.projectId === null ? t('All projects') : t('This project');
}
