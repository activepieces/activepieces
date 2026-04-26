import {
  AgentResult,
  AgentTaskStatus,
  FlowAction,
  isNil,
  StepOutputStatus,
} from '@activepieces/shared';
import { t } from 'i18next';
import React, { useContext } from 'react';

import { StepOutputSkeleton } from '@/app/components/step-output-skeleton';
import { JsonViewer } from '@/components/custom/json-viewer';
import { SmartOutputViewer } from '@/components/custom/smart-output-viewer';
import type { OutputDisplayHints } from '@/components/custom/smart-output-viewer/types';
import { LoadingSpinner } from '@/components/custom/spinner';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StepStatusIcon } from '@/features/flow-runs';
import { formatUtils } from '@/lib/format-utils';

import { DynamicPropertiesContext } from '../piece-properties/dynamic-properties-context';

import { AgentTestStep, isRunAgent } from './agent-test-step';
import { TestButtonTooltip } from './test-step-tooltip';

type TestSampleDataViewerProps = {
  isValid: boolean;
  currentStep?: FlowAction;
  isTesting: boolean;
  agentResult?: AgentResult;
  sampleData?: unknown;
  sampleDataInput?: unknown | null;
  errorMessage: string | null;
  lastTestDate: string | undefined;
  children?: React.ReactNode;
  consoleLogs: string | null;
  pieceName?: string;
  stepName?: string;
  pieceVersion?: string;
  pieceHints?: OutputDisplayHints | null;
} & (
  | {
      hideCancel: true;
      onCancelTesting?: undefined;
    }
  | {
      hideCancel?: false;
      onCancelTesting: () => void;
    }
) &
  RetestButtonProps;

type RetestButtonProps = {
  isValid: boolean;
  isSaving: boolean;
  isTesting: boolean;
  onRetest: () => void;
};

const RetestButton = React.forwardRef<HTMLButtonElement, RetestButtonProps>(
  ({ isValid, isSaving, isTesting, onRetest }, ref) => {
    const { isLoadingDynamicProperties } = useContext(DynamicPropertiesContext);
    return (
      <TestButtonTooltip saving={isSaving} invalid={!isValid}>
        <Button
          ref={ref}
          variant="outline"
          size="sm"
          disabled={!isValid || isSaving || isLoadingDynamicProperties}
          keyboardShortcut="G"
          onKeyboardShortcut={onRetest}
          onClick={onRetest}
          loading={isTesting || isSaving}
        >
          {t('Test')}
        </Button>
      </TestButtonTooltip>
    );
  },
);
RetestButton.displayName = 'TestButton';

const isConsoleLogsValid = (value: unknown) => {
  if (isNil(value)) return false;
  return value !== '';
};

export const TestSampleDataViewer = React.memo(
  (props: TestSampleDataViewerProps) => {
    const {
      isValid,
      isTesting,
      sampleData,
      errorMessage,
      lastTestDate,
      currentStep,
      children,
      isSaving,
      onRetest,
      onCancelTesting,
      hideCancel,
    } = props;
    const isFailed =
      isRunAgent(currentStep) &&
      ((sampleData as AgentResult | undefined)?.status ===
        AgentTaskStatus.FAILED ||
        !isNil(errorMessage));

    return (
      <>
        {!isTesting && children}
        <div className="grow flex flex-col w-full text-start gap-4">
          <div className="flex justify-center items-center">
            <div className="flex flex-col grow gap-1">
              <div className="text-md flex gap-1 items-center">
                {isTesting && (
                  <div className="flex items-center gap-1">
                    <span className="flex gap-1 items-center">
                      <LoadingSpinner className="w-4 h-4" />
                      {isRunAgent(currentStep)
                        ? t('Agent running...')
                        : t('Testing...')}
                    </span>
                  </div>
                )}

                {isRunAgent(currentStep) && !isTesting && (
                  <>
                    <StepStatusIcon
                      status={
                        isFailed
                          ? StepOutputStatus.FAILED
                          : StepOutputStatus.SUCCEEDED
                      }
                      size="5"
                    />
                    <span>
                      {t(isFailed ? 'Testing Failed' : 'Tested Successfully')}
                    </span>
                  </>
                )}

                {errorMessage && !isTesting && !isRunAgent(currentStep) && (
                  <>
                    <StepStatusIcon status={StepOutputStatus.FAILED} size="5" />
                    <span>{t('Testing Failed')}</span>
                  </>
                )}

                {!isTesting && !isRunAgent(currentStep) && !errorMessage && (
                  <>
                    <StepStatusIcon
                      status={StepOutputStatus.SUCCEEDED}
                      size="5"
                    />
                    <span>{t('Tested Successfully')}</span>
                  </>
                )}
              </div>
              <div className="text-muted-foreground text-xs">
                {lastTestDate &&
                  !errorMessage &&
                  !isTesting &&
                  formatUtils.formatDateWithTime(new Date(lastTestDate), false)}
                {errorMessage && !isTesting && (
                  <span>{t('Errors are not saved on refresh')}</span>
                )}
              </div>
            </div>

            {!isTesting && (
              <TestButtonTooltip saving={isSaving} invalid={!isValid}>
                <RetestButton
                  isValid={isValid}
                  isSaving={isSaving}
                  isTesting={isTesting}
                  onRetest={onRetest}
                />
              </TestButtonTooltip>
            )}
            {isTesting && !hideCancel && (
              <Button size={'sm'} variant={'outline'} onClick={onCancelTesting}>
                {t('Cancel')}
              </Button>
            )}
          </div>
          <TestSampleDataViewerContent {...props} />
        </div>
      </>
    );
  },
);

TestSampleDataViewer.displayName = 'TestSampleDataViewer';

const TestSampleDataViewerContent = ({
  sampleData,
  sampleDataInput,
  consoleLogs,
  errorMessage,
  currentStep,
  isTesting,
  pieceName,
  stepName,
  pieceHints,
}: TestSampleDataViewerProps) => {
  if (isTesting && !isRunAgent(currentStep)) {
    return <StepOutputSkeleton className="px-1 " />;
  }
  if (isRunAgent(currentStep) && !errorMessage) {
    return (
      <AgentTestStep
        agentResult={getAgentResult(sampleData)}
        errorMessage={errorMessage}
      />
    );
  }
  const outputViewer = errorMessage ? (
    <JsonViewer json={errorMessage} title={t('Output')} />
  ) : (
    <SmartOutputViewer
      json={sampleData}
      title={t('Output')}
      pieceName={pieceName}
      stepName={stepName}
      pieceHints={pieceHints}
    />
  );
  if (isNil(sampleDataInput) && !isConsoleLogsValid(consoleLogs)) {
    return outputViewer;
  } else {
    return (
      <Tabs defaultValue="Output">
        <TabsList
          className={`grid w-full ${
            !isNil(sampleDataInput) && isConsoleLogsValid(consoleLogs)
              ? 'w-[300px] grid-cols-3'
              : 'w-[250px] grid-cols-2'
          }`}
        >
          {!isNil(sampleDataInput) && (
            <TabsTrigger value="Input">{t('Input')}</TabsTrigger>
          )}
          <TabsTrigger value="Output">{t('Output')}</TabsTrigger>
          {isConsoleLogsValid(consoleLogs) && (
            <TabsTrigger value="Logs">{t('Logs')}</TabsTrigger>
          )}
        </TabsList>

        {!isNil(sampleDataInput) && (
          <TabsContent value="Input">
            <JsonViewer json={sampleDataInput} title={t('Input')} />
          </TabsContent>
        )}

        <TabsContent value="Output">{outputViewer}</TabsContent>

        {isConsoleLogsValid(consoleLogs) && (
          <TabsContent value="Logs">
            <JsonViewer json={consoleLogs} title={t('Logs')} />
          </TabsContent>
        )}
      </Tabs>
    );
  }
};

//In case the user has mangled sample data
function getAgentResult(sampleData: unknown) {
  if (isNil(sampleData)) return undefined;
  if (typeof sampleData !== 'object' || sampleData === null) return undefined;
  if (!('status' in sampleData)) return undefined;
  if (!('steps' in sampleData)) return undefined;
  if (!('prompt' in sampleData)) return undefined;
  return sampleData as AgentResult;
}
