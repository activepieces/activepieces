import { Injectable } from '@angular/core';
import { FlowItemDetails } from '../page/flow-builder/flow-right-sidebar/step-type-sidebar/step-type-item/flow-item-details';
import { ActionType } from '../../common-layout/model/enum/action-type.enum';
import { TriggerType } from '../../common-layout/model/enum/trigger-type.enum';
import { CollectionService } from '../../common-layout/service/collection.service';
import { defaultIfEmpty, forkJoin, map, Observable, of, shareReplay, switchMap } from 'rxjs';
import { Collection, CollectionVersion } from '../../common-layout/model/piece.interface';
import { VersionEditState } from '../../common-layout/model/enum/version-edit-state.enum';
import { environment } from 'src/environments/environment';
import { devAppConnectors, devConnectors } from '../../../../connectors/dev-connectors.lexicon';
import { prodConnectors } from '../../../../connectors/prod-connectors.lexicon';
import { stgConnectors } from '../../../../connectors/stg-connectors.lexicon';

import { AppConnector } from '../model/app-connector';
import { HttpClient } from '@angular/common/http';
import { ConfigSource } from '../../common-layout/model/enum/config-source';
import { ProjectService } from '../../common-layout/service/project.service';
import { ComponentItemDetails } from '../page/flow-builder/flow-right-sidebar/step-type-sidebar/step-type-item/component-item-details';
import { Manifest } from '../model/manifest';

@Injectable({
	providedIn: 'root',
})
export class ActionMetaService {
	private connectors$: Observable<AppConnector[]>;
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
			type: TriggerType.EVENT,
			name: 'Event',
			description: 'Trigger event when specific events are received.',
			logoUrl: '/assets/img/custom/piece/default-trigger.svg',
		},
		{
			type: TriggerType.SCHEDULE,
			name: 'Schedule',
			description: 'Trigger flow with fixed schedule.',
			logoUrl: '/assets/img/custom/piece/schedule.svg',
		},
		{
			type: TriggerType.MANUAL,
			name: 'Callable',
			description: 'Trigger flow when called from another flow',
			logoUrl: '/assets/img/custom/piece/callable.svg',
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

	constructor(
		private pieceService: CollectionService,
		private http: HttpClient,
		private projectService: ProjectService
	) {
		switch (environment.stageName) {
			case 'stg':
				this.connectors$ = this.loadAppConnectors();
				this.infoForOtherCollectionsWeBuilt = stgConnectors;
				break;
			case 'prod':
				this.connectors$ = this.loadAppConnectors();
				this.infoForOtherCollectionsWeBuilt = prodConnectors;
				break;
			case 'dev':
				this.connectors$ = of(devAppConnectors);
				this.infoForOtherCollectionsWeBuilt = devConnectors;
				break;
		}
	}

	private loadAppConnectors(): Observable<AppConnector[]> {
		return this.http.get<AppConnector[]>(environment.appConnectors).pipe(shareReplay());
	}

	public getConnectorsFlowItemsDetails(): Observable<FlowItemDetails[]> {
		return this.connectors$.pipe(
			switchMap(connectors => {
				const connectorsDetails$: Observable<FlowItemDetails>[] = [];
				connectors.forEach(c => {
					connectorsDetails$.push(
						this.pieceService.getVersion(c.pieceVersionId).pipe(
							this.mapCollectionVersionToFlowItemDetails,
							map(flowItemDetails => {
								flowItemDetails.extra!.documentationUrl = c.docUrl;
								return flowItemDetails;
							})
						)
					);
				});
				return forkJoin(connectorsDetails$).pipe(defaultIfEmpty([]));
			})
		);
	}

	public getDetailsForCollectionsWeBuilt(): Observable<FlowItemDetails[]> {
		const flowItemDetailsForCollectionsWeBuilt: Observable<FlowItemDetails>[] = [];
		this.infoForOtherCollectionsWeBuilt.forEach(info => {
			flowItemDetailsForCollectionsWeBuilt.push(
				this.pieceService.getVersion(info.pieceVersionId).pipe(this.mapCollectionVersionToFlowItemDetails)
			);
		});
		if (flowItemDetailsForCollectionsWeBuilt.length === 0) return of([]);
		return forkJoin(flowItemDetailsForCollectionsWeBuilt);
	}

	mapCollectionVersionToFlowItemDetails = map((collectionVersion: CollectionVersion) => {
		return {
			name: collectionVersion.displayName,
			type: ActionType.REMOTE_FLOW,
			description: collectionVersion.description,
			logoUrl: collectionVersion.logoUrl
				? collectionVersion.logoUrl
				: 'assets/img/custom/connectors/default-connector.png',
			extra: {
				pieceVersionId: collectionVersion.id,
				flowsVersionIds: collectionVersion.flowsVersionId,
				collectionConfigs: collectionVersion.configs.filter(c => c.source !== ConfigSource.PREDEFINED),
			},
		} as FlowItemDetails;
	});

	public getFlowItemDetailsForUserCollections(): Observable<FlowItemDetails[]> {
		return this.projectService.selectedProjectAndTakeOne().pipe(
			switchMap(project => {
				return this.pieceService.list(project.id, 10000).pipe(
					switchMap(collectionPage => {
						const flowItemsDetailsForCollectionVersions: Observable<FlowItemDetails>[] =
							this.getLatestPublishedCollectionsVersion(collectionPage.data).map(collectionVersion$ => {
								return collectionVersion$.pipe(this.mapCollectionVersionToFlowItemDetails);
							});
						return forkJoin(flowItemsDetailsForCollectionVersions).pipe(defaultIfEmpty([]));
					})
				);
			})
		);
	}

	private getLatestPublishedCollectionsVersion(collections: Collection[]) {
		const latestPublishedVersion: Observable<CollectionVersion>[] = [];
		collections.forEach(col => {
			//last published version is either the lastversion or the version before it because of product logic, ask old teamates  about this if you don't understand.
			if (col.lastVersion.state === VersionEditState.LOCKED) {
				latestPublishedVersion.push(of(col.lastVersion));
			} else if (col.versionsList.length > 1) {
				latestPublishedVersion.push(this.pieceService.getVersion(col.versionsList[col.versionsList.length - 2]));
			}
		});
		return latestPublishedVersion;
	}

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
