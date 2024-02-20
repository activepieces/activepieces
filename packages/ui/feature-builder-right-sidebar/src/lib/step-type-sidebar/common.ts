import { ActionBase } from '@activepieces/pieces-framework';
import { ActionType, TriggerType } from '@activepieces/shared';
import { FlowItemDetails } from '@activepieces/ui/common';

export type ActionOrTriggerName = Pick<ActionBase, 'name' | 'displayName'>;

export const doesQueryMatchStep = (
  step: FlowItemDetails,
  searchQuery: string
) => {
  return (
    step.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    step.description.toLowerCase().includes(searchQuery.toLowerCase())
  );
};
export const isCoreStep = (step: FlowItemDetails) => {
  return (
    step.type === ActionType.BRANCH ||
    ActionType.CODE ||
    ActionType.LOOP_ON_ITEMS ||
    TriggerType.WEBHOOK
  );
};
