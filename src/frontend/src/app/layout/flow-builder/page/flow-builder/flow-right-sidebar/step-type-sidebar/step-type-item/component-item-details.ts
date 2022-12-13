import { FlowItemDetails } from './flow-item-details';
import { ActionType } from '../../../../../../common-layout/model/enum/action-type.enum';
import { TriggerType } from '../../../../../../common-layout/model/enum/trigger-type.enum';

export class ComponentItemDetails extends FlowItemDetails {
	constructor(obj: { type: ActionType | TriggerType; name: string; description: string; logoUrl: string }) {
		super(obj.type, obj.name, obj.description, obj.logoUrl);
	}
}
