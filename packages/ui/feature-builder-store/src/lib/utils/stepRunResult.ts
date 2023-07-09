import { StepOutput } from '@activepieces/shared';

export interface StepRunResult {
  output?: StepOutput;
  stepName: string;
  displayName?: string;
  index: number;
}
