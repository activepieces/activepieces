import { Action, Trigger } from '@activepieces/shared';

export type Step = Action | Trigger;
export type StepWithIndex = Step & { indexInDfsTraversal: number };
