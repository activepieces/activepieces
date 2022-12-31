import { Injectable } from '@angular/core';
import { FlowItemDetails } from '../page/flow-builder/flow-right-sidebar/step-type-sidebar/step-type-item/flow-item-details';
import { ActionType, TriggerType} from 'shared';
import { HttpClient } from '@angular/common/http';
import { ConnectorComponent } from '../../common/components/configs-form/connector-action-or-config';
import { environment } from 'src/environments/environment';
import { Observable, shareReplay } from 'rxjs';
import { DropdownItem } from '../../common/model/dropdown-item.interface';

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
			type: ActionType.STORAGE,
			name: 'Storage',
			description: 'Store or retrieve data from activepieces key/value database',
			logoUrl: '/assets/img/custom/piece/storage.svg',
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
			type: TriggerType.EMPTY,
			name: 'Trigger',
			description: 'Choose a trigger',
			logoUrl: '/assets/img/custom/piece/empty-trigger.svg',
		},
	];
	constructor(private http: HttpClient) {}
	private getPieces() {
		return this.http.get<ConnectorComponent[]>(environment.apiUrl + '/pieces');
	}
	public connectorComponents() {
		if (!this.connectorComponents$) {
			this.connectorComponents$ = this.getPieces().pipe(shareReplay(1));
		}
		return this.connectorComponents$;
	}
	getConnectorActionConfigOptions(
		req: { config_name: string; action_name: string; config: any },
		pieceName: string
	) {
		return this.http.post<DropdownItem[]>(environment.apiUrl + `/pieces/${pieceName}/options`, req);
	}
}
