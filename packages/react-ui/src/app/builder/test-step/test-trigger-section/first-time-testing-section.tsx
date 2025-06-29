import { t } from 'i18next';

import { Button } from '@/components/ui/button';
import { Dot } from '@/components/ui/dot';
import { isNil } from '@activepieces/shared';

import { TestButtonTooltip } from '../test-step-tooltip';

import { TestType } from './trigger-event-utils';

type FirstTimeTestingSectionProps = {
  isValid: boolean;
  testType: TestType;
  isTesting: boolean;
  mockData: unknown;
  isSavingMockdata: boolean;
  onSimulateTrigger: () => void;
  onPollTrigger: () => void;
  onMcpToolTesting: () => void;
  onSaveMockAsSampleData: (mockData: unknown) => void;
};

export const FirstTimeTestingSection = ({
  isValid,
  testType,
  mockData,
  isSavingMockdata,
  isTesting,
  onSimulateTrigger,
  onPollTrigger,
  onMcpToolTesting,
  onSaveMockAsSampleData,
}: FirstTimeTestingSectionProps) => {
  if (
    testType === 'simulation' ||
    testType === 'webhook' ||
    testType === 'chat-trigger'
  ) {
    return (
      <div className="flex justify-center flex-col gap-2 items-center">
        <TestButtonTooltip disabled={!isValid}>
          <Button
            variant="outline"
            size="sm"
            onClick={onSimulateTrigger}
            keyboardShortcut="G"
            onKeyboardShortcut={onSimulateTrigger}
            disabled={!isValid}
          >
            <Dot animation={true} variant={'primary'}></Dot>
            {t('Test Trigger')}
          </Button>
        </TestButtonTooltip>

        {!isNil(mockData) && (
          <>
            {t('Or')}
            <Button
              variant="outline"
              size="sm"
              onClick={() => onSaveMockAsSampleData(mockData)}
              loading={isSavingMockdata}
            >
              {t('Use Mock Data')}
            </Button>
          </>
        )}
      </div>
    );
  }

  if (testType === 'mcp-tool') {
    return (
      <div className="flex justify-center">
        <TestButtonTooltip disabled={!isValid}>
          <Button
            variant="outline"
            size="sm"
            onClick={onMcpToolTesting}
            keyboardShortcut="G"
            onKeyboardShortcut={onMcpToolTesting}
            loading={isTesting}
            disabled={!isValid}
          >
            <Dot animation={true} variant={'primary'}></Dot>
            {t('Test Tool')}
          </Button>
        </TestButtonTooltip>
      </div>
    );
  }

  return (
    <div className="flex justify-center">
      <TestButtonTooltip disabled={!isValid}>
        <Button
          variant="outline"
          size="sm"
          onClick={onPollTrigger}
          keyboardShortcut="G"
          onKeyboardShortcut={onPollTrigger}
          loading={isTesting}
          disabled={!isValid}
        >
          <Dot animation={true} variant={'primary'}></Dot>
          {t('Load Sample Data')}
        </Button>
      </TestButtonTooltip>
    </div>
  );
};
