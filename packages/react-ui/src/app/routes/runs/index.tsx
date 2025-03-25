import { t } from 'i18next';
import { Play, AlertTriangle } from 'lucide-react';
import { useState } from 'react';

import TaskLimitAlert from '../flows/task-limit-alert';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import FlowRunsTable from '@/features/flow-runs/components/flow-runs-table';
import IssuesTable from '@/features/issues/components/issues-table';

const FlowRunsPage = () => {
  const [activeTab, setActiveTab] = useState('runs');

  return (
    <div className="flex flex-col gap-4 grow">
      <TaskLimitAlert />
      <div className="flex-col w-full">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList variant="underline" className="mb-4">
            <TabsTrigger
              variant="underline"
              value="runs"
            >
              <div className="flex items-center gap-2">
                <Play className="h-4 w-4" />
                <span>{t('Flow Runs')}</span>
              </div>
            </TabsTrigger>
            <TabsTrigger
              variant="underline"
              value="issues"
            >
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                <span>{t('Issues')}</span>
              </div>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="runs" className="w-full">
            <FlowRunsTable />
          </TabsContent>

          <TabsContent value="issues" className="w-full">
            <IssuesTable />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

FlowRunsPage.displayName = 'FlowRunsTable';
export { FlowRunsPage };
