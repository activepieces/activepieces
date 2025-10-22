import { useQuery } from '@tanstack/react-query';
import { ReactFlowProvider } from '@xyflow/react';
import { t } from 'i18next';
import { FileX } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';

import { BuilderPage } from '@/app/builder';
import { BuilderStateProvider } from '@/app/builder/builder-state-provider';
import { buttonVariants } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/spinner';
import { flowsApi } from '@/features/flows/lib/flows-api';
import { sampleDataHooks } from '@/features/flows/lib/sample-data-hooks';
import { authenticationSession } from '@/lib/authentication-session';
import { cn } from '@/lib/utils';
import { isNil, PopulatedFlow } from '@activepieces/shared';

const FlowBuilderPage = () => {
  const { flowId } = useParams();

  const {
    data: flow,
    isLoading,
    isError,
  } = useQuery<PopulatedFlow, Error>({
    queryKey: ['flow', flowId, authenticationSession.getProjectId()],
    queryFn: () => flowsApi.get(flowId!),
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
      <div className="bg-background flex h-full w-full items-center justify-center ">
        <LoadingSpinner isLarge={true}></LoadingSpinner>
      </div>
    );
  }

  if (isNil(flow) || isError) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
        <div className="rounded-full bg-muted p-4">
          <FileX className="size-9 text-muted-foreground" />
        </div>

        <div>
          <h2 className="text-lg font-semibold">{t('Flow not found')}</h2>
          <p className="text-sm text-muted-foreground">
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
        readonly={false}
        run={null}
        sampleData={sampleData ?? {}}
        sampleDataInput={sampleDataInput ?? {}}
      >
        <BuilderPage />
      </BuilderStateProvider>
    </ReactFlowProvider>
  );
};

export { FlowBuilderPage };
