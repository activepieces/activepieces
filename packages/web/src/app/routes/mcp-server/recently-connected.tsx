import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { t } from 'i18next';
import { Plug } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

import { ClientIcon } from './connect-steps';
import { mcpClientIdentity } from './mcp-client-identity';
import { McpClientGrantRow, mcpClientsQueries } from './mcp-clients-hooks';

dayjs.extend(relativeTime);

const MAX_SHOWN = 3;

export function RecentlyConnected({
  onManageConnections,
  onPickClient,
}: {
  onManageConnections: () => void;
  onPickClient: () => void;
}) {
  const { rows, isLoading } = mcpClientsQueries.useClientsReachingProject();

  if (isLoading) {
    return null;
  }

  const recent = [...rows]
    .sort((a, b) =>
      dayjs(b.lastUsedAt ?? b.created).diff(dayjs(a.lastUsedAt ?? a.created)),
    )
    .slice(0, MAX_SHOWN);

  return (
    <div className="flex flex-wrap items-center gap-4 border-t px-6 py-5 lg:px-14">
      <span className="shrink-0 text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
        {t('Recently connected')}
      </span>

      {recent.length === 0 ? (
        <>
          <span className="flex items-center gap-2.5 text-[13px] text-muted-foreground">
            <Plug className="size-4" />
            {t('No clients yet — the first one to use the link shows up here.')}
          </span>
          <Button
            variant="link"
            className="ml-auto h-auto p-0 text-[13px] font-semibold"
            onClick={onPickClient}
          >
            {t('Pick a client')}
          </Button>
        </>
      ) : (
        <>
          {recent.map((row, index) => (
            <div key={row.id} className="flex items-center gap-4">
              {index > 0 && <span className="h-4 w-px bg-border" />}
              <ClientChip row={row} />
            </div>
          ))}
          <Button
            variant="link"
            className="ml-auto h-auto p-0 text-[13px] font-semibold"
            onClick={onManageConnections}
          >
            {t('Manage connections')}
          </Button>
        </>
      )}
    </div>
  );
}

function ClientChip({ row }: { row: McpClientGrantRow }) {
  return (
    <span className="flex items-center gap-2">
      <ClientIcon
        icon={mcpClientIdentity.icon(row.clientKey)}
        className="size-[22px] rounded-md"
      />
      <span className="text-[13px] font-medium">
        {mcpClientIdentity.label(row.clientKey, row.clientName)}
      </span>
      {row.lastUsedAt === null ? (
        <Badge variant="outline" className="gap-1.5 font-normal">
          <span className="size-1.5 rounded-full bg-muted-foreground" />
          {t('Waiting for first call')}
        </Badge>
      ) : (
        <span className="text-[13px] text-muted-foreground">
          {dayjs(row.lastUsedAt).fromNow()}
        </span>
      )}
    </span>
  );
}
