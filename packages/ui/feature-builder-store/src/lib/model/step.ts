import { Action, Trigger } from '@activepieces/shared';
import { MentionListItem } from '@activepieces/ui/common';

export type Step = Action | Trigger;
export type StepWithIndex = Step & { indexInDfsTraversal: number };
export type StepMetaDataForMentions = Omit<MentionListItem, 'logoUrl'> & {
  step: StepWithIndex;
};

export type EnrichedStepMetaDataForMentions = MentionListItem & {
  step: StepWithIndex;
};
