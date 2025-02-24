import { useMutation } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { t } from 'i18next';
import React, { useEffect, useState } from 'react';
import { useFormContext } from 'react-hook-form';

import { useSocket } from '@/components/socket-provider';
import { Button } from '@/components/ui/button';
import { Dot } from '@/components/ui/dot';
import { INTERNAL_ERROR_TOAST, useToast } from '@/components/ui/use-toast';
import { sampleDataApi } from '@/features/flows/lib/sample-data-api';
import {
  Action,
  ActionType,
  FileType,
  StepRunResponse,
  flowStructureUtil,
  isNil,
} from '@activepieces/shared';

import { flowRunsApi } from '../../../features/flow-runs/lib/flow-runs-api';
import { useBuilderStateContext } from '../builder-hooks';

import { TestSampleDataViewer } from './test-sample-data-viewer';
import { TestButtonTooltip } from './test-step-tooltip';
import { testStepUtils } from './test-step-utils';

type TestActionComponentProps = {
  isSaving: boolean;
  flowVersionId: string;
  projectId: string;
};

const getSampleDataInput = (formValues: Action) => {
  switch (formValues.type) {
    case ActionType.CODE:
      return formValues.settings.input;
    case ActionType.LOOP_ON_ITEMS:
      return formValues.settings.items;
    case ActionType.PIECE:
      return formValues.settings.input;
    case ActionType.ROUTER:
      return {
        executionType: formValues.settings.executionType,
        branches: formValues.settings.branches,
      };
    default:
      return {};
  }
};

const TestActionSection = React.memo(
  ({ isSaving, flowVersionId, projectId }: TestActionComponentProps) => {
    const { toast } = useToast();
    const [errorMessage, setErrorMessage] = useState<string | undefined>(
      undefined,
    );
    const form = useFormContext<Pick<Action, 'settings' | 'name' | 'type'>>();
    const formValues = form.getValues();
    const [consoleLogs, setConsoleLogs] = useState<null | string>(null);
    const {
      sampleData,
      sampleDataInput,
      setSampleData,
      setSampleDataInput,
      selectedStep,
      trigger,
    } = useBuilderStateContext((state) => {
      return {
        sampleData: state.sampleData[formValues.name],
        sampleDataInput: state.sampleDataInput[formValues.name],
        setSampleData: state.setSampleData,
        setSampleDataInput: state.setSampleDataInput,
        selectedStep: state.selectedStep,
        trigger: state.flowVersion.trigger,
      };
    });
    const [isValid, setIsValid] = useState(false);

    useEffect(() => {
      setIsValid(form.formState.isValid);
    }, [form.formState.isValid]);

    const [lastTestDate, setLastTestDate] = useState(
      formValues.settings.inputUiInfo?.lastTestDate,
    );

    const sampleDataExists = !isNil(lastTestDate) || !isNil(errorMessage);

    const socket = useSocket();

    const { mutate, isPending: isTesting } = useMutation<
      StepRunResponse & {
        sampleDataFileId?: string;
        sampleDataInputFileId?: string;
      },
      Error,
      void
    >({
      mutationFn: async () => {
        const testStepResponse = await flowRunsApi.testStep(socket, {
          flowVersionId,
          stepName: formValues.name,
        });
        let sampleDataFileId: string | undefined = undefined;
        if (testStepResponse.success && !isNil(testStepResponse.output)) {
          const sampleFile = await sampleDataApi.save({
            flowVersionId,
            stepName: formValues.name,
            payload: testStepResponse.output,
            projectId,
            fileType: FileType.SAMPLE_DATA,
          });
          sampleDataFileId = sampleFile.id;
        }
        const sampleDataInputFile = await sampleDataApi.save({
          flowVersionId,
          stepName: formValues.name,
          payload: formValues.settings,
          projectId,
          fileType: FileType.SAMPLE_DATA_INPUT,
        });
        return {
          ...testStepResponse,
          sampleDataFileId,
          sampleDataInputFileId: sampleDataInputFile.id,
        };
      },
      onSuccess: ({
        success,
        output,
        sampleDataFileId,
        sampleDataInputFileId,
        standardOutput,
        standardError,
      }) => {
        if (success) {
          setErrorMessage(undefined);

          const newInputUiInfo = {
            ...formValues.settings.inputUiInfo,
            sampleDataFileId,
            sampleDataInputFileId,
            currentSelectedData: undefined,
            lastTestDate: dayjs().toISOString(),
          };
          form.setValue(
            'settings.inputUiInfo',
            newInputUiInfo as typeof formValues.settings.inputUiInfo,
            {
              shouldValidate: true,
            },
          );
        } else {
          setErrorMessage(
            testStepUtils.formatErrorMessage(
              JSON.stringify(output) ||
                t('Failed to run test step and no error message was returned'),
            ),
          );
        }
        setSampleData(formValues.name, output);
        setSampleDataInput(
          formValues.name,
          getSampleDataInput(formValues as Action),
        );
        setConsoleLogs(standardOutput || standardError);
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
            sampleData={sampleData}
            sampleDataInput={sampleDataInput}
            errorMessage={errorMessage}
            lastTestDate={lastTestDate}
            consoleLogs={
              selectedStep &&
              flowStructureUtil.getStep(selectedStep, trigger)?.type ===
                ActionType.CODE
                ? consoleLogs
                : null
            }
          ></TestSampleDataViewer>
        )}
      </>
    );
  },
);
TestActionSection.displayName = 'TestActionSection';

export { TestActionSection };
