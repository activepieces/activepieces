import { StepOutputStatus } from '@activepieces/shared';

function fromStepOutputStatus(
  status: StepOutputStatus,
): 'success' | 'failed' | 'testing' | 'paused' {
  switch (status) {
    case StepOutputStatus.FAILED:
      return 'failed';
    case StepOutputStatus.RUNNING:
      return 'testing';
    case StepOutputStatus.PAUSED:
      return 'paused';
    case StepOutputStatus.SUCCEEDED:
    case StepOutputStatus.STOPPED:
      return 'success';
  }
}

export const runStepHeaderStatus = { fromStepOutputStatus };
