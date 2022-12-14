import { Injectable } from '@angular/core';
import { FlowItemDetails } from '../page/flow-builder/flow-right-sidebar/step-type-sidebar/step-type-item/flow-item-details';
import { ActionType } from '../../common-layout/model/enum/action-type.enum';
import { TriggerType } from '../../common-layout/model/enum/trigger-type.enum';
import { Observable } from 'rxjs';

@Injectable({
	providedIn: 'root',
})
export class ActionMetaService {
	public coreFlowItemsDetails: FlowItemDetails[] = [
		{
			type: ActionType.CODE,
			name: 'Code',
			description: 'Powerful nodejs code with npm',
			logoUrl: '/assets/img/custom/piece/code.svg',
		},
		{
			type: ActionType.LOOP_ON_ITEMS,
			name: 'Loop',
			description: 'Repeat an actions multiple times',
			logoUrl: '/assets/img/custom/piece/loop.svg',
		},
		{
			type: ActionType.STORAGE,
			name: 'Storage',
			description: 'Store or retrieve data from activepieces key/value database',
			logoUrl: '/assets/img/custom/piece/storage.svg',
		},
		{
			type: ActionType.RESPONSE,
			name: 'Response',
			description: 'Return response to caller workflow',
			logoUrl: '/assets/img/custom/piece/response.svg',
		},
	];

	public triggerItemsDetails = [
		{
			type: TriggerType.SCHEDULE,
			name: 'Schedule',
			description: 'Trigger flow with fixed schedule.',
			logoUrl: '/assets/img/custom/piece/schedule.svg',
		},
		{
			type: TriggerType.WEBHOOK,
			name: 'Webhook',
			description: 'Trigger flow by calling a unique web url',
			logoUrl: '/assets/img/custom/piece/webhook.svg',
		},
		{
			type: TriggerType.COLLECTION_STOPPED,
			name: 'Collection Stopped',
			description: 'Trigger flow when collection is stopped and on old deployments if a new deployment occurs',
			logoUrl: '/assets/img/custom/piece/instance-stopped.svg',
		},
		{
			type: TriggerType.COLLECTION_DEPLOYED,
			name: 'Instance Started',
			description: 'Trigger flow when collection is deployed',
			logoUrl: '/assets/img/custom/piece/instance-started.svg',
		},
		{
			type: TriggerType.EMPTY,
			name: 'Trigger',
			description: 'Choose a trigger',
			logoUrl: '/assets/img/custom/piece/empty-trigger.svg',
		},
	];
}
