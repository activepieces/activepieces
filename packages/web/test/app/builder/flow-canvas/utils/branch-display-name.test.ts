// @vitest-environment jsdom
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
