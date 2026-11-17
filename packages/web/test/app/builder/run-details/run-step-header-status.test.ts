import { StepOutputStatus } from '@activepieces/shared';
import { describe, expect, it } from 'vitest';

import { runStepHeaderStatus } from '@/app/builder/run-details/run-step-header-status';

describe('runStepHeaderStatus.fromStepOutputStatus', () => {
  it('shows a step paused at a waitpoint as paused, not success', () => {
    expect(
      runStepHeaderStatus.fromStepOutputStatus(StepOutputStatus.PAUSED),
    ).toBe('paused');
  });

  it.each([
    [StepOutputStatus.SUCCEEDED, 'success'],
    [StepOutputStatus.STOPPED, 'success'],
    [StepOutputStatus.FAILED, 'failed'],
    [StepOutputStatus.RUNNING, 'testing'],
  ])('maps %s to %s', (stepStatus, headerStatus) => {
    expect(runStepHeaderStatus.fromStepOutputStatus(stepStatus)).toBe(
      headerStatus,
    );
  });
});
