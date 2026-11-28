// @vitest-environment jsdom
import {
  FlowActionType,
  FlowTriggerType,
  Step,
} from '@activepieces/shared';
import { describe, expect, it, vi } from 'vitest';

import { flowCanvasUtils } from '@/app/builder/flow-canvas/utils/flow-canvas-utils';

vi.mock('i18next', () => ({ t: (key: string) => `translated:${key}` }));
vi.mock('@/features/flow-runs', () => ({
  flowRunUtils: {
    extractStepOutput: () => undefined,
    findLastStepWithStatus: () => null,
  },
}));

describe('flowCanvasUtils.getBranchDisplayName', () => {
  it.each(['Otherwise', 'Branch 1', 'Route 1'])(
    'translates the default name %s',
    (branchName) => {
      expect(flowCanvasUtils.getBranchDisplayName(branchName)).toBe(
        `translated:${branchName}`,
      );
    },
  );

  it.each(['Branch 2', 'branch 1', 'Paid customers', 'constructor', ''])(
    'keeps the saved name %j',
    (branchName) => {
      expect(flowCanvasUtils.getBranchDisplayName(branchName)).toBe(branchName);
    },
  );
});

describe('flowCanvasUtils.getStepDisplayName', () => {
  it('translates the empty trigger name, whatever was saved', () => {
    const step: Step = {
      name: 'trigger',
      valid: false,
      displayName: 'Saved Name',
      lastUpdatedDate: '2026-11-24T00:00:00.000Z',
      type: FlowTriggerType.EMPTY,
      settings: {},
    };
    expect(flowCanvasUtils.getStepDisplayName(step)).toBe(
      'translated:Select Trigger',
    );
  });

  it('keeps the saved name of any other step', () => {
    const step: Step = {
      name: 'step_1',
      valid: true,
      displayName: 'Send Email',
      skip: false,
      lastUpdatedDate: '2026-11-24T00:00:00.000Z',
      type: FlowActionType.CODE,
      settings: {
        sourceCode: { code: '', packageJson: '{}' },
        input: {},
      },
    };
    expect(flowCanvasUtils.getStepDisplayName(step)).toBe('Send Email');
  });
});
