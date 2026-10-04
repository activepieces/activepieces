import {
  ApEdition,
  ApFlagId,
  WorkerMachineType,
  WorkerMachineWithStatus,
} from '@activepieces/shared';
import { t } from 'i18next';
import { Server, Zap } from 'lucide-react';

import { AdminTabs } from '@/app/routes/platform/admin-tabs';
import { DataFetchErrorState } from '@/components/custom/data-fetch-error-state';
import { Page, PageHeader } from '@/components/custom/page';
import { ResourceGrid } from '@/components/custom/resource-card';
import { Alert, AlertAction, AlertDescription } from '@/components/ui/alert';
import { Card } from '@/components/ui/card';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { Skeleton } from '@/components/ui/skeleton';
import { RequestTrial } from '@/features/billing';
import { workersQueries } from '@/features/platform-admin';
import { flagsHooks } from '@/hooks/flags-hooks';

import { GroupsView } from './groups-view';
import { MachineCard } from './machine-card';

export default function WorkersPage({ section }: WorkersPageProps) {
  return (
    <Page>
      <PageHeader
        title={t('Workers')}
        description={t(
          'The machines that run your flows, and which projects each group of them runs.',
        )}
      />
      <AdminTabs section="workers" />
      {section === 'machines' ? <MachinesView /> : <GroupsView />}
    </Page>
  );
}

function MachinesView() {
  const { data: edition } = flagsHooks.useFlag<ApEdition>(ApFlagId.EDITION);
  const {
    data: machines,
    isLoading,
    isError,
    refetch,
  } = workersQueries.useWorkerMachines();
  const isCloud = edition === ApEdition.CLOUD;

  if (isLoading) {
    return (
      <ResourceGrid>
        {[0, 1, 2].map((index) => (
          <Card key={index} className="gap-4 p-4">
            <div className="flex items-center gap-3">
              <Skeleton className="size-8 rounded-lg" />
              <div className="flex flex-col gap-1.5">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-full" />
          </Card>
        ))}
      </ResourceGrid>
    );
  }

  if (isError) {
    return (
      <DataFetchErrorState entity={t('machines')} onRetry={() => refetch()} />
    );
  }

  const sorted = [...(machines ?? [])].sort((a, b) =>
    a.created.localeCompare(b.created),
  );

  return (
    <>
      {isCloud && sorted[0]?.type === WorkerMachineType.SHARED && (
        <Alert variant="info">
          <Zap />
          <AlertDescription>
            {t(
              'Flows run on shared machines. Dedicated machines stay warm for your platform alone, so runs start sooner.',
            )}
          </AlertDescription>
          <AlertAction>
            <RequestTrial
              featureKey="DEDICATED_WORKERS"
              buttonVariant="default"
              buttonSize="sm"
            />
          </AlertAction>
        </Alert>
      )}
      {sorted.length === 0 ? (
        <Empty className="border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Server />
            </EmptyMedia>
            <EmptyTitle>{t('No machines online')}</EmptyTitle>
            <EmptyDescription>
              {t(
                'Start a worker and it shows up here within a few seconds, with its CPU, memory and disk.',
              )}
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <ResourceGrid>
          {sorted.map((machine: WorkerMachineWithStatus, index) => (
            <MachineCard key={machine.id} worker={machine} number={index + 1} />
          ))}
        </ResourceGrid>
      )}
    </>
  );
}

type WorkersPageProps = {
  section: 'machines' | 'groups';
};
