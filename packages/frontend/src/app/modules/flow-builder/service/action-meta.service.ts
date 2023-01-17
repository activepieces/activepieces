import { Injectable } from '@angular/core';
import { FlowItemDetails } from '../page/flow-builder/flow-right-sidebar/step-type-sidebar/step-type-item/flow-item-details';
import { ActionType, TriggerType } from 'shared';
import { HttpClient } from '@angular/common/http';
import { AppPiece } from '../../common/components/configs-form/connector-action-or-config';
import { environment } from 'src/environments/environment';
import { Observable, shareReplay, tap } from 'rxjs';

@Injectable({
	providedIn: 'root',
})
export class ActionMetaService {
	private pieces$: Observable<AppPiece[]>;
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

	public getPieces() {
		if (!this.pieces$) {
			this.pieces$ = this.http.get<AppPiece[]>(environment.apiUrl + '/pieces').pipe(
				shareReplay(1),
				tap(val => {
					console.log(val);
				})
			);
		}
		return this.pieces$;
	}
	getConnectorActionConfigOptions(
		req: { configName: string; stepName: string; configs: Record<string, any> },
		pieceName: string
	) {
		return this.http.post<DropdownState<any>>(environment.apiUrl + `/pieces/${pieceName}/options`, req);
	}
}
export type DropdownState<T> = {
	disabled?: boolean;
	placeholder?: string;
	options: DropdownOption<T>[];
};

export type DropdownOption<T> = {
	label: string;
	value: T;
};
