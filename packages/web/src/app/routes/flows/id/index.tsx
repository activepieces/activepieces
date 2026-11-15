import { isNil } from '@activepieces/core-utils';
import { FlowVersionState, PopulatedFlow } from '@activepieces/shared';
import { useQuery } from '@tanstack/react-query';
import { ReactFlowProvider } from '@xyflow/react';
import { t } from 'i18next';
import { FileX } from 'lucide-react';
import { Link, useParams, useSearchParams } from 'react-router-dom';

import { BuilderPage } from '@/app/builder';
import { BuilderStateProvider } from '@/app/builder/state/builder-state-provider';
import { buttonVariants } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { flowHooks, flowsApi, sampleDataHooks } from '@/features/flows';
import { authenticationSession } from '@/lib/authentication-session';
import { cn } from '@/lib/utils';

function BuilderSkeleton() {
  return (
    <div aria-busy className="flex h-full w-full flex-col bg-gray-1">
      <div className="flex h-[60px] shrink-0 items-center gap-3 border-b px-4">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="ml-auto h-8 w-24" />
      </div>
      <div className="flex flex-1 flex-col items-center gap-8 pt-16">
        {STEP_SKELETONS.map((step) => (
          <Skeleton key={step} className="h-16 w-64 rounded-lg" />
        ))}
      </div>
    </div>
  );
}

const STEP_SKELETONS = ['trigger', 'first-step', 'second-step'];

const FlowBuilderPage = () => {
  const { flowId } = useParams();
  const [searchParams] = useSearchParams();
  const versionId = searchParams.get('versionId') ?? undefined;

  const {
    data: flow,
    isLoading,
    isError,
  } = useQuery<PopulatedFlow, Error>({
    queryKey: [
      ...flowHooks.createFlowQueryKeys({ flowId: flowId!, versionId }),
      authenticationSession.getProjectId(),
    ],
    queryFn: () => flowsApi.get(flowId!, versionId ? { versionId } : undefined),
    gcTime: 0,
    retry: false,
    refetchOnWindowFocus: false,
  });

  const { data: sampleData, isLoading: isSampleDataLoading } =
    sampleDataHooks.useSampleDataForFlow(flow?.version, flow?.projectId);

  const { data: sampleDataInput, isLoading: isSampleDataInputLoading } =
    sampleDataHooks.useSampleDataInputForFlow(flow?.version, flow?.projectId);
  if (isLoading || isSampleDataLoading || isSampleDataInputLoading) {
    return <BuilderSkeleton />;
  }

  if (isNil(flow) || isError) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
        <div className="rounded-full bg-gray-3 p-4">
          <FileX className="size-9 text-gray-11" />
        </div>

        <div>
          <h2 className="text-lg font-semibold">{t('Flow not found')}</h2>
          <p className="text-sm text-gray-11">
            {t("The flow you are looking for doesn't exist or was removed.")}
          </p>
        </div>

        <Link
          className={cn(buttonVariants({ variant: 'outline' }))}
          to="/dashboard"
        >
          {t('Go to Dashboard')}
        </Link>
      </div>
    );
  }

  return (
    <ReactFlowProvider>
      <BuilderStateProvider
        flow={flow}
        flowVersion={flow!.version}
        readonly={flow!.version.state === FlowVersionState.LOCKED}
        hideTestWidget={false}
        run={null}
        outputSampleData={sampleData ?? {}}
        inputSampleData={sampleDataInput ?? {}}
      >
        <BuilderPage />
      </BuilderStateProvider>
    </ReactFlowProvider>
  );
};

export { FlowBuilderPage };
