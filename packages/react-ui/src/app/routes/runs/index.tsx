import { t } from 'i18next';
import { History, CircleAlert } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { DashboardPageHeader } from '@/components/custom/dashboard-page-header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RunsTable } from '@/features/flow-runs/components/runs-table';
import { issueHooks } from '@/features/issues/hooks/issue-hooks';
import { useAuthorization } from '@/hooks/authorization-hooks';
import { Permission } from '@activepieces/shared';

import { IssuesTable } from '../flows/issues-table';

export enum RunsPageTabs {
  HISTORY = 'history',
  ISSUES = 'issues',
}

const RunsPage = () => {
  const { checkAccess } = useAuthorization();
  const { data: showIssuesNotification } = issueHooks.useIssuesNotification();
  const location = useLocation();
  const navigate = useNavigate();

  const determineActiveTab = () => {
    if (location.pathname.includes('/issues')) {
      return RunsPageTabs.ISSUES;
    } else {
      return RunsPageTabs.HISTORY;
    }
  };

  const [activeTab, setActiveTab] = useState<RunsPageTabs>(
    determineActiveTab(),
  );

  useEffect(() => {
    setActiveTab(determineActiveTab());
  }, [location.pathname]);

  const handleTabChange = (value: RunsPageTabs) => {
    setActiveTab(value);

    let newPath = location.pathname;
    if (value === RunsPageTabs.HISTORY) {
      newPath = newPath.replace(/\/issues$/, '/runs');
    } else if (value === RunsPageTabs.ISSUES) {
      newPath = newPath.replace(/\/runs$/, '/issues');
    }

    navigate(newPath);
  };

  return (
    <div className="flex flex-col gap-4 w-full grow">
      <DashboardPageHeader
        title={t('Runs')}
        description={t('View your flow run history and run issues')}
      />
      <Tabs
        value={activeTab}
        onValueChange={(v) => handleTabChange(v as RunsPageTabs)}
        className="w-full"
      >
        <TabsList variant="outline">
          {checkAccess(Permission.READ_RUN) && (
            <TabsTrigger value={RunsPageTabs.HISTORY} variant="outline">
              <History className="h-4 w-4 mr-2" />
              {t('History')}
            </TabsTrigger>
          )}
          {checkAccess(Permission.READ_ISSUES) && (
            <TabsTrigger value={RunsPageTabs.ISSUES} variant="outline">
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
        <TabsContent value={RunsPageTabs.HISTORY}>
          <RunsTable />
        </TabsContent>
        <TabsContent value={RunsPageTabs.ISSUES}>
          <IssuesTable />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export { RunsPage }; 