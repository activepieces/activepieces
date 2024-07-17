import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useParams } from 'react-router-dom';

import { AutoPropertiesFormComponet } from '@/app/routes/flows/id/auto-properties-form';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable-panel';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/seperator';
import { BuilderNavBar } from '@/features/flow-canvas/components/builder-nav-bar';
import { FlowCanvas } from '@/features/flow-canvas/components/canvas';
import { flowsApi } from '@/features/flows/lib/flows-api';
import { PieceCardInfo } from '@/features/pieces/components/piece-card-info';
import { piecesHooks } from '@/features/pieces/lib/pieces-hook';
import { ActionErrorHandlingFormControl } from '@/features/properties-form/components/action-error-handling';
import { PopulatedFlow, spreadIfDefined } from '@activepieces/shared';

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
    name: '@activepieces/piece-amazon-s3',
    version: '0.3.4',
  });

  useEffect(() => {
    if (flowId) {
      refetch();
    }
  }, [flowId]);

  return (
    <div className="flex h-screen w-screen flex-col">
      <BuilderNavBar />
      <ResizablePanelGroup direction="horizontal" className="flex-grow">
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
            <div className="h-full flex flex-col p-4 gap-8">
              <PieceCardInfo piece={piece} interactive={false} />
              <ScrollArea className="flex-grow">
                <AutoPropertiesFormComponet
                  props={{
                    ...spreadIfDefined('auth', piece.auth),
                    ...piece.actions['read-file'].props,
                  }}
                  allowDynamicValues={true}
                />
                <Separator className="my-6" />
                {piece.actions['read-file'].errorHandlingOptions && (
                  <ActionErrorHandlingFormControl
                    errorHandlingOptions={
                      piece.actions['read-file'].errorHandlingOptions
                    }
                    onContinueOnFailureChange={() => {}}
                    onRetryOnFailureChange={() => {}}
                  />
                )}
              </ScrollArea>
            </div>
          )}
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
};

export { FlowBuilderPage };
