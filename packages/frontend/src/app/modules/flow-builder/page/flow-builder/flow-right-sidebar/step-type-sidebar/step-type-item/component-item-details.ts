import { ActionType, TriggerType } from '@activepieces/shared';
import { FlowItemDetails } from './flow-item-details';

export class ComponentItemDetails extends FlowItemDetails {
  constructor(obj: {
    type: ActionType | TriggerType;
    name: string;
    description: string;
    logoUrl: string;
  }) {
    super(obj.type, obj.name, obj.description, obj.logoUrl);
  }
}
