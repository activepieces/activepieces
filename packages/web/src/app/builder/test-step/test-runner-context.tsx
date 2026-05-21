import { FlowAction, FlowActionType } from '@activepieces/shared';
import React, { createContext, useCallback, useContext, useState } from 'react';

import { useBuilderStateContext } from '@/app/builder/builder-hooks';

import { DynamicPropertiesContext } from '../piece-properties/dynamic-properties-context';

import TestWebhookDialog from './custom-test-step/test-webhook-dialog';
import { testStepHooks } from './utils/test-step-hooks';

const ActionTestRunnerContext =
  createContext<ActionTestRunnerContextValue | null>(null);

const isReturnResponseAndWaitForWebhook = (step: FlowAction) =>
  step.type === FlowActionType.PIECE &&
  step.settings.pieceName === '@activepieces/piece-webhook' &&
  step.settings.actionName === 'return_response_and_wait_for_next_webhook';

const ActionTestRunnerProvider = ({
  step,
  children,
}: ActionTestRunnerProviderProps) => {
  const { mutate: testAction, isPending: isWaitingTestResult } =
    testStepHooks.useTestAction({ currentStep: step });
  const isStepBeingTested = useBuilderStateContext(
    (state) => state.isStepBeingTested,
  );
  const { isLoadingDynamicProperties } = useContext(DynamicPropertiesContext);
  const [showWebhookDialog, setShowWebhookDialog] = useState(false);

  const isTesting =
    isWaitingTestResult || isStepBeingTested(step.name) || showWebhookDialog;

  const canFireTest =
    step.valid !== false && !isTesting && !isLoadingDynamicProperties;

  const fireTest = useCallback(() => {
    if (!canFireTest) return;
    if (isReturnResponseAndWaitForWebhook(step)) {
      setShowWebhookDialog(true);
    } else {
      testAction(undefined);
    }
  }, [canFireTest, step, testAction]);

  return (
    <ActionTestRunnerContext.Provider
      value={{ fireTest, isTesting, canFireTest }}
    >
      {children}
      {showWebhookDialog && (
        <TestWebhookDialog
          testingMode="returnResponseAndWaitForNextWebhook"
          open={true}
          onOpenChange={(open) => !open && setShowWebhookDialog(false)}
          currentStep={step}
        />
      )}
    </ActionTestRunnerContext.Provider>
  );
};

const useActionTestRunner = () => useContext(ActionTestRunnerContext);

ActionTestRunnerProvider.displayName = 'ActionTestRunnerProvider';

type ActionTestRunnerContextValue = {
  fireTest: () => void;
  isTesting: boolean;
  canFireTest: boolean;
};

type ActionTestRunnerProviderProps = {
  step: FlowAction;
  children: React.ReactNode;
};

export { ActionTestRunnerProvider, useActionTestRunner };
