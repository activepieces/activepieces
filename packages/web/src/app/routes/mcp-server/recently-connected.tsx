import { McpOAuthGrant } from '@activepieces/shared';
import { t } from 'i18next';
import { Plug } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatUtils } from '@/lib/format-utils';

import { ClientIcon } from './client-icon';
import { mcpClientDisplay } from './mcp-client-display';
import { mcpGrantsQueries } from './mcp-grants-hooks';
import { useMcpNav } from './mcp-nav';
import { PageBand } from './page-band';

const MAX_SHOWN = 3;

export function RecentlyConnected() {
  const nav = useMcpNav();
  const { data, isLoading, isError } = mcpGrantsQueries.useGrants({
    request: { limit: MAX_SHOWN },
    showErrorDialog: false,
  });
  const recent = data?.data ?? [];

  if (isLoading || isError) {
    return null;
  }

  return (
    <div className="border-t">
      <PageBand className="flex flex-wrap items-center gap-4 py-5 lg:px-14">
        <span className="shrink-0 text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
          {t('Recently connected')}
        </span>

        {recent.length === 0 ? (
          <>
            <span className="flex items-center gap-2.5 text-[13px] text-muted-foreground">
              <Plug className="size-4" />
              {t(
                'No clients yet — the first one to use the link shows up here.',
              )}
            </span>
            <Button
              variant="link"
              className="ml-auto h-auto p-0 text-[13px] font-semibold"
              onClick={nav.showBrowse}
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
              onClick={() => nav.showTab('connections')}
            >
              {t('Manage connections')}
            </Button>
          </>
        )}
      </PageBand>
    </div>
  );
}

function ClientChip({ row }: { row: McpOAuthGrant }) {
  return (
    <span className="flex items-center gap-2">
      <ClientIcon
        icon={mcpClientDisplay.icon(row.clientKey)}
        className="size-[22px] rounded-md"
      />
      <span className="text-[13px] font-medium">
        {mcpClientDisplay.label({
          key: row.clientKey,
          clientName: row.clientName,
        })}
      </span>
      {row.lastUsedAt === null ? (
        <Badge variant="outline" className="gap-1.5 font-normal">
          <span className="size-1.5 rounded-full bg-muted-foreground" />
          {t('Waiting for first call')}
        </Badge>
      ) : (
        <span className="text-[13px] text-muted-foreground">
          {formatUtils.formatDateToAgo(new Date(row.lastUsedAt))}
        </span>
      )}
    </span>
  );
}
