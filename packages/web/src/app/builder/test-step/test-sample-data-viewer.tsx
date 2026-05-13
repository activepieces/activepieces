import {
  AgentResult,
  AgentTaskStatus,
  FlowAction,
  isNil,
} from '@activepieces/shared';
import { t } from 'i18next';
import React, { useState } from 'react';

import { LoadingSpinner } from '@/components/custom/spinner';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { DataDisplayTabs } from '../data-display/data-display-tabs';

import { AgentTestStep, isRunAgent } from './agent-test-step';
import { TestPanelHeader } from './test-panel-header';

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

type ActiveTab = 'Input' | 'Output' | 'Logs';

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
      sampleDataInput,
      consoleLogs,
    } = props;
    const [requestedTab, setActiveTab] = useState<ActiveTab>('Output');
    const hasInput = !isNil(sampleDataInput);
    const hasLogs = isConsoleLogsValid(consoleLogs);
    const activeTab: ActiveTab =
      (requestedTab === 'Input' && !hasInput) ||
      (requestedTab === 'Logs' && !hasLogs)
        ? 'Output'
        : requestedTab;

    const isFailed =
      !isNil(errorMessage) ||
      (isRunAgent(currentStep) &&
        (sampleData as AgentResult | undefined)?.status ===
          AgentTaskStatus.FAILED);

    const status: 'success' | 'failed' | 'testing' | 'idle' = isTesting
      ? 'testing'
      : isFailed
      ? 'failed'
      : 'success';

    const outputData = errorMessage ?? sampleData;
    const activeData =
      activeTab === 'Input'
        ? sampleDataInput
        : activeTab === 'Logs'
        ? consoleLogs
        : outputData;
    const dataLabel = t(activeTab);

    return (
      <>
        {!isTesting && children}
        <div className="grow flex flex-col w-full text-start">
          <TestPanelHeader
            status={status}
            lastTestDate={lastTestDate}
            onRetest={onRetest}
            retestDisabled={!isValid || isSaving}
            retestLoading={isTesting || isSaving}
            copyableData={activeData}
            dataLabel={dataLabel}
            downloadFileName={`${
              currentStep?.name ?? 'output'
            }-${activeTab.toLowerCase()}`}
          />
          {errorMessage && !isTesting && (
            <div className="px-3 pb-2 text-xs text-muted-foreground">
              {t('Errors are not saved on refresh')}
            </div>
          )}
          <div className="flex-1 min-h-0 px-3 pb-3">
            {isTesting && !isRunAgent(currentStep) ? (
              <TestRunningState
                onCancel={hideCancel ? undefined : onCancelTesting}
              />
            ) : (
              <TestSampleDataViewerContent
                {...props}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
              />
            )}
          </div>
        </div>
      </>
    );
  },
);

type TestRunningStateProps = {
  onCancel?: () => void;
};

const TestRunningState = ({ onCancel }: TestRunningStateProps) => {
  return (
    <div className="h-full min-h-[140px] flex flex-col items-center justify-center gap-3 text-center">
      <div className="flex items-center gap-2">
        <LoadingSpinner className="size-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">
          {t('Running test...')}
        </span>
      </div>
      {onCancel && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onCancel}
          className="text-muted-foreground h-7"
        >
          {t('Cancel')}
        </Button>
      )}
    </div>
  );
};

TestSampleDataViewer.displayName = 'TestSampleDataViewer';

type TestSampleDataViewerContentProps = TestSampleDataViewerProps & {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
};

const TestSampleDataViewerContent = ({
  sampleData,
  sampleDataInput,
  consoleLogs,
  errorMessage,
  currentStep,
  activeTab,
  setActiveTab,
}: TestSampleDataViewerContentProps) => {
  if (isRunAgent(currentStep) && !errorMessage) {
    return (
      <AgentTestStep
        agentResult={getAgentResult(sampleData)}
        errorMessage={errorMessage}
      />
    );
  }
  if (isNil(sampleDataInput) && !isConsoleLogsValid(consoleLogs)) {
    return (
      <DataDisplayTabs data={errorMessage ?? sampleData} title={t('Output')} />
    );
  }
  const showThree = !isNil(sampleDataInput) && isConsoleLogsValid(consoleLogs);
  return (
    <Tabs
      value={activeTab}
      onValueChange={(value) => setActiveTab(value as ActiveTab)}
    >
      <TabsList
        className={`grid w-full h-9 ${
          showThree ? 'grid-cols-3' : 'grid-cols-2'
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
          <DataDisplayTabs data={sampleDataInput} title={t('Input')} />
        </TabsContent>
      )}

      <TabsContent value="Output">
        <DataDisplayTabs
          data={errorMessage ?? sampleData}
          title={t('Output')}
        />
      </TabsContent>

      {isConsoleLogsValid(consoleLogs) && (
        <TabsContent value="Logs">
          <DataDisplayTabs data={consoleLogs} title={t('Logs')} />
        </TabsContent>
      )}
    </Tabs>
  );
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
