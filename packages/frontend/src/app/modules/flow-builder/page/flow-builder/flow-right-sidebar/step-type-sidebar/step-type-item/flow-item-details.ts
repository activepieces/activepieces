import { ActionType, TriggerType } from '@activepieces/shared';

export class FlowItemDetails {
	constructor(
		public type: ActionType | TriggerType,
		public name: string,
		public description: string,
		public logoUrl?: string,
		public extra?: { appName: string }
	) {}
}
