import { Injectable } from '@angular/core';
import { Actions, concatLatestFrom, createEffect, ofType } from '@ngrx/effects';
import {
	catchError,
	concatMap,
	EMPTY,
	groupBy,
	mergeMap,
	Observable,
	of,
	switchMap,
	tap,
	throttle,
	throwError,
} from 'rxjs';
import { map } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { FlowsActions, SingleFlowModifyingState } from '../action/flows.action';
import { FlowService } from '../../../common-layout/service/flow.service';
import { CollectionBuilderService } from '../../service/collection-builder.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BuilderSelectors } from '../selector/flow-builder.selector';
import { RightSideBarType } from '../../../common-layout/model/enum/right-side-bar-type.enum';
import { LeftSideBarType } from '../../../common-layout/model/enum/left-side-bar-type.enum';
import { TriggerType } from '../../../common-layout/model/enum/trigger-type.enum';
import { TestRunBarComponent } from '../../page/flow-builder/test-run-bar/test-run-bar.component';
import { UUID } from 'angular2-uuid';
import { Flow } from 'src/app/layout/common-layout/model/flow.class';
import { Trigger } from 'src/app/layout/common-layout/model/flow-builder/trigger/trigger.interface';
import { BuilderActions } from '../action/builder.action';
import { CodeService } from '../../service/code.service';
import { StepCacheKey } from '../../service/artifact-cache-key';
import { TabState } from '../model/tab-state';
import { VersionEditState } from 'src/app/layout/common-layout/model/enum/version-edit-state.enum';
import { CollectionService } from 'src/app/layout/common-layout/service/collection.service';
import { RunDetailsService } from '../../page/flow-builder/flow-left-sidebar/run-details/iteration-details.service';

@Injectable()
export class FlowsEffects {
	// We cannot merge deleteFlow with SingleFlowModifyingState,
	// as usage of current flow selector to fetch flow id
	// but after deletion instantly this will be another flow after deleted flow.
	startDeleteFlow$ = createEffect(() => {
		return this.actions$.pipe(
			ofType(FlowsActions.deleteFlow),
			concatMap(action => {
				const genSavedId = UUID.UUID();
				return of(FlowsActions.deleteFlowStarted({ flowId: action.flowId, saveRequestId: genSavedId }));
			})
		);
	});

	deleteFlowStarted$ = createEffect(() => {
		return this.actions$.pipe(
			ofType(FlowsActions.deleteFlowStarted),
			concatMap((action: { flowId: UUID; saveRequestId: UUID }) => {
				return this.flowService.delete(action.flowId).pipe(
					map(() => {
						return FlowsActions.deleteSuccess({ saveRequestId: action.saveRequestId });
					})
				);
			}),
			catchError(error => of(FlowsActions.savedFailed(error)))
		);
	});

	deleteStepArtifactFromCache = createEffect(
		() => {
			return this.actions$.pipe(
				ofType(FlowsActions.deleteStep),
				concatLatestFrom(() => [this.store.select(BuilderSelectors.selectCurrentFlow)]),
				concatMap(([action, flow]) => {
					if (flow === undefined) {
						return throwError(() => new Error('Internal error, current flow cannot be selected when deleting step'));
					}
					this.codeService.removeArtifactInFlowStepsCache(new StepCacheKey(flow.id, action.stepName));
					return of(void 0);
				})
			);
		},
		{
			dispatch: false,
		}
	);

	startSaveFlow$ = createEffect(() => {
		return this.actions$.pipe(
			ofType(...SingleFlowModifyingState),
			concatLatestFrom(action => [
				this.store.select(BuilderSelectors.selectCurrentFlow),
				this.store.select(BuilderSelectors.selectCurrentCollection),
			]),
			concatMap(([action, flow, collection]) => {
				if (collection.last_version.state === VersionEditState.LOCKED) {
					return this.collectionService.update(collection.id, collection.last_version).pipe(
						map(() => {
							const genSavedId = UUID.UUID();
							return FlowsActions.saveFlowStarted({ flow: flow!, saveRequestId: genSavedId });
						})
					);
				} else {
					const genSavedId = UUID.UUID();
					return of(FlowsActions.saveFlowStarted({ flow: flow!, saveRequestId: genSavedId }));
				}
			})
		);
	});

	saveFlowStarted$ = createEffect(
		() => {
			return this.actions$.pipe(
				ofType(FlowsActions.saveFlowStarted),
				groupBy(action => action.flow.id),
				mergeMap(changeFlowPendingAction$ => {
					return changeFlowPendingAction$.pipe(
						concatLatestFrom(action => [
							this.store.select(BuilderSelectors.selectFlow(action.flow.id)),
							this.store.select(BuilderSelectors.selectTabState(action.flow.id)),
						]),
						throttle(
							([action, flow, tabState]) => {
								if (flow === undefined || tabState === undefined) {
									return throwError(() => new Error('Flow is not selected'));
								}
								return this.processFlowUpdate({ flow: flow, tabState: tabState, saveRequestId: action.saveRequestId });
							},
							{ trailing: true, leading: true }
						),
						catchError(e => {
							console.error(e);
							const shownBar = this.snackBar.open(
								'You have unsaved changes on this page due to network disconnection.',
								'Refresh',
								{ duration: undefined, panelClass: 'error' }
							);
							shownBar.afterDismissed().subscribe(() => location.reload());
							return of(FlowsActions.savedFailed(e));
						})
					);
				})
			);
		},
		{ dispatch: false }
	);

	private processFlowUpdate(request: { flow: Flow; tabState: TabState; saveRequestId: UUID }): Observable<Flow> {
		return this.flowService.update(request.flow.id, request.flow.last_version).pipe(
			tap(updatedFlow => {
				this.store.dispatch(FlowsActions.savedSuccess({ saveRequestId: request.saveRequestId, flow: updatedFlow }));
				const now = new Date();
				const nowDate = now.toLocaleDateString('en-us', {
					month: 'long',
					day: 'numeric',
					year: 'numeric',
				});
				const nowTime = `${now.getHours().toString().padEnd(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
				this.pieceBuilderService.lastSuccessfulSaveDate = `Last saved on ${nowDate} at ${nowTime}.`;
			})
		);
	}

	loadInitial$ = createEffect(() => {
		return this.actions$.pipe(
			ofType(BuilderActions.loadInitial),
			map(({ flows, run }) => {
				return FlowsActions.setInitial({
					flows: flows,
					run: run,
				});
			})
		);
	});

	addFlow$ = createEffect(() => {
		return this.actions$.pipe(
			ofType(FlowsActions.addFlow),
			switchMap(action => {
				return of(FlowsActions.selectFlow({ flowId: action.flow.id }));
			})
		);
	});

	removePieceSelection = createEffect(() => {
		return this.actions$.pipe(
			ofType(FlowsActions.setRightSidebar),
			concatLatestFrom(() => this.store.select(BuilderSelectors.selectCurrentStepName)),
			switchMap(
				([{ sidebarType }, stepName]: [request: { sidebarType: RightSideBarType }, stepName: string | null]) => {
					if (sidebarType !== RightSideBarType.EDIT_STEP && stepName) {
						return of(FlowsActions.deselectStep());
					}
					return EMPTY;
				}
			)
		);
	});

	replaceTrigger = createEffect(() => {
		return this.actions$.pipe(
			ofType(FlowsActions.replaceTrigger),
			switchMap((params: { newTrigger: Trigger }) => {
				return of(FlowsActions.selectStep({ step: params.newTrigger }));
			})
		);
	});

	deleteStep = createEffect(() => {
		return this.actions$.pipe(
			ofType(FlowsActions.deleteStep),
			concatLatestFrom(() => [
				this.store.select(BuilderSelectors.selectCurrentTabState),
				this.store.select(BuilderSelectors.selectCurrentStepName),
			]),
			switchMap(([{ stepName: stepToDeleteName }, state, currentStepName]) => {
				if (state && currentStepName === stepToDeleteName && state.rightSidebar.type === RightSideBarType.EDIT_STEP) {
					return of(
						FlowsActions.setRightSidebar({
							sidebarType: RightSideBarType.NONE,
							props: {},
						})
					);
				}
				return EMPTY;
			})
		);
	});

	addStep = createEffect(() => {
		return this.actions$.pipe(
			ofType(FlowsActions.addStep),
			concatLatestFrom(() => this.store.select(BuilderSelectors.selectCurrentFlowId)),
			switchMap(([{ newAction }]) => {
				return of(FlowsActions.selectStep({ step: newAction }));
			})
		);
	});

	handleRunSnackbar$ = createEffect(
		() => {
			return this.actions$.pipe(
				ofType(FlowsActions.selectFlow),
				concatLatestFrom(() => this.store.select(BuilderSelectors.selectCurrentFlowRun)),
				tap(([{ flowId }, run]) => {
					if (run === undefined) {
						this.snackBar.dismiss();
					} else {
						this.snackBar.openFromComponent(TestRunBarComponent, {
							duration: undefined,
							data: { flowId: flowId },
						});
					}
				})
			);
		},
		{
			dispatch: false,
		}
	);

	exitRun$ = createEffect(() => {
		return this.actions$.pipe(
			ofType(FlowsActions.exitRun),
			concatLatestFrom(() => this.store.select(BuilderSelectors.selectCurrentLeftSidebar)),
			switchMap(([{ flowId }, leftSideBar]) => {
				if (leftSideBar != null && leftSideBar.type === LeftSideBarType.SHOW_RUN) {
					return of(
						FlowsActions.setLeftSidebar({
							sidebarType: LeftSideBarType.NONE,
						})
					);
				}
				return EMPTY;
			})
		);
	});

	setRun$ = createEffect(() => {
		return this.actions$.pipe(
			ofType(FlowsActions.setRun),
			concatLatestFrom(() => [this.store.select(BuilderSelectors.selectCurrentFlow)]),
			concatMap(([run, flow]) => {
				if (run?.flowId === flow?.id) {
					return of(
						FlowsActions.setLeftSidebar({
							sidebarType: LeftSideBarType.SHOW_RUN,
						})
					);
				}
				this.runDetailsService.currentStepResult$.next(undefined);
				return EMPTY;
			})
		);
	});

	stepSelectedEffect = createEffect(() => {
		return this.actions$.pipe(
			ofType(FlowsActions.selectStep),
			concatLatestFrom(() => [this.store.select(BuilderSelectors.selectCurrentFlowRun)]),
			switchMap(([{ step }, run]) => {
				if (step && step.type === TriggerType.EMPTY) {
					return of(
						FlowsActions.setRightSidebar({
							sidebarType: RightSideBarType.TRIGGER_TYPE,
							props: {},
						})
					);
				}
				const actionsToDispatch: Array<any> = [
					FlowsActions.setRightSidebar({
						sidebarType: RightSideBarType.EDIT_STEP,
						props: {},
					}),
				];
				if (run) {
					actionsToDispatch.push(
						FlowsActions.setLeftSidebar({
							sidebarType: LeftSideBarType.SHOW_RUN,
						})
					);
				}
				return of(...actionsToDispatch);
			})
		);
	});

	constructor(
		private pieceBuilderService: CollectionBuilderService,
		private flowService: FlowService,
		private store: Store,
		private actions$: Actions,
		private snackBar: MatSnackBar,
		private codeService: CodeService,
		private collectionService: CollectionService,
		private runDetailsService: RunDetailsService
	) {}
}
