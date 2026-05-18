import {
  AgentResult,
  AgentTaskStatus,
  FlowAction,
  isNil,
  tryParseFriendlyPieceError,
} from '@activepieces/shared';
import { t } from 'i18next';
import { Loader2, Play } from 'lucide-react';
import React, { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

import { DataDisplayTabs } from '../data-display/data-display-tabs';
import { FriendlyErrorView } from '../data-display/friendly-error-view';

import { AgentTestStep, isRunAgent } from './agent-test-step';
import { TestPanelHeader } from './test-panel-header';
import { TestPanelViewToggle } from './test-panel-view-toggle';
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

    const showAgentView = isRunAgent(currentStep) && !errorMessage;
    const friendlyError =
      !isTesting && !showAgentView && activeTab === 'Output'
        ? tryParseFriendlyPieceError(errorMessage)
        : null;

    return (
      <div className="flex flex-col h-full w-full min-h-0">
        <TestPanelHeader status={status} lastTestDate={lastTestDate} />
        {!isTesting && children}
        <div className="flex-1 flex flex-col w-full text-start min-h-0">
          {errorMessage && !isTesting && (
            <div className="px-3 pt-2 text-xs text-muted-foreground shrink-0">
              {t('Errors are not saved on refresh')}
            </div>
          )}
          {!showAgentView && (
            <TestPanelToolbar
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              hasInput={hasInput}
              hasLogs={hasLogs}
              disabled={isTesting}
            />
          )}
          <div className="flex-1 min-h-0 px-3 pb-3 overflow-auto">
            {isTesting && !showAgentView ? (
              <TestingPreviewContent data={activeData} />
            ) : showAgentView ? (
              <AgentTestStep
                agentResult={getAgentResult(sampleData)}
                errorMessage={errorMessage}
              />
            ) : friendlyError ? (
              <FriendlyErrorView error={friendlyError} />
            ) : (
              <DataDisplayTabs
                data={activeData}
                title={t(activeTab)}
                copyableData={activeData}
                downloadFileName={`${
                  currentStep?.name ?? 'output'
                }-${activeTab.toLowerCase()}`}
              />
            )}
          </div>
        </div>
        {isTesting ? (
          <CancelTestingBar
            onCancel={hideCancel ? undefined : onCancelTesting}
          />
        ) : (
          <RetestActionBar
            onRetest={onRetest}
            disabled={!isValid || isSaving}
            isValid={isValid}
            isSaving={isSaving}
          />
        )}
      </div>
    );
  },
);

type TestPanelToolbarProps = {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  hasInput: boolean;
  hasLogs: boolean;
  disabled?: boolean;
};

const TestPanelToolbar = ({
  activeTab,
  setActiveTab,
  hasInput,
  hasLogs,
  disabled = false,
}: TestPanelToolbarProps) => (
  <div className="flex items-center justify-between px-3 py-2 gap-2 shrink-0">
    <SegmentedTabs
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      hasInput={hasInput}
      hasLogs={hasLogs}
      disabled={disabled}
    />
    <TestPanelViewToggle disabled={disabled} />
  </div>
);

type SegmentedTabsProps = TestPanelToolbarProps;

const SegmentedTabs = ({
  activeTab,
  setActiveTab,
  hasInput,
  hasLogs,
  disabled,
}: SegmentedTabsProps) => (
  <div
    className={cn(
      'inline-flex items-center rounded-md bg-muted p-0.5 gap-0.5',
      disabled && 'opacity-50',
    )}
  >
    <SegmentedTabsButton
      label={t('Output')}
      active={activeTab === 'Output'}
      onClick={() => setActiveTab('Output')}
      disabled={disabled}
    />
    {hasInput && (
      <SegmentedTabsButton
        label={t('Input')}
        active={activeTab === 'Input'}
        onClick={() => setActiveTab('Input')}
        disabled={disabled}
      />
    )}
    {hasLogs && (
      <SegmentedTabsButton
        label={t('Logs')}
        active={activeTab === 'Logs'}
        onClick={() => setActiveTab('Logs')}
        disabled={disabled}
      />
    )}
  </div>
);

type SegmentedTabsButtonProps = {
  label: string;
  active: boolean;
  onClick: () => void;
  disabled?: boolean;
};

const SegmentedTabsButton = ({
  label,
  active,
  onClick,
  disabled,
}: SegmentedTabsButtonProps) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className={cn(
      'px-3 py-1 text-xs font-medium rounded-sm transition-colors disabled:cursor-not-allowed',
      active
        ? 'bg-background text-foreground shadow-sm'
        : 'text-muted-foreground hover:text-foreground',
    )}
  >
    {label}
  </button>
);

type RetestActionBarProps = {
  onRetest: () => void;
  disabled: boolean;
  isValid: boolean;
  isSaving: boolean;
};

const RetestActionBar = ({
  onRetest,
  disabled,
  isValid,
  isSaving,
}: RetestActionBarProps) => (
  <div
    data-test-panel-trigger
    className="relative px-3 py-3 bg-background z-10 shrink-0"
  >
    <div
      aria-hidden
      className="pointer-events-none absolute -top-6 left-0 right-0 h-6 bg-gradient-to-t from-background to-transparent"
    />
    <TestButtonTooltip saving={isSaving} invalid={!isValid}>
      <Button
        variant="outline"
        onClick={onRetest}
        disabled={disabled}
        keyboardShortcut="G"
        onKeyboardShortcut={onRetest}
        className="w-full justify-center bg-primary/5 enabled:hover:bg-primary/15 enabled:hover:text-primary text-primary border-primary/20"
        size="sm"
      >
        <Play className="size-4 fill-current" />
        {t('Retest Step')}
      </Button>
    </TestButtonTooltip>
  </div>
);

type CancelTestingBarProps = {
  onCancel?: () => void;
};

const CancelTestingBar = ({ onCancel }: CancelTestingBarProps) => (
  <div
    data-test-panel-trigger
    className="relative px-3 py-3 bg-background z-10 shrink-0"
  >
    <div
      aria-hidden
      className="pointer-events-none absolute -top-6 left-0 right-0 h-6 bg-gradient-to-t from-background to-transparent"
    />
    <Button
      onClick={onCancel}
      disabled={!onCancel}
      variant="outline"
      className="w-full justify-center bg-primary/5 hover:bg-primary/10 text-primary border-primary/20"
      size="sm"
    >
      <Loader2 className="size-4 animate-spin" />
      {t('Cancel Testing')}
    </Button>
  </div>
);

type TestingPreviewContentProps = {
  data: unknown;
};

const TestingPreviewContent = ({ data }: TestingPreviewContentProps) => {
  if (!isNil(data)) {
    return (
      <div className="opacity-40 animate-pulse pointer-events-none select-none">
        <DataDisplayTabs data={data} title={t('Output')} />
      </div>
    );
  }
  return <JsonTreeSkeleton />;
};

const JsonTreeSkeleton = () => (
  <div className="flex flex-col gap-3 py-3 animate-pulse">
    <Skeleton className="h-3 w-24" />
    <div className="pl-4 flex flex-col gap-2.5">
      <Skeleton className="h-3 w-32" />
      <div className="pl-4 flex flex-col gap-2.5">
        <Skeleton className="h-3 w-48" />
        <Skeleton className="h-3 w-40" />
        <Skeleton className="h-3 w-44" />
      </div>
      <Skeleton className="h-3 w-28" />
      <div className="pl-4 flex flex-col gap-2.5">
        <Skeleton className="h-3 w-36" />
        <Skeleton className="h-3 w-52" />
      </div>
      <Skeleton className="h-3 w-32" />
    </div>
  </div>
);

TestSampleDataViewer.displayName = 'TestSampleDataViewer';

//In case the user has mangled sample data
function getAgentResult(sampleData: unknown) {
  if (isNil(sampleData)) return undefined;
  if (typeof sampleData !== 'object' || sampleData === null) return undefined;
  if (!('status' in sampleData)) return undefined;
  if (!('steps' in sampleData)) return undefined;
  if (!('prompt' in sampleData)) return undefined;
  return sampleData as AgentResult;
}
