import { t } from 'i18next';
import React, { useContext } from 'react';

import { JsonViewer } from '@/components/json-viewer';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StepStatusIcon } from '@/features/flow-runs/components/step-status-icon';
import { formatUtils } from '@/lib/utils';
import {
  AgentResult,
  FlowAction,
  isNil,
  StepOutputStatus,
} from '@activepieces/shared';

import { DynamicPropertiesContext } from '../piece-properties/dynamic-properties-context';

import {
  AgentTestStep,
  defaultAgentOutput,
  isRunAgent,
} from './agent-test-step';
import { TestButtonTooltip } from './test-step-tooltip';

type RetestSampleDataViewerProps = {
  isValid: boolean;
  currentStep?: FlowAction;
  isTesting: boolean;
  agentResult?: AgentResult;
  sampleData: unknown;
  sampleDataInput: unknown | null;
  errorMessage: string | undefined;
  lastTestDate: string | undefined;
  children?: React.ReactNode;
  consoleLogs?: string | null;
} & RetestButtonProps;

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
      <TestButtonTooltip invalid={!isValid}>
        <Button
          ref={ref}
          variant="outline"
          size="sm"
          disabled={!isValid || isSaving || isLoadingDynamicProperties}
          keyboardShortcut="G"
          onKeyboardShortcut={onRetest}
          onClick={onRetest}
          loading={isTesting}
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
  ({
    isValid,
    isTesting,
    sampleData,
    sampleDataInput,
    errorMessage,
    lastTestDate,
    agentResult,
    currentStep,
    children,
    consoleLogs,
    isSaving,
    onRetest,
  }: RetestSampleDataViewerProps) => {
    const renderViewer = () => {
      if (isRunAgent(currentStep)) {
        const resolvedAgentResult =
          agentResult ??
          (sampleData &&
          typeof sampleData === 'object' &&
          Object.keys(sampleData).length > 0
            ? (sampleData as AgentResult)
            : defaultAgentOutput);

        return (
          <AgentTestStep
            agentResult={resolvedAgentResult}
            errorMessage={errorMessage}
          />
        );
      }
      if (isNil(sampleDataInput) && !isConsoleLogsValid(consoleLogs)) {
        return (
          <JsonViewer json={errorMessage ?? sampleData} title={t('Output')} />
        );
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

            <TabsContent value="Output">
              <JsonViewer
                json={errorMessage ?? sampleData}
                title={t('Output')}
              />
            </TabsContent>

            {isConsoleLogsValid(consoleLogs) && (
              <TabsContent value="Logs">
                <JsonViewer json={consoleLogs} title={t('Logs')} />
              </TabsContent>
            )}
          </Tabs>
        );
      }
    };

    return (
      <>
        {!isTesting && children}
        <div className="grow flex flex-col w-full text-start gap-4">
          <div className="flex justify-center items-center">
            <div className="flex flex-col grow gap-1">
              <div className="text-md flex gap-1 items-center">
                {errorMessage ? (
                  <>
                    <StepStatusIcon status={StepOutputStatus.FAILED} size="5" />
                    <span>{t('Testing Failed')}</span>
                  </>
                ) : (
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
                  formatUtils.formatDate(new Date(lastTestDate))}
              </div>
            </div>

            <TestButtonTooltip invalid={!isValid}>
              <RetestButton
                isValid={isValid}
                isSaving={isSaving}
                isTesting={isTesting}
                onRetest={onRetest}
              />
            </TestButtonTooltip>
          </div>
          {renderViewer()}
        </div>
      </>
    );
  },
);

TestSampleDataViewer.displayName = 'TestSampleDataViewer';
