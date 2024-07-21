import { useMutation } from '@tanstack/react-query';
import dayjs from 'dayjs';
import React, { useState } from 'react';

import {
  PublishButtonStatus,
  useBuilderStateContext,
} from '@/app/builder/builder-hooks';
import { JsonViewer } from '@/components/json-viewer';
import { useSocket } from '@/components/socket-provider';
import { Button } from '@/components/ui/button';
import {
  INTERNAL_ERROR_TOAST,
  UNSAVED_CHANGES_TOAST,
  useToast,
} from '@/components/ui/use-toast';
import { StepStatusIcon } from '@/features/flow-runs/components/step-status-icon';
import { flowVersionUtils } from '@/features/flows/lib/flow-version-util';
import { flowsApi } from '@/features/flows/lib/flows-api';
import { formatUtils } from '@/lib/utils';
import {
  Action,
  FlowOperationType,
  StepOutputStatus,
  StepRunResponse,
  isNil,
} from '@activepieces/shared';

type TestActionComponentProps = {
  selectedStep: Action;
};

const TestActionComponent = React.memo(
  ({ selectedStep }: TestActionComponentProps) => {
    const { toast } = useToast();
    const [errorMessage, setErrorMessage] = useState<string | undefined>(
      undefined,
    );
    const [flowVersionId, applyOperation, isSaving] = useBuilderStateContext(
      (state) => [
        state.flowVersion.id,
        state.applyOperation,
        state.publishButtonStatus === PublishButtonStatus.LOADING,
      ],
    );

    const [lastTestDate, setLastTestDate] = useState(
      selectedStep.settings.inputUiInfo?.lastTestDate,
    );
    const { currentSelectedData } = selectedStep.settings.inputUiInfo ?? {};
    const sampleDataExists = !isNil(currentSelectedData);

    const socket = useSocket();
    const { mutate, isPending } = useMutation<StepRunResponse, Error, void>({
      mutationFn: async () => {
        return flowsApi.testStep(socket, {
          flowVersionId,
          stepName: selectedStep.name,
        });
      },
      onSuccess: (stepResponse) => {
        if (stepResponse.success) {
          setErrorMessage(undefined);
          const newAction = flowVersionUtils.buildActionWithSampleData(
            selectedStep,
            stepResponse.output,
          );
          applyOperation(
            {
              type: FlowOperationType.UPDATE_ACTION,
              request: newAction,
            },
            () => toast(UNSAVED_CHANGES_TOAST),
          );
        } else {
          setErrorMessage(
            flowVersionUtils.formatErrorMessage(
              stepResponse.output?.toString() || '',
            ),
          );
        }
        setLastTestDate(dayjs().toISOString());
      },
      onError: (error) => {
        console.error(error);
        toast(INTERNAL_ERROR_TOAST);
      },
    });
    return (
      <>
        <div className="text-md font-semibold">Generate Sample Data</div>
        {!sampleDataExists && (
          <div className="flex-grow flex justify-center items-center w-full h-full">
            <Button
              variant="outline"
              size="sm"
              onClick={() => mutate()}
              keyboardShortcut="G"
              onKeyboardShortcut={mutate}
              loading={isPending || isSaving}
            >
              Test Step
            </Button>
          </div>
        )}
        {sampleDataExists && (
          <div className="flex-grow flex flex-col w-full text-start gap-4">
            <div className="flex justify-center items-center">
              <div className="flex flex-col flex-grow gap-2">
                <div className="text-md flex gap-2 justyf-center items-center">
                  {errorMessage ? (
                    <>
                      <StepStatusIcon
                        status={StepOutputStatus.FAILED}
                        size="5"
                      ></StepStatusIcon>
                      <span>Testing Failed</span>
                    </>
                  ) : (
                    <>
                      <StepStatusIcon
                        status={StepOutputStatus.SUCCEEDED}
                        size="5"
                      ></StepStatusIcon>
                      <span> Tested Successfully</span>
                    </>
                  )}
                </div>
                <div className="text-muted-foreground text-xs">
                  {lastTestDate &&
                    formatUtils.formatDate(new Date(lastTestDate))}
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                keyboardShortcut="G"
                onKeyboardShortcut={mutate}
                onClick={() => mutate()}
                loading={isPending || isSaving}
              >
                Retest
              </Button>
            </div>
            <JsonViewer
              json={errorMessage ?? currentSelectedData}
              title="Output"
            ></JsonViewer>
          </div>
        )}
      </>
    );
  },
);
TestActionComponent.displayName = 'TestActionComponent';

export { TestActionComponent };
