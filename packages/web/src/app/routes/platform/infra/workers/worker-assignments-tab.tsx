import { t } from 'i18next';
import { Info } from 'lucide-react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { workersQueries } from '@/features/platform-admin';
import { projectCollectionUtils } from '@/features/projects/stores/project-collection';
import { platformHooks } from '@/hooks/platform-hooks';

import { ByGroupView } from './by-group-view';
import { ByProjectView } from './by-project-view';

export function WorkerAssignmentsTab() {
  const { platform } = platformHooks.useCurrentPlatform();
  const { data: projects } = projectCollectionUtils.useAllPlatformProjects();
  const { data: capacity } = workersQueries.useWorkerGroups(
    platform.plan.workerGroupsEnabled,
  );
  const { data: workersData } = workersQueries.useWorkerMachines();

  const workerGroups = capacity?.groups ?? [];
  const sharedSlots = capacity?.sharedSlots ?? 0;
  const workers = workersData ?? [];

  return (
    <div className="flex flex-col gap-4 pt-4">
      <Alert variant="primary">
        <Info className="size-4" />
        <AlertDescription className="text-sm">
          {t(
            'Worker groups reserve a dedicated queue for the projects you assign. Defined in your deployment with AP_WORKER_GROUP_ID.',
          )}{' '}
          <a
            href="https://www.activepieces.com/docs/install/configure-operate/worker-groups"
            target="_blank"
            rel="noreferrer"
            className="text-primary underline"
          >
            {t('Learn more')}
          </a>
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="by-project" className="w-full">
        <TabsList variant="default">
          <TabsTrigger variant="default" value="by-project">
            {t('By project')}
          </TabsTrigger>
          <TabsTrigger variant="default" value="by-group">
            {t('By group')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="by-project">
          <ByProjectView
            workerGroups={workerGroups}
            sharedSlots={sharedSlots}
          />
        </TabsContent>

        <TabsContent value="by-group">
          <ByGroupView
            projects={projects}
            workerGroups={workerGroups}
            workers={workers}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
