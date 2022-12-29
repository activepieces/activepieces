import { ActionType } from '../../../../../../common/model/enum/action-type.enum';
import { TriggerType } from '../../../../../../common/model/enum/trigger-type.enum';

export class FlowItemDetails {
	constructor(
		public type: ActionType | TriggerType,
		public name: string,
		public description: string,
		public logoUrl?: string
	) {}
}
