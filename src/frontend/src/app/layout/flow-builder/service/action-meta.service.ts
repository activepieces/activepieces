import { Injectable } from '@angular/core';
import { FlowItemDetails } from '../page/flow-builder/flow-right-sidebar/step-type-sidebar/step-type-item/flow-item-details';
import { ActionType } from '../../common-layout/model/enum/action-type.enum';
import { TriggerType } from '../../common-layout/model/enum/trigger-type.enum';
import { map, Observable, shareReplay } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { ComponentItemDetails } from '../page/flow-builder/flow-right-sidebar/step-type-sidebar/step-type-item/component-item-details';
import { Manifest } from '../model/manifest';

@Injectable({
	providedIn: 'root',
})
export class ActionMetaService {
	manifests$: Map<string, Observable<Manifest>> = new Map();
	infoForOtherCollectionsWeBuilt: {
		pieceVersionId: string;
		flowVersionId: string;
	}[] = [];
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
			type: TriggerType.INSTANCE_STOPPED,
			name: 'Instance Stopped',
			description: 'Trigger flow when instance is stopped',
			logoUrl: '/assets/img/custom/piece/instance-stopped.svg',
		},
		{
			type: TriggerType.INSTANCE_STARTED,
			name: 'Instance Started',
			description: 'Trigger flow when instance is started',
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

	// TODO MOVE URL TO ENVIRONMENT
	public getConnectorsComponents() {
		return this.http
			.get<{
				components: {
					package: {
						name: string;
						version: string;
						entryClass: string;
					};
					name: string;
					description: string;
					version: string;
					logo: string;
					manifest: string;
				}[];
			}>('https://cdn.activepieces.com/components/list.json')
			.pipe(
				map(res => {
					const components = [...res.components];
					return components.map(c => {
						return new ComponentItemDetails({
							logoUrl: c.logo,
							type: ActionType.COMPONENT,
							name: c.name,
							version: c.version,
							description: c.description,
							manifest: c.manifest,
							package: c.package,
						});
					});
				})
			);
	}
	public getManifest(url: string) {
		if (!url) console.error('get manifest url is empty');
		const manifest$ = this.manifests$.get(url);
		if (manifest$) {
			return manifest$;
		}
		const newManifest$ = this.http.get<Manifest>(url).pipe(shareReplay(1));
		this.manifests$.set(url, newManifest$);
		return newManifest$;
	}
}
