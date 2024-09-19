import { t } from 'i18next';
import React, { useMemo } from 'react';

import { JsonViewer } from '@/components/json-viewer';
import { Button } from '@/components/ui/button';
import { StepStatusIcon } from '@/features/flow-runs/components/step-status-icon';
import { formatUtils } from '@/lib/utils';
import {
  ActionType,
  StepOutputStatus,
  TriggerType,
} from '@activepieces/shared';

import { TestButtonTooltip } from './test-step-tooltip';

type TestSampleDataViewerProps = {
  onRetest: () => void;
  isValid: boolean;
  isSaving: boolean;
  isTesting: boolean;
  currentSelectedData: unknown;
  errorMessage: string | undefined;
  lastTestDate: string | undefined;
  type: ActionType | TriggerType;
  children?: React.ReactNode;
};

const TestSampleDataViewer = React.memo(
  ({
    onRetest,
    isValid,
    isSaving,
    isTesting,
    currentSelectedData,
    errorMessage,
    lastTestDate,
    type,
    children,
  }: TestSampleDataViewerProps) => {
    const formattedData = useMemo(
      () => formatUtils.formatStepInputOrOutput(currentSelectedData, type),
      [currentSelectedData, type],
    );
    return (
      <>
        {!isTesting && children}
        <div className="flex-grow flex flex-col w-full text-start gap-4">
          <div className="flex justify-center items-center">
            <div className="flex flex-col flex-grow gap-1">
              <div className="text-md flex gap-1 justyf-center items-center">
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
            </TestButtonTooltip>
          </div>
          <JsonViewer
            json={errorMessage ?? formattedData}
            title={t('Output')}
          ></JsonViewer>
        </div>
      </>
    );
  },
);

TestSampleDataViewer.displayName = 'TestSampleDataViewer';
export { TestSampleDataViewer };
