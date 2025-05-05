import { t } from 'i18next';
import React from 'react';

import { JsonViewer } from '@/components/json-viewer';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StepStatusIcon } from '@/features/flow-runs/components/step-status-icon';
import { formatUtils } from '@/lib/utils';
import { isNil, StepOutputStatus } from '@activepieces/shared';

import { TestButtonTooltip } from './test-step-tooltip';

type TestSampleDataViewerProps = {
  isValid: boolean;
  isTesting: boolean;
  sampleData: unknown;
  sampleDataInput: unknown | null;
  errorMessage: string | undefined;
  lastTestDate: string | undefined;
  children?: React.ReactNode;
  consoleLogs?: string | null;
} & DefaultTestingButtonProps;

type DefaultTestingButtonProps = {
  isValid: boolean;
  isSaving: boolean;
  isTesting: boolean;
  onRetest: () => void;
};

const DefaultTestingButton = ({
  isValid,
  isSaving,
  isTesting,
  onRetest,
}: DefaultTestingButtonProps) => {
  return (
    <Button
      variant="outline"
      size="sm"
      disabled={!isValid || isSaving}
      keyboardShortcut="G"
      onKeyboardShortcut={onRetest}
      onClick={onRetest}
      loading={isTesting}
    >
      {t('Retest')}
    </Button>
  );
};
DefaultTestingButton.displayName = 'DefaultTestingButton';

const isConsoleLogsValid = (value: unknown) => {
  if (isNil(value)) {
    return false;
  }
  return value !== '';
};

const TestSampleDataViewer = React.memo(
  ({
    isValid,
    isTesting,
    sampleData,
    sampleDataInput,
    errorMessage,
    lastTestDate,
    children,
    consoleLogs,
    isSaving,
    onRetest,
  }: TestSampleDataViewerProps) => {
    return (
      <>
        {!isTesting && children}
        <div className="flex-grow flex flex-col w-full text-start gap-4">
          <div className="flex justify-center items-center">
            <div className="flex flex-col flex-grow gap-1">
              <div className="text-md flex gap-1 items-center">
                {errorMessage ? (
                  <>
                    <StepStatusIcon
                      status={StepOutputStatus.FAILED}
                      size="5"
                    ></StepStatusIcon>
                    <span>{t('Testing Failed')}</span>
                  </>
                ) : (
                  <>
                    <StepStatusIcon
                      status={StepOutputStatus.SUCCEEDED}
                      size="5"
                    ></StepStatusIcon>
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
            <TestButtonTooltip disabled={!isValid}>
              <DefaultTestingButton
                isValid={isValid}
                isSaving={isSaving}
                isTesting={isTesting}
                onRetest={onRetest}
              />
            </TestButtonTooltip>
          </div>

          {isNil(sampleDataInput) && !isConsoleLogsValid(consoleLogs) ? (
            <JsonViewer
              json={errorMessage ?? sampleData}
              title={t('Output')}
            ></JsonViewer>
          ) : (
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
                  <JsonViewer
                    json={sampleDataInput}
                    title={t('Input')}
                  ></JsonViewer>
                </TabsContent>
              )}
              <TabsContent value="Output">
                <JsonViewer
                  json={errorMessage ?? sampleData}
                  title={t('Output')}
                ></JsonViewer>
              </TabsContent>
              {isConsoleLogsValid(consoleLogs) && (
                <TabsContent value="Logs">
                  <JsonViewer json={consoleLogs} title={t('Logs')}></JsonViewer>
                </TabsContent>
              )}
            </Tabs>
          )}
        </div>
      </>
    );
  },
);

TestSampleDataViewer.displayName = 'TestSampleDataViewer';

export { TestSampleDataViewer, DefaultTestingButton };
