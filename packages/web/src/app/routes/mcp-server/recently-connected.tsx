import { McpOAuthGrant } from '@activepieces/shared';
import { t } from 'i18next';
import { ChevronRight, Plug } from 'lucide-react';

import { StatusDot } from '@/components/custom/status-dot';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { formatUtils } from '@/lib/format-utils';

import { ClientIcon } from './client-icon';
import { mcpClientDisplay } from './mcp-client-display';
import { mcpGrantsQueries } from './mcp-grants-hooks';
import { useMcpNav } from './mcp-nav';

const MAX_SHOWN = 4;
const MAX_FETCHED = 12;

export function RecentlyConnected() {
  const nav = useMcpNav();
  const { data, isLoading, isError } = mcpGrantsQueries.useGrants({
    request: { limit: MAX_FETCHED },
  });
  const recent = (data?.data ?? [])
    .filter(
      (row, index, rows) =>
        rows.findIndex(
          (other) =>
            other.clientKey === row.clientKey &&
            other.clientName === row.clientName,
        ) === index,
    )
    .slice(0, MAX_SHOWN);

  if (isLoading || isError) {
    return null;
  }

  if (recent.length === 0) {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-dashed border-gray-7 p-4">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-gray-3 text-gray-12">
          <Plug className="size-4" />
        </span>
        <div className="flex min-w-0 flex-col gap-1">
          <span className="text-sm font-medium text-gray-12">
            {t('Nothing connected yet')}
          </span>
          <span className="text-xs text-gray-11">
            {t(
              'Pick a client below. The first one that signs in shows up here.',
            )}
          </span>
        </div>
      </div>
    );
  }

  return (
    <Card className="flex-row flex-wrap items-center gap-x-6 gap-y-3 px-4">
      <StatusDot tone="success" className="shrink-0 font-medium">
        {t('Recently connected')}
      </StatusDot>
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-6 gap-y-3">
        {recent.map((row) => (
          <ClientChip key={row.id} row={row} />
        ))}
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => nav.showTab('connections')}
      >
        {t('Manage connections')}
        <ChevronRight />
      </Button>
    </Card>
  );
}

function ClientChip({ row }: { row: McpOAuthGrant }) {
  return (
    <span className="flex min-w-0 items-center gap-2">
      <ClientIcon
        icon={mcpClientDisplay.icon(row.clientKey)}
        className="size-7 rounded-lg"
      />
      <span className="flex min-w-0 flex-col">
        <span className="truncate text-sm font-medium text-gray-12">
          {mcpClientDisplay.label({
            key: row.clientKey,
            clientName: row.clientName,
          })}
        </span>
        <span className="truncate text-xs text-gray-11">
          {row.lastUsedAt === null
            ? t('Waiting for first call')
            : t('Used {time}', {
                time: formatUtils.formatDateToAgo(new Date(row.lastUsedAt)),
              })}
        </span>
      </span>
    </span>
  );
}
