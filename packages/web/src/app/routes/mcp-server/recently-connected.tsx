import { McpOAuthGrant } from '@activepieces/shared';
import { t } from 'i18next';
import { Plug } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { formatUtils } from '@/lib/format-utils';

import { ClientIcon } from './client-icon';
import { mcpClientDisplay } from './mcp-client-display';
import { mcpGrantsQueries } from './mcp-grants-hooks';
import { useMcpNav } from './mcp-nav';

const MAX_SHOWN = 3;

export function RecentlyConnected() {
  const nav = useMcpNav();
  const { data, isLoading, isError } = mcpGrantsQueries.useGrants({
    request: { limit: MAX_SHOWN },
  });
  const recent = data?.data ?? [];

  if (isLoading || isError) {
    return null;
  }

  return (
    <Card className="flex-row flex-wrap items-center gap-4 px-4">
      <span className="shrink-0 text-sm font-medium text-gray-11">
        {t('Recently connected')}
      </span>

      {recent.length === 0 ? (
        <>
          <span className="flex items-center gap-2 text-sm text-gray-11">
            <Plug className="size-4" />
            {t('No clients yet — the first one to use the link shows up here.')}
          </span>
          <Button variant="link" className="ml-auto" onClick={nav.showBrowse}>
            {t('Pick a client')}
          </Button>
        </>
      ) : (
        <>
          {recent.map((row, index) => (
            <div key={row.id} className="flex items-center gap-4">
              {index > 0 && <span className="h-4 w-px bg-gray-6" />}
              <ClientChip row={row} />
            </div>
          ))}
          <Button
            variant="link"
            className="ml-auto"
            onClick={() => nav.showTab('connections')}
          >
            {t('Manage connections')}
          </Button>
        </>
      )}
    </Card>
  );
}

function ClientChip({ row }: { row: McpOAuthGrant }) {
  return (
    <span className="flex items-center gap-2">
      <ClientIcon
        icon={mcpClientDisplay.icon(row.clientKey)}
        className="size-6 rounded-md"
      />
      <span className="text-sm font-medium">
        {mcpClientDisplay.label({
          key: row.clientKey,
          clientName: row.clientName,
        })}
      </span>
      {row.lastUsedAt === null ? (
        <Badge variant="outline" className="gap-1.5 font-normal">
          <span className="size-1.5 rounded-full bg-gray-11" />
          {t('Waiting for first call')}
        </Badge>
      ) : (
        <span className="text-xs text-gray-11">
          {formatUtils.formatDateToAgo(new Date(row.lastUsedAt))}
        </span>
      )}
    </span>
  );
}
