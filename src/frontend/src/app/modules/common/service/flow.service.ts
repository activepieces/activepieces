import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { forkJoin, map, Observable, of, skipWhile, switchMap, take, tap } from 'rxjs';
import { Flow } from '../model/flow.class';
import { SeekPage } from '../model/seek-page';
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
import { InstanceRunStatus } from '../model/enum/instance-run-status';
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
								if (response.version.trigger?.type === TriggerType.EMPTY) {
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

	create(collectionId: string, flowDisplayName: string): Observable<Flow> {
		return this.http.post<Flow>(environment.apiUrl + '/flows', {
			displayName: flowDisplayName,
			collectionId: collectionId
		
		});
	}

	get(flowId: string): Observable<Flow> {
		return this.http.get<Flow>(environment.apiUrl + '/flows/' + flowId);
	}

	// TODO REMOVE
	getVersion(flowVersionId: string): Observable<FlowVersion> {
		return this.http.get<FlowVersion>(environment.apiUrl + '/flows/versions/' + flowVersionId);
	}

	listByCollection(integrationId: UUID, limit: number): Observable<SeekPage<Flow>> {
		return this.http.get<SeekPage<Flow>>(
			environment.apiUrl + '/collections/' + integrationId + '/flows?limit=' + limit
		);
	}

	delete(workflowId: UUID): Observable<void> {
		return this.http.delete<void>(environment.apiUrl + '/flows/' + workflowId);
	}

	update(flowId: UUID, flow: FlowVersion): Observable<Flow> {
		const formData = new FormData();
		const clonedFlowVersion: Partial<FlowVersion> = FlowVersion.clone(flow);
		(clonedFlowVersion as any).flowId = clonedFlowVersion.flow_id;
		delete clonedFlowVersion.flow_id;
		formData.append(
			'flow',
			new Blob([JSON.stringify(clonedFlowVersion)], {
				type: 'application/json',
			})
		);
		const dirtyStepsArtifacts = this.codeService.getDirtyArtifactsForFlowSteps(flowId);
		const artifactsAndTheirNames: ArtifactAndItsNameInFormData[] = [...dirtyStepsArtifacts];
		const updateFlow$ = this.http.put<any>(environment.apiUrl + '/flows/' + flowId, formData);
		const artifacts$ = zipAllArtifacts(artifactsAndTheirNames);

		if (artifacts$.length == 0) {
			return updateFlow$;
		}
		return forkJoin(artifacts$).pipe(
			tap(zippedFilesAndTheirNames => {
				addArtifactsToFormData(zippedFilesAndTheirNames, formData);
			}),
			switchMap(() => {
				const updateFlowWithArtifacts$ = this.http.put<any>(environment.apiUrl + '/flows/' + flowId, formData);
				return updateFlowWithArtifacts$;
			}),
			tap(() => {
				this.codeService.unmarkDirtyArtifactsInFlowStepsCache(flowId);
			})
		);
	}

	execute(collectionVersionId: UUID, flowVersionId, payload: any): Observable<InstanceRun> {
		return this.http
			.post<InstanceRun>(
				environment.apiUrl +
					'/collection-versions/' +
					collectionVersionId +
					'/flow-versions/' +
					flowVersionId +
					'/runs',
				{ payload: payload }
			)
			.pipe(
				switchMap(instanceRun => {
					if (instanceRun.status !== InstanceRunStatus.RUNNING && instanceRun.logs_file_id) {
						return this.logs(instanceRun.logs_file_id).pipe(
							map(state => {
								return { ...instanceRun, state: state };
							})
						);
					}
					return of(instanceRun);
				})
			);
	}

	logs(fileId: UUID): Observable<InstanceRunState> {
		return this.http.get<InstanceRunState>(environment.apiUrl + `/files/${fileId}`);
	}
}
