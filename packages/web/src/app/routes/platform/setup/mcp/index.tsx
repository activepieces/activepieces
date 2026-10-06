import { Shield01Icon } from '@hugeicons/core-free-icons';
import { t } from 'i18next';
import { Link } from 'react-router-dom';

import { McpToolTierList } from '@/app/components/project-settings/mcp-server/tool-tiers/mcp-tool-tier-list';
import { ActivityFeed } from '@/app/routes/mcp-server/activity/activity-feed';
import { AdminPageHeader } from '@/app/routes/platform/admin-page-header';
import { DataFetchErrorState } from '@/components/custom/data-fetch-error-state';
import { HugeiconsIcon } from '@/components/custom/hugeicons-icon';
import { Page } from '@/components/custom/page';
import { Panel } from '@/components/custom/panel';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { platformHooks } from '@/hooks/platform-hooks';

import { platformMcpHooks } from './platform-mcp-hooks';

export default function PlatformMcpPage({ section }: PlatformMcpPageProps) {
  const isAccess = section === 'access';
  const { platform } = platformHooks.useCurrentPlatform();
  return (
    <Page>
      <AdminPageHeader page={isAccess ? 'mcpTools' : 'mcpActivity'}>
        {isAccess && platform.plan.projectRolesEnabled && (
          <Button variant="outline" asChild>
            <Link to="/platform/users/roles">
              <HugeiconsIcon icon={Shield01Icon} />
              {t('Manage roles')}
            </Link>
          </Button>
        )}
      </AdminPageHeader>
      {isAccess ? <AccessContent /> : <ActivityContent />}
    </Page>
  );
}

function AccessContent() {
  const {
    data: mcpServer,
    isLoading,
    isError,
    refetch,
  } = platformMcpHooks.usePlatformMcpServer();
  const { mutate: updateTools } = platformMcpHooks.useUpdatePlatformMcpTools();

  return (
    <div className="flex flex-col gap-4">
      {isLoading ? (
        <Skeleton className="h-64 rounded-2xl" />
      ) : isError || !mcpServer ? (
        <Panel flush>
          <DataFetchErrorState entity={t('the MCP server')} onRetry={refetch} />
        </Panel>
      ) : (
        <McpToolTierList
          disabledTools={mcpServer.disabledTools}
          scope="platform"
          onUpdateDisabledTools={({ tools, onSettled, onSuccess, onError }) =>
            updateTools(
              { disabledTools: tools },
              { onSettled, onSuccess, onError },
            )
          }
        />
      )}
    </div>
  );
}

function ActivityContent() {
  return (
    <ActivityFeed
      emptyStateTitle={t('No activity yet')}
      emptyStateDescription={t(
        'When an MCP client runs a piece action, it appears here.',
      )}
    />
  );
}

type PlatformMcpSection = 'access' | 'activity';

type PlatformMcpPageProps = {
  section: PlatformMcpSection;
};
