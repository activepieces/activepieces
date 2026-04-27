import { TriggerBase, TriggerStrategy } from '@activepieces/pieces-framework';
import { TriggerTestStrategy } from '@activepieces/shared';

import { pieceSelectorUtils } from '@/features/pieces';

export type TestType =
  | 'mcp-tool'
  | 'chat-trigger'
  | 'simulation'
  | 'webhook'
  | 'callable-flow'
  | 'polling';

export const triggerEventUtils = {
  getTestType: ({
    triggerName,
    pieceName,
    trigger,
  }: {
    triggerName: string;
    pieceName: string;
    trigger: TriggerBase;
  }): TestType => {
    if (pieceSelectorUtils.isMcpToolTrigger(pieceName, triggerName)) {
      return 'mcp-tool';
    }
    if (pieceSelectorUtils.isChatTrigger(pieceName, triggerName)) {
      return 'chat-trigger';
    }
    if (
      pieceName === '@activepieces/piece-webhook' &&
      triggerName === 'catch_webhook'
    ) {
      return 'webhook';
    }
    if (
      pieceName === '@activepieces/piece-subflows' &&
      triggerName === 'callableFlow'
    ) {
      return 'callable-flow';
    }

    if (
      trigger.type === TriggerStrategy.APP_WEBHOOK ||
      trigger.type === TriggerStrategy.WEBHOOK
    ) {
      switch (trigger.testStrategy) {
        case TriggerTestStrategy.TEST_FUNCTION:
          return 'polling';
        case TriggerTestStrategy.SIMULATION:
          return 'simulation';
      }
    }

    return 'polling';
  },
};
