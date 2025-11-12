import { t } from 'i18next';
import { History, Workflow } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { DashboardPageHeader } from '@/app/components/dashboard-page-header';
import { useEmbedding } from '@/components/embed-provider';
import {} from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {} from '@/components/ui/tooltip';
import { RunsTable } from '@/features/flow-runs/components/runs-table';
import { useAuthorization } from '@/hooks/authorization-hooks';
import { authenticationSession } from '@/lib/authentication-session';
import { Permission } from '@activepieces/shared';

import { FlowsTable } from './flows-table';

export enum FlowsPageTabs {
  RUNS = 'runs',
  FLOWS = 'flows',
}

const FlowsPage = () => {
  const { checkAccess } = useAuthorization();
  const location = useLocation();
  const navigate = useNavigate();

  const determineActiveTab = () => {
    if (location.pathname.includes('/runs')) {
      return FlowsPageTabs.RUNS;
    } else {
      return FlowsPageTabs.FLOWS;
    }
  };

  const [activeTab, setActiveTab] = useState<FlowsPageTabs>(
    determineActiveTab(),
  );

  useEffect(() => {
    setActiveTab(determineActiveTab());
  }, [location.pathname]);

  const { embedState } = useEmbedding();

  const handleTabChange = (value: FlowsPageTabs) => {
    setActiveTab(value);
    switch (value) {
      case FlowsPageTabs.RUNS: {
        navigate(authenticationSession.appendProjectRoutePrefix('/runs'));
        break;
      }
      case FlowsPageTabs.FLOWS: {
        navigate(authenticationSession.appendProjectRoutePrefix('/flows'));
        break;
      }
    }
  };

  return (
    <div className="flex flex-col gap-4 w-full grow">
      <DashboardPageHeader
        title={t('Flows')}
        description={t('Create and manage your flows and run history')}
      ></DashboardPageHeader>
      <Tabs
        value={activeTab}
        onValueChange={(v) => handleTabChange(v as FlowsPageTabs)}
        className="w-full"
      >
        {!embedState.hideFlowsPageNavbar ? (
          <TabsList variant="outline">
            <TabsTrigger value={FlowsPageTabs.FLOWS} variant="outline">
              <Workflow className="h-4 w-4 mr-2" />
              {t('Flows')}
            </TabsTrigger>
            {checkAccess(Permission.READ_RUN) && (
              <TabsTrigger value={FlowsPageTabs.RUNS} variant="outline">
                <History className="h-4 w-4 mr-2" />
                {t('Runs')}
              </TabsTrigger>
            )}
          </TabsList>
        ) : (
          <></>
        )}
        <TabsContent value={FlowsPageTabs.FLOWS}>
          <FlowsTable />
        </TabsContent>
        <TabsContent value={FlowsPageTabs.RUNS}>
          <RunsTable />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export { FlowsPage };
