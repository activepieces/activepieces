import { pieceSelectorUtils } from '../../pieces-selector/piece-selector-utils';

export type TestType =
  | 'mcp-tool'
  | 'chat-trigger'
  | 'simulation'
  | 'webhook'
  | 'polling';

export const triggerEventUtils = {
  getTestType: (triggerName: string, pieceName: string): TestType => {
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
    return 'polling';
  },
};
