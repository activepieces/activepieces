import { useMutation } from '@tanstack/react-query';
import dayjs from 'dayjs';
import React, { useEffect, useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { t } from 'i18next';

import { useSocket } from '@/components/socket-provider';
import { Button } from '@/components/ui/button';
import { Dot } from '@/components/ui/dot';
import { INTERNAL_ERROR_TOAST, useToast } from '@/components/ui/use-toast';
import { flowsApi } from '@/features/flows/lib/flows-api';
import { formatUtils } from '@/lib/utils';
import { Action, StepRunResponse, isNil } from '@activepieces/shared';

import { TestSampleDataViewer } from './test-sample-data-viewer';
import { TestButtonTooltip } from './test-step-tooltip';
import { testStepUtils } from './test-step-utils';

type TestActionComponentProps = {
  isSaving: boolean;
  flowVersionId: string;
};

const TestActionSection = React.memo(
  ({ isSaving, flowVersionId }: TestActionComponentProps) => {
    const { toast } = useToast();
    const [errorMessage, setErrorMessage] = useState<string | undefined>(
      undefined,
    );
    const form = useFormContext<Action>();
    const formValues = form.getValues();

    const [isValid, setIsValid] = useState(false);

    useEffect(() => {
      setIsValid(form.formState.isValid);
    }, [form.formState.isValid]);

    const [lastTestDate, setLastTestDate] = useState(
      formValues.settings.inputUiInfo?.lastTestDate,
    );
    const { currentSelectedData } = formValues.settings.inputUiInfo ?? {};
    const sampleDataExists = !isNil(lastTestDate) || !isNil(errorMessage);

    const socket = useSocket();

    const { mutate, isPending: isTesting } = useMutation<
      StepRunResponse,
      Error,
      void
    >({
      mutationFn: async () => {
        return flowsApi.testStep(socket, {
          flowVersionId,
          stepName: formValues.name,
        });
      },
      onSuccess: (stepResponse) => {
        const formattedResponse = formatUtils.formatStepInputAndOutput(
          stepResponse.output,
          null,
        );
        if (stepResponse.success) {
          setErrorMessage(undefined);

          form.setValue(
            'settings.inputUiInfo.currentSelectedData',
            formattedResponse,
            { shouldValidate: true },
          );
          form.setValue(
            'settings.inputUiInfo.lastTestDate',
            dayjs().toISOString(),
            { shouldValidate: true },
          );
        } else {
          setErrorMessage(
            testStepUtils.formatErrorMessage(
              JSON.stringify(formattedResponse) ||
                t('Failed to run test step and no error message was returned'),
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
        {!sampleDataExists && (
          <div className="flex-grow flex justify-center items-center w-full h-full">
            <TestButtonTooltip disabled={!isValid}>
              <Button
                variant="outline"
                size="sm"
                onClick={() => mutate()}
                keyboardShortcut="G"
                onKeyboardShortcut={mutate}
                loading={isTesting}
                disabled={!isValid}
              >
                <Dot animation={true} variant={'primary'}></Dot>
                {t('Test Step')}
              </Button>
            </TestButtonTooltip>
          </div>
        )}
        {sampleDataExists && (
          <TestSampleDataViewer
            onRetest={mutate}
            isValid={isValid}
            isSaving={isSaving}
            isTesting={isTesting}
            currentSelectedData={currentSelectedData}
            errorMessage={errorMessage}
            lastTestDate={lastTestDate}
            type={formValues.type}
          ></TestSampleDataViewer>
        )}
      </>
    );
  },
);
TestActionSection.displayName = 'TestActionSection';

export { TestActionSection };