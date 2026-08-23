import { t } from 'i18next';

import { PageHeader } from '@/components/custom/page-header';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { ConnectSteps } from './connect-steps';
import { ConnectedClients } from './connected-clients';
import { useMcpServerUrl } from './mcp-client-identity';
import { mcpClientsQueries } from './mcp-clients-hooks';

export default function McpServerPage() {
  const { serverUrl, isPublic } = useMcpServerUrl();
  const { rows } = mcpClientsQueries.useClientsReachingProject();

  return (
    <div className="flex w-full flex-col gap-2">
      <PageHeader showSidebarToggle={true} title={t('Connect using MCP')} />
      <div className="w-full px-4 pb-10 sm:px-6">
        <Tabs defaultValue="connect" className="flex flex-col gap-8">
          <TabsList variant="outline" className="w-full justify-start border-b">
            <TabsTrigger
              variant="outline"
              value="connect"
              className="text-base"
            >
              {t('Connect')}
            </TabsTrigger>
            <TabsTrigger
              variant="outline"
              value="clients"
              className="text-base"
            >
              {t('Connected clients')}
              {rows.length > 0 && (
                <Badge variant="accent" className="ml-2">
                  {rows.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>
          <TabsContent value="connect" className="mt-0">
            <ConnectSteps serverUrl={serverUrl} isPublicUrl={isPublic} />
          </TabsContent>
          <TabsContent value="clients" className="mt-0">
            <ConnectedClients />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
