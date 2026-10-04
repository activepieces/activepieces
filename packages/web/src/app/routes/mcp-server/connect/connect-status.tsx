import { McpOAuthGrant } from '@activepieces/shared';
import { t } from 'i18next';
import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

import { listFormat } from '@/components/custom/list/list-format';
import { Skeleton } from '@/components/ui/skeleton';
import { piecesHooks } from '@/features/pieces/hooks/pieces-hooks';

import { ClientIcon } from '../client-icon';
import { mcpActivityQueries } from '../mcp-activity-hooks';
import { mcpClientDisplay } from '../mcp-client-display';

export function ConnectStatus({
  grants,
  isLoading,
  isError,
}: {
  grants: McpOAuthGrant[];
  isLoading: boolean;
  isError: boolean;
}) {
  const { data: activity } = mcpActivityQueries.useActivity({
    request: { limit: 1 },
  });
  const latest = activity?.data[0];
  const { summary } = piecesHooks.usePieceSummary({
    name: latest?.pieceName ?? '',
  });
  const clients = uniqueClients(grants);

  if (isLoading) {
    return <Skeleton className="h-12 rounded-2xl" />;
  }

  if (isError) {
    return null;
  }

  if (clients.length === 0) {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-dashed px-5 py-3 text-sm text-gray-11">
        <span className="size-1.5 shrink-0 rounded-full bg-gray-8" />
        {t(
          'Nothing is connected yet. Pick your AI below: it signs in as you and only sees the projects you allow.',
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-2xl border bg-panel px-5 py-2.5 text-sm">
      <span className="flex items-center gap-2">
        <span className="flex items-center gap-1">
          {clients.slice(0, MAX_LOGOS).map((grant) => (
            <ClientIcon
              key={grant.id}
              icon={mcpClientDisplay.icon(grant.clientKey)}
              className="size-6 rounded-md"
            />
          ))}
        </span>
        <span className="font-medium text-gray-12">
          {t(
            '{count, plural, =1 {1 client connected} other {# clients connected}}',
            {
              count: clients.length,
            },
          )}
        </span>
      </span>
      {latest !== undefined && (
        <span className="min-w-0 flex-1 truncate text-gray-11">
          {latestLine({
            client: mcpClientDisplay.label({
              key: latest.clientKey,
              clientName: null,
            }),
            app: latest.pieceName === null ? undefined : summary?.displayName,
            project: latest.projectName,
            when: listFormat.relativeDate(latest.created).toLowerCase(),
          })}
        </span>
      )}
      <Link
        to="/mcp-server/activity"
        className="ml-auto inline-flex items-center gap-1 font-medium text-accent-11 hover:underline"
      >
        {t('See activity')}
        <ChevronRight className="size-3.5" />
      </Link>
    </div>
  );
}

function uniqueClients(grants: McpOAuthGrant[]): McpOAuthGrant[] {
  return grants.filter(
    (grant, index) =>
      grants.findIndex(
        (other) =>
          other.clientKey === grant.clientKey &&
          other.clientName === grant.clientName,
      ) === index,
  );
}

function latestLine({
  client,
  app,
  project,
  when,
}: {
  client: string;
  app: string | undefined;
  project: string | null;
  when: string;
}): string {
  if (app !== undefined && project !== null) {
    return t('Latest: {client} used {app} in {project}, {when}', {
      client,
      app,
      project,
      when,
    });
  }
  if (app !== undefined) {
    return t('Latest: {client} used {app}, {when}', { client, app, when });
  }
  return t('Latest: {client} ran a tool, {when}', { client, when });
}

const MAX_LOGOS = 4;
