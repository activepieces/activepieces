import { t } from 'i18next';
import { History, AlertCircle } from 'lucide-react';
import { useState } from 'react';

import { TableTitle } from '@/components/ui/table-title';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RunsTable } from '@/features/flow-runs/components/runs-table';
import { issueHooks } from '@/features/issues/hooks/issue-hooks';

import TaskLimitAlert from '../../../features/flows/components/task-limit-alert';

import IssuesPage from './issues/issues-table';

export enum FlowRunsTabs {
  HISTORY = 'history',
  ISSUES = 'issues',
}

const FlowRunsPage = () => {
  const { data: showIssuesNotification } = issueHooks.useIssuesNotification();
  const [activeTab, setActiveTab] = useState<FlowRunsTabs>(
    FlowRunsTabs.HISTORY,
  );

  return (
    <div className="flex flex-col gap-4 grow">
      <TaskLimitAlert />
      <div className="flex-col w-full">
        <TableTitle
          description={t(
            'Track the automation run history and status and troubleshoot issues.',
          )}
        >
          {t('Flow Runs')}
        </TableTitle>
        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as FlowRunsTabs)}
          className="w-full"
        >
          <TabsList variant="outline">
            <TabsTrigger value={FlowRunsTabs.HISTORY} variant="outline">
              <History className="mr-2 h-4 w-4" />
              {t('History')}
            </TabsTrigger>
            <TabsTrigger value={FlowRunsTabs.ISSUES} variant="outline">
              <span className="flex items-center gap-2">
                <AlertCircle className="mr-2 h-4 w-4" />
                {t('Issues')}
                {showIssuesNotification && (
                  <span className="ml-1 inline-block w-2 h-2 bg-red-500 rounded-full"></span>
                )}
              </span>
            </TabsTrigger>
          </TabsList>
          <TabsContent value={FlowRunsTabs.HISTORY}>
            <RunsTable />
          </TabsContent>
          <TabsContent value={FlowRunsTabs.ISSUES}>
            <IssuesPage setActiveTab={setActiveTab} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

FlowRunsPage.displayName = 'FlowRunsTable';
export { FlowRunsPage };
