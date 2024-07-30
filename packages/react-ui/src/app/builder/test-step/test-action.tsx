import { useMutation } from '@tanstack/react-query';
import dayjs from 'dayjs';
import React, { useState } from 'react';
import { useFormContext } from 'react-hook-form';

import { JsonViewer } from '@/components/json-viewer';
import { useSocket } from '@/components/socket-provider';
import { Button } from '@/components/ui/button';
import {
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
  Tooltip,
} from '@/components/ui/tooltip';
import { INTERNAL_ERROR_TOAST, useToast } from '@/components/ui/use-toast';
import { StepStatusIcon } from '@/features/flow-runs/components/step-status-icon';
import { flowVersionUtils } from '@/features/flows/lib/flow-version-util';
import { flowsApi } from '@/features/flows/lib/flows-api';
import { formatUtils } from '@/lib/utils';
import {
  Action,
  StepOutputStatus,
  StepRunResponse,
  isNil,
} from '@activepieces/shared';

type TestActionComponentProps = {
  flowVersionId: string;
  isSaving: boolean;
};

const TestButtonTooltip = ({
  children,
  disabled,
}: {
  children: React.ReactNode;
  disabled: boolean;
}) => {
  if (!disabled) {
    return <>{children}</>;
  }
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild className="disabled:pointer-events-auto">
          {children}
        </TooltipTrigger>
        <TooltipContent side="bottom">Please fix inputs first</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
const TestActionComponent = React.memo(
  ({ flowVersionId, isSaving }: TestActionComponentProps) => {
    const { toast } = useToast();
    const [errorMessage, setErrorMessage] = useState<string | undefined>(
      undefined,
    );
    const form = useFormContext<Action>();

    const formValues = form.getValues();
    const [lastTestDate, setLastTestDate] = useState(
      formValues.settings.inputUiInfo?.lastTestDate,
    );
    const { currentSelectedData } = formValues.settings.inputUiInfo ?? {};
    const sampleDataExists = !isNil(currentSelectedData) || !isNil(errorMessage);

    const socket = useSocket();

    const { mutate, isPending } = useMutation<StepRunResponse, Error, void>({
      mutationFn: async () => {
        return flowsApi.testStep(socket, {
          flowVersionId,
          stepName: formValues.name,
        });
      },
      onSuccess: (stepResponse) => {
        if (stepResponse.success) {
          setErrorMessage(undefined);
          form.setValue(
            'settings.inputUiInfo',
            {
              ...formValues.settings.inputUiInfo,
              currentSelectedData: flowVersionUtils.formatSampleData(
                stepResponse.output,
                formValues.type,
              ),
              lastTestDate: dayjs().toISOString(),
            },
            { shouldValidate: true },
          );
        } else {
          setErrorMessage(
            flowVersionUtils.formatErrorMessage(
              stepResponse.output?.toString() ||
                'Failed to run test step and no error message was returned',
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
            <TestButtonTooltip disabled={!form.formState.isValid}>
              <Button
                variant="outline"
                size="sm"
                onClick={() => mutate()}
                keyboardShortcut="G"
                onKeyboardShortcut={mutate}
                loading={isPending}
                disabled={isSaving || !form.formState.isValid}
              >
                Test Step
              </Button>
            </TestButtonTooltip>
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
              <TestButtonTooltip disabled={!form.formState.isValid}>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!form.formState.isValid || isSaving}
                  keyboardShortcut="G"
                  onKeyboardShortcut={mutate}
                  onClick={() => mutate()}
                  loading={isPending}
                >
                  Retest
                </Button>
              </TestButtonTooltip>
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
