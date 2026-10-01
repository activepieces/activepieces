import { isNil } from '@activepieces/core-utils';
import { FlowVersionState, PopulatedFlow } from '@activepieces/shared';
import { useQuery } from '@tanstack/react-query';
import { ReactFlowProvider } from '@xyflow/react';
import { t } from 'i18next';
import { FileX } from 'lucide-react';
import { Link, useParams, useSearchParams } from 'react-router-dom';

import { BuilderPage } from '@/app/builder';
import { BuilderStateProvider } from '@/app/builder/state/builder-state-provider';
import { LoadingSpinner } from '@/components/custom/spinner';
import { buttonVariants } from '@/components/ui/button';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { flowsApi, sampleDataHooks } from '@/features/flows';
import { authenticationSession } from '@/lib/authentication-session';
import { cn } from '@/lib/utils';

const FlowBuilderPage = () => {
  const { flowId } = useParams();
  const [searchParams] = useSearchParams();
  const versionId = searchParams.get('versionId') ?? undefined;

  const {
    data: flow,
    isLoading,
    isError,
  } = useQuery<PopulatedFlow, Error>({
    queryKey: ['flow', flowId, versionId, authenticationSession.getProjectId()],
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
    return (
      <div className="bg-gray-1 flex h-full w-full items-center justify-center ">
        <LoadingSpinner isLarge={true}></LoadingSpinner>
      </div>
    );
  }

  if (isNil(flow) || isError) {
    return (
      <Empty className="h-full">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <FileX />
          </EmptyMedia>
          <EmptyTitle>{t('Flow not found')}</EmptyTitle>
          <EmptyDescription>
            {t("The flow you are looking for doesn't exist or was removed.")}
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Link
            className={cn(buttonVariants({ variant: 'outline' }))}
            to="/dashboard"
          >
            {t('Go to Dashboard')}
          </Link>
        </EmptyContent>
      </Empty>
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
