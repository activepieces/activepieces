import { Injectable } from '@angular/core';
import { FlowItemDetails } from '../page/flow-builder/flow-right-sidebar/step-type-sidebar/step-type-item/flow-item-details';
import { ActionType } from '../../common-layout/model/enum/action-type.enum';
import { TriggerType } from '../../common-layout/model/enum/trigger-type.enum';
import { HttpClient } from '@angular/common/http';
import { ConnectorComponent } from '../../common-layout/components/configs-form/connector-action-or-config';
import { environment } from 'src/environments/environment';
import { Observable, shareReplay } from 'rxjs';
import { DropdownItemOption } from '../../common-layout/model/fields/variable/subfields/dropdown-item-option';

@Injectable({
	providedIn: 'root',
})
export class ActionMetaService {
	private connectorComponents$: Observable<ConnectorComponent[]>;
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
			type: TriggerType.COLLECTION_DISABLED,
			name: 'Collection Disabled',
			description: 'Trigger flow when collection is stopped and on old deployments if a new deployment occurs',
			logoUrl: '/assets/img/custom/piece/instance-stopped.svg',
		},
		{
			type: TriggerType.COLLECTION_ENABLED,
			name: 'Collection Enabled',
			description: 'Trigger flow when collection is enabled or deployed',
			logoUrl: '/assets/img/custom/piece/instance-started.svg',
		},
		{
			type: TriggerType.EMPTY,
			name: 'Trigger',
			description: 'Choose a trigger',
			logoUrl: '/assets/img/custom/piece/empty-trigger.svg',
		},
	];
	constructor(private http: HttpClient) {}
	private getComponents() {
		return this.http.get<ConnectorComponent[]>(environment.apiUrl + '/components');
	}
	public connectorComponents() {
		if (!this.connectorComponents$) {
			this.connectorComponents$ = this.getComponents().pipe(shareReplay(1));
		}
		return this.connectorComponents$;
	}
	getConnectorActionConfigOptions(
		req: { config_name: string; action_name: string; config: any },
		componentName: string
	) {
		return this.http.post<DropdownItemOption[]>(environment.apiUrl + `/components/${componentName}/options`, req);
	}
}
