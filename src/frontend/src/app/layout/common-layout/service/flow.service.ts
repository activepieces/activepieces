import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { CollectionVersion } from '../model/piece.interface';
import { forkJoin, map, Observable, of, skipWhile, switchMap, take, tap } from 'rxjs';
import { Flow } from '../model/flow.class';
import { SeekPage } from './seek-page';
import { UUID } from 'angular2-uuid';
import { FlowVersion } from '../model/flow-version.class';
import { InstanceRun, InstanceRunState } from '../model/instance-run.interface';
import { TriggerType } from '../model/enum/trigger-type.enum';
import { BuilderSelectors } from '../../flow-builder/store/selector/flow-builder.selector';
import { findDefaultFlowDisplayName } from '../utils';
import { Store } from '@ngrx/store';
import { FlowsActions } from '../../flow-builder/store/action/flows.action';
import { RightSideBarType } from '../model/enum/right-side-bar-type.enum';
import {
	addArtifactsToFormData,
	ArtifactAndItsNameInFormData,
	zipAllArtifacts,
} from '../model/helper/artifacts-zipping-helper';
import { CodeService } from '../../flow-builder/service/code.service';
import { ConfigType } from '../model/enum/config-type';
import { DropdownType } from '../model/enum/config.enum';
import { DynamicDropdownSettings } from '../model/fields/variable/config-settings';

@Injectable({
	providedIn: 'root',
})
export class FlowService {
	constructor(
		private store: Store,

		private http: HttpClient,
		private codeService: CodeService
	) {}

	createEmptyFlow() {
		return forkJoin({
			collection: this.store.select(BuilderSelectors.selectCurrentCollection).pipe(take(1)),
			flows: this.store.select(BuilderSelectors.selectFlows).pipe(take(1)),
		})
			.pipe(
				switchMap(collectionWIthFlows => {
					const flowDisplayName = findDefaultFlowDisplayName(collectionWIthFlows.flows);
					return this.create(collectionWIthFlows.collection.id, flowDisplayName);
				})
			)
			.pipe(
				map(response => {
					if (response != undefined) {
						this.store
							.select(BuilderSelectors.selectCurrentFlowId)
							.pipe(skipWhile(f => f != response.id))
							.pipe(take(1))
							.pipe(
								switchMap(f => {
									return this.store
										.select(BuilderSelectors.selectCurrentTabState)
										.pipe(skipWhile(f => f == undefined))
										.pipe(take(1));
								})
							)
							.subscribe(tab => {
								if (response.last_version.trigger?.type === TriggerType.EMPTY) {
									this.store.dispatch(
										FlowsActions.setRightSidebar({
											sidebarType: RightSideBarType.TRIGGER_TYPE,
											props: {},
										})
									);
								}
							});
						this.store.dispatch(FlowsActions.addFlow({ flow: response }));
					}
					return response;
				})
			);
	}

	create(colelctionId: UUID, flowDisplayName: string): Observable<Flow> {
		const createDefaultFlowRequest = {
			display_name: flowDisplayName,
			trigger: {
				name: 'trigger',
				display_name: 'Schedule Trigger',
				type: 'SCHEDULE',
				settings: {
					cron_expression: '0 1 0 ? * *',
				},
			},
		};
		const createFlow$ = this.http.post<Flow>(
			environment.apiUrl + '/collections/' + colelctionId + '/flows',
			createDefaultFlowRequest
		);
		return createFlow$;
	}

	get(flowId: UUID): Observable<Flow> {
		return this.http.get<Flow>(environment.apiUrl + '/flows/' + flowId);
	}

	getVersion(flowVersionId: UUID): Observable<FlowVersion> {
		return this.http.get<FlowVersion>(environment.apiUrl + '/flows/versions/' + flowVersionId);
	}

	listByPiece(integrationId: UUID, limit: number): Observable<SeekPage<Flow>> {
		return this.http.get<SeekPage<Flow>>(
			environment.apiUrl + '/collections/' + integrationId + '/flows?limit=' + limit
		);
	}

	listVersionsByFlowId(flowID: UUID): Observable<FlowVersion[]> {
		return this.http.get<FlowVersion[]>(environment.apiUrl + '/flows/' + flowID + '/versions');
	}

	listByPieceVersion(pieceVersion: CollectionVersion): Observable<FlowVersion[]> {
		return forkJoin(pieceVersion.flowsVersionId.map(item => this.getVersion(item)));
	}

	count(integrationId: UUID): Observable<number> {
		return this.http.get<number>(environment.apiUrl + '/collections/' + integrationId + '/flows/count');
	}

	delete(workflowId: UUID): Observable<void> {
		return this.http.delete<void>(environment.apiUrl + '/flows/' + workflowId);
	}

	update(flowId: UUID, flow: FlowVersion): Observable<Flow> {
		const formData = new FormData();
		const clonedFlowVersion: FlowVersion = FlowVersion.clone(flow);
		formData.append(
			'flow',
			new Blob([JSON.stringify(clonedFlowVersion)], {
				type: 'application/json',
			})
		);
		const dirtyStepsArtifacts = this.codeService.getDirtyArtifactsForFlowSteps(flowId);
		const artifactsAndTheirNames: ArtifactAndItsNameInFormData[] = [
			...this.getDynamicDropdownConfigsArtifacts(flow),
			...dirtyStepsArtifacts,
		];

		const updateFlow$ = this.http.put<any>(environment.apiUrl + '/flows/' + flowId + '/versions/latest', formData);
		const artifacts$ = zipAllArtifacts(artifactsAndTheirNames);
		if (artifacts$.length == 0) {
			return updateFlow$;
		}
		return forkJoin(artifacts$).pipe(
			tap(zippedFilesAndTheirNames => {
				addArtifactsToFormData(zippedFilesAndTheirNames, formData);
			}),
			switchMap(() => {
				const updateFlowWithArtifacts$ = this.http.put<any>(
					environment.apiUrl + '/flows/' + flowId + '/versions/latest',
					formData
				);
				return updateFlowWithArtifacts$;
			}),
			tap(() => {
				this.codeService.unmarkDirtyArtifactsInFlowStepsCache(flowId);
			})
		);
	}

	execute(
		collectionVersionId: UUID,
		flowVersionId,
		request: { configs: Map<String, Object>; trigger: any }
	): Observable<InstanceRun> {
		return this.http
			.post<InstanceRun>(
				environment.apiUrl +
					'/collection-versions/' +
					collectionVersionId +
					'/flow-versions/' +
					flowVersionId +
					'/runs',
				request
			)
			.pipe(
				switchMap(instanceRun => {
					if (instanceRun.state === undefined && instanceRun.stateUrl !== undefined) {
						return this.logs(instanceRun.stateUrl).pipe(
							map(st => {
								instanceRun.state = st;
								return instanceRun;
							})
						);
					}
					return of(instanceRun);
				})
			);
	}

	private logs(url: string): Observable<InstanceRunState> {
		return this.http.get<InstanceRunState>(url);
	}

	getDynamicDropdownConfigsArtifacts(flow: FlowVersion) {
		const artifacts: ArtifactAndItsNameInFormData[] = [];
		flow.configs.forEach(config => {
			const settings = config.settings as DynamicDropdownSettings;
			if (config.type === ConfigType.DROPDOWN && settings.dropdownType == DropdownType.DYNAMIC) {
				if (settings.artifactContent) artifacts.push({ artifact: settings.artifactContent, name: config.key });
			}
		});
		return artifacts;
	}
}
