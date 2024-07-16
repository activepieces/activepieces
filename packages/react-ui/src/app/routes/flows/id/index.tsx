import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useParams } from 'react-router-dom';

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable-panel';
import { BuilderNavBar } from '@/features/flow-canvas/components/builder-nav-bar';
import { FlowCanvas } from '@/features/flow-canvas/components/canvas';
import { flowsApi } from '@/features/flows/lib/flows-api';
import { piecesHooks } from '@/features/pieces/lib/pieces-hook';
import { AutoFormComponent } from '@/features/properties-form/components/auto-form';
import { PopulatedFlow } from '@activepieces/shared';

const FlowBuilderPage = () => {
  const { flowId } = useParams();
  const {
    data: flow,
    isLoading,
    isError,
    isSuccess,
    refetch,
  } = useQuery<PopulatedFlow, Error>({
    queryKey: ['flow', flowId],
    queryFn: () => flowsApi.get(flowId!),
    enabled: !!flowId,
  });

  const { data: piece } = piecesHooks.usePiece({
    name: '@activepieces/piece-date-helper',
    version: '0.0.7',
  });

  useEffect(() => {
    if (flowId) {
      refetch();
    }
  }, [flowId]);

  return (
    <div className="flex h-screen w-screen flex-col">
      <BuilderNavBar />
      <ResizablePanelGroup direction="horizontal">
        <ResizablePanel defaultSize={75}>
          <>
            {isLoading && <div>Loading...</div>}
            {isError && <div>Error, please try again.</div>}
            {isSuccess && flow && <FlowCanvas flow={flow} />}
          </>
        </ResizablePanel>
        <ResizableHandle />
        <ResizablePanel defaultSize={25}>
          {piece && (
            <AutoFormComponent
              props={piece.actions['get_current_date'].props}
              auth={undefined}
            />
          )}
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
};

export { FlowBuilderPage };
