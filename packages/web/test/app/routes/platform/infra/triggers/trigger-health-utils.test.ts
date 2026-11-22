import { describe, expect, it } from 'vitest';

import { triggerHealthUtils } from '@/app/routes/platform/infra/triggers/trigger-health-utils';

describe('triggerHealthUtils.successRate', () => {
  it('reports 0% when every run failed', () => {
    expect(
      triggerHealthUtils.successRate({ successRuns: 0, failureRuns: 12 }),
    ).toBe(0);
  });
});
