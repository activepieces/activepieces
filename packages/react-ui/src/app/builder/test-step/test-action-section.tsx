import { useMutation } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { t } from 'i18next';
import React, { useEffect, useState } from 'react';
import { useFormContext } from 'react-hook-form';

import { useSocket } from '@/components/socket-provider';
import { Button } from '@/components/ui/button';
import { Dot } from '@/components/ui/dot';
import { INTERNAL_ERROR_TOAST, useToast } from '@/components/ui/use-toast';
import { Action, StepRunResponse, isNil } from '@activepieces/shared';
import { flowRunsApi } from '../../../features/flow-runs/lib/flow-runs-api';
import { TestSampleDataViewer } from './test-sample-data-viewer';
import { TestButtonTooltip } from './test-step-tooltip';
import { testStepUtils } from './test-step-utils';
import { sampleDataApi } from '@/features/flows/lib/sample-data-api';
import { sampleDataHooks } from '@/features/flows/lib/sample-data-hooks';

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

    const { data: sampleData, isLoading: isSampleDataLoading, refetch: refetchSampleData } = sampleDataHooks.useSampleData(formValues.settings.inputUiInfo?.sampleDataFileId)

    const sampleDataExists = !isNil(lastTestDate) || !isNil(errorMessage);

    const socket = useSocket();

    const { mutate, isPending: isTesting } = useMutation<
      StepRunResponse & { sampleDataFileId?: string },
      Error,
      void
    >({
      mutationFn: async () => {
        const testStepResponse = await flowRunsApi.testStep(socket, {
          flowVersionId,
          stepName: formValues.name,
        });
        let sampleDataFileId: string | undefined = undefined;
        if (testStepResponse.success) {
          const sampleFile = await sampleDataApi.save({
            flowVersionId,
            stepName: formValues.name,
            payload: testStepResponse.output,
          })
          sampleDataFileId = sampleFile.id
        }
        return {
          ...testStepResponse,
          sampleDataFileId,
        }
      },
      onSuccess: ({ success, output, sampleDataFileId }) => {
        if (success) {
          setErrorMessage(undefined);

          form.setValue(
            'settings.inputUiInfo.sampleDataFileId',
            sampleDataFileId,
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
              JSON.stringify(output) ||
              t('Failed to run test step and no error message was returned'),
            ),
          );
        }
        refetchSampleData()
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
        {sampleDataExists && !isSampleDataLoading && (
          <TestSampleDataViewer
            onRetest={mutate}
            isValid={isValid}
            isSaving={isSaving}
            isTesting={isTesting}
            sampleData={sampleData}
            errorMessage={errorMessage}
            lastTestDate={lastTestDate}
          ></TestSampleDataViewer>
        )}
      </>
    );
  },
);
TestActionSection.displayName = 'TestActionSection';

export { TestActionSection };
