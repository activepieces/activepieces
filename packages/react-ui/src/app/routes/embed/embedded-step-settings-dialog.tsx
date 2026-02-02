import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

import { memoryRouter } from '@/app/guards';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { LoadingSpinner } from '@/components/ui/spinner';
import { flowsApi } from '@/features/flows/lib/flows-api';
import { cn, parentWindow } from '@/lib/utils';
import {
  FlowAction,
  FlowTrigger,
  flowStructureUtil,
} from '@activepieces/shared';
import {
  ActivepiecesClientEventName,
  ActivepiecesClientShowStepSettingsIframe,
  ActivepiecesStepSettingsDialogClosed,
  STEP_SETTINGS_QUERY_PARAMS,
} from 'ee-embed-sdk';

import { piecesHooks } from '../../../features/pieces/lib/pieces-hooks';
import { BuilderStateProvider } from '../../builder/state/builder-state-provider';
import { StepSettingsContainer } from '../../builder/step-settings';
import { StepSettingsProvider } from '../../builder/step-settings/step-settings-context';

const extractIdFromQueryParams = () => {
  const stepName = new URLSearchParams(memoryRouter.state.location.search).get(
    STEP_SETTINGS_QUERY_PARAMS.stepName,
  );
  return stepName;
};

export const EmbeddedStepSettingsDialog = () => {
  const stepName = extractIdFromQueryParams();
  const queryParams = new URLSearchParams(memoryRouter.state.location.search);
  const flowVersionId = queryParams.get(
    STEP_SETTINGS_QUERY_PARAMS.flowVersionId,
  );
  const flowId = queryParams.get(STEP_SETTINGS_QUERY_PARAMS.flowId);
  const dialogKey = `${stepName}-${flowVersionId}-${flowId}-${Date.now()}`;

  return (
    <EmbeddedStepSettingsDialogContent
      stepName={stepName}
      flowVersionId={flowVersionId}
      flowId={flowId}
      key={dialogKey}
    />
  );
};

type EmbeddedStepSettingsDialogContentProps = {
  stepName: string | null;
  flowVersionId: string | null;
  flowId: string | null;
};

const EmbeddedStepSettingsDialogContent = ({
  stepName,
  flowVersionId,
  flowId,
}: EmbeddedStepSettingsDialogContentProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(true);

  const hideStepSettingsIframe = () => {
    setIsDialogOpen(false);
    postMessageToParent({
      type: ActivepiecesClientEventName.CLIENT_STEP_SETTINGS_DIALOG_CLOSED,
      data: {},
    });
  };

  const postMessageToParent = (event: ActivepiecesStepSettingsDialogClosed) => {
    parentWindow.postMessage(event, '*');
  };

  const {
    data: flow,
    isLoading: isLoadingFlow,
    isError: isFlowError,
  } = useQuery({
    queryKey: ['flow', flowId, flowVersionId],
    queryFn: () => flowsApi.get(flowId!, { versionId: flowVersionId! }),
    enabled: !!flowId && !!flowVersionId,
  });

  const flowVersion = flow?.version;
  const selectedStep =
    flowVersion && stepName
      ? flowStructureUtil.getStep(stepName, flowVersion.trigger)
      : undefined;

  const { pieceModel, isLoading: isLoadingPiece } =
    piecesHooks.usePieceModelForStepSettings({
      name: selectedStep?.settings?.pieceName,
      version: selectedStep?.settings?.pieceVersion,
      enabled: !!selectedStep && 'pieceName' in (selectedStep.settings || {}),
      getExactVersion: false,
    });

  useEffect(() => {
    const showStepSettingsIframeEvent: ActivepiecesClientShowStepSettingsIframe =
      {
        type: ActivepiecesClientEventName.CLIENT_SHOW_STEP_SETTINGS_IFRAME,
        data: {},
      };
    parentWindow.postMessage(showStepSettingsIframeEvent, '*');
    document.body.style.background = 'transparent';
  }, []);

  if (isFlowError) {
    hideStepSettingsIframe();
    return null;
  }

  const isLoading = isLoadingFlow || isLoadingPiece;

  return (
    <Dialog
      open={isDialogOpen}
      onOpenChange={(open) => {
        setIsDialogOpen(open);
        if (!open) {
          hideStepSettingsIframe();
        }
      }}
    >
      <DialogContent
        showOverlay={false}
        className={cn('max-w-[90vw] w-full h-[90vh] max-h-[90vh] p-0', {
          'bg-transparent! border-none! focus:outline-hidden border-transparent! shadow-none!':
            isLoading,
        })}
        withCloseButton={false}
      >
        {isLoading && (
          <div className="flex justify-center items-center">
            <LoadingSpinner className="stroke-background size-[50px]" />
          </div>
        )}

        {!isLoading && selectedStep && flow && (
          <EmbeddedStepSettingsForm
            selectedStep={selectedStep}
            pieceModel={pieceModel ?? null}
            flow={flow}
            onClose={hideStepSettingsIframe}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};

type EmbeddedStepSettingsFormProps = {
  selectedStep: FlowAction | FlowTrigger;
  pieceModel: any;
  flow: any;
  onClose: () => void;
};

const EmbeddedStepSettingsForm = ({
  selectedStep,
  pieceModel,
  flow,
  onClose,
}: EmbeddedStepSettingsFormProps) => {
  return (
    <BuilderStateProvider
      flow={flow}
      flowVersion={flow.version}
      readonly={false}
      run={null}
      hideTestWidget={true}
      inputSampleData={{}}
      outputSampleData={{}}
      onStepSettingsClose={onClose}
    >
      <StepSettingsProvider
        pieceModel={pieceModel ?? undefined}
        selectedStep={selectedStep}
        hideTestStep={true}
      >
        <StepSettingsContainer />
      </StepSettingsProvider>
    </BuilderStateProvider>
  );
};
