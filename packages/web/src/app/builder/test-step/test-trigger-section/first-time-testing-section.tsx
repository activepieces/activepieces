import { isNil } from '@activepieces/shared';
import { t } from 'i18next';
import { useContext } from 'react';

import { Dot } from '@/components/custom/dot';
import { Button } from '@/components/ui/button';

import { DynamicPropertiesContext } from '../../piece-properties/dynamic-properties-context';
import { TestButtonTooltip } from '../test-step-tooltip';

import { TestType } from './trigger-event-utils';

type FirstTimeTestingSectionProps = {
  isValid: boolean;
  testType: TestType;
  isTesting: boolean;
  mockData: unknown;
  isSaving: boolean;
  onSimulateTrigger: () => void;
  onPollTrigger: () => void;
  onMcpToolTesting: () => void;
  onCallableFlowSetup: () => void;
  onSaveMockAsSampleData: (mockData: unknown) => void;
};

export const FirstTimeTestingSection = ({
  isValid,
  testType,
  mockData,
  isSaving,
  isTesting,
  onSimulateTrigger,
  onPollTrigger,
  onMcpToolTesting,
  onCallableFlowSetup,
  onSaveMockAsSampleData,
}: FirstTimeTestingSectionProps) => {
  const { isLoadingDynamicProperties } = useContext(DynamicPropertiesContext);
  if (testType === 'callable-flow') {
    return (
      <div className="flex justify-center">
        <TestButtonTooltip saving={isSaving} invalid={!isValid}>
          <Button
            variant="outline"
            size="sm"
            onClick={onCallableFlowSetup}
            keyboardShortcut="G"
            onKeyboardShortcut={onCallableFlowSetup}
            disabled={!isValid || isLoadingDynamicProperties}
            loading={isSaving}
            data-testid="callable-flow-sample-data-button"
          >
            <Dot animation={true} variant={'primary'}></Dot>
            {t('Provide Sample Input')}
          </Button>
        </TestButtonTooltip>
      </div>
    );
  }
  if (
    testType === 'simulation' ||
    testType === 'webhook' ||
    testType === 'chat-trigger'
  ) {
    return (
      <div className="flex justify-center flex-col gap-2 items-center">
        <TestButtonTooltip saving={isSaving} invalid={!isValid}>
          <Button
            variant="outline"
            size="sm"
            onClick={onSimulateTrigger}
            keyboardShortcut="G"
            onKeyboardShortcut={onSimulateTrigger}
            disabled={!isValid || isLoadingDynamicProperties}
            loading={isSaving}
            data-testid="test-trigger-button"
          >
            <Dot animation={true} variant={'primary'}></Dot>
            {t('Test Trigger')}
          </Button>
        </TestButtonTooltip>

        {!isNil(mockData) && JSON.stringify(mockData) !== '{}' && (
          <>
            {t('Or')}
            <Button
              variant="outline"
              size="sm"
              onClick={() => onSaveMockAsSampleData(mockData)}
              loading={isSaving}
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
        <TestButtonTooltip saving={isSaving} invalid={!isValid}>
          <Button
            variant="outline"
            size="sm"
            onClick={onMcpToolTesting}
            keyboardShortcut="G"
            onKeyboardShortcut={onMcpToolTesting}
            loading={isTesting}
            disabled={!isValid || isLoadingDynamicProperties}
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
      <TestButtonTooltip saving={isSaving} invalid={!isValid}>
        <Button
          variant="outline"
          size="sm"
          onClick={onPollTrigger}
          keyboardShortcut="G"
          onKeyboardShortcut={onPollTrigger}
          loading={isTesting}
          disabled={!isValid || isLoadingDynamicProperties}
        >
          <Dot animation={true} variant={'primary'}></Dot>
          {t('Load Sample Data')}
        </Button>
      </TestButtonTooltip>
    </div>
  );
};
