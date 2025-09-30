import { t } from 'i18next';
import { History, CircleAlert, Workflow } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { DashboardPageHeader } from '@/components/custom/dashboard-page-header';
import { useEmbedding } from '@/components/embed-provider';
import {} from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {} from '@/components/ui/tooltip';
import { RunsTable } from '@/features/flow-runs/components/runs-table';
import { issueHooks } from '@/features/issues/hooks/issue-hooks';
import { useAuthorization } from '@/hooks/authorization-hooks';
import { authenticationSession } from '@/lib/authentication-session';
import { Permission } from '@activepieces/shared';

import { FlowsTable } from './flows-table';
import { IssuesTable } from './issues-table';

export enum FlowsPageTabs {
  RUNS = 'runs',
  ISSUES = 'issues',
  FLOWS = 'flows',
}

const FlowsPage = () => {
  const { checkAccess } = useAuthorization();
  const { data: showIssuesNotification } = issueHooks.useIssuesNotification();
  const location = useLocation();
  const navigate = useNavigate();

  const determineActiveTab = () => {
    if (location.pathname.includes('/runs')) {
      return FlowsPageTabs.RUNS;
    } else if (location.pathname.includes('/issues')) {
      return FlowsPageTabs.ISSUES;
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
      case FlowsPageTabs.ISSUES: {
        navigate(authenticationSession.appendProjectRoutePrefix('/issues'));
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
        tutorialTab="flows"
        title={t('Flows')}
        description={t(
          'Create and manage your flows, run history and run issues',
        )}
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
            {checkAccess(Permission.READ_ISSUES) && (
              <TabsTrigger value={FlowsPageTabs.ISSUES} variant="outline">
                <CircleAlert className="h-4 w-4 mr-2" />
                <span className="flex items-center gap-2">
                  {t('Issues')}
                  {showIssuesNotification && (
                    <span className="ml-1 inline-block w-2 h-2 bg-red-500 rounded-full"></span>
                  )}
                </span>
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
        <TabsContent value={FlowsPageTabs.ISSUES}>
          <IssuesTable />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export { FlowsPage };
