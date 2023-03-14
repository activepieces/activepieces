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
  throwError,
} from 'rxjs';
import { map } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import {
  FlowsActions,
  FlowsActionType,
  SingleFlowModifyingState,
} from './flows.action';
import { FlowService } from '../../../common/service/flow.service';
import { CollectionBuilderService } from '../../service/collection-builder.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BuilderSelectors } from '../builder/builder.selector';
import { RightSideBarType } from '../../../common/model/enum/right-side-bar-type.enum';
import { LeftSideBarType } from '../../../common/model/enum/left-side-bar-type.enum';
import { TestRunBarComponent } from '../../page/flow-builder/test-run-bar/test-run-bar.component';
import { UUID } from 'angular2-uuid';
import { BuilderActions } from '../builder/builder.action';
import { TabState } from '../model/tab-state';
import { RunDetailsService } from '../../page/flow-builder/flow-left-sidebar/run-details/iteration-details.service';
import {
  Flow,
  FlowId,
  FlowOperationRequest,
  FlowOperationType,
  TriggerType,
} from '@activepieces/shared';

@Injectable()
export class FlowsEffects {
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
      switchMap((action) => {
        return of(FlowsActions.selectFlow({ flowId: action.flow.id }));
      })
    );
  });

  removePieceSelection = createEffect(() => {
    return this.actions$.pipe(
      ofType(FlowsActions.setRightSidebar),
      concatLatestFrom(() =>
        this.store.select(BuilderSelectors.selectCurrentStepName)
      ),
      switchMap(
        ([{ sidebarType }, stepName]: [
          request: { sidebarType: RightSideBarType },
          stepName: string | null
        ]) => {
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
      ofType(FlowsActions.updateTrigger),
      concatLatestFrom(() =>
        this.store.select(BuilderSelectors.selectCurrentFlow)
      ),
      switchMap(([action, flow]) => {
        return of(
          FlowsActions.selectStepByName({
            stepName: flow!.version!.trigger.name,
          })
        );
      })
    );
  });

  deleteStep = createEffect(() => {
    return this.actions$.pipe(
      ofType(FlowsActions.deleteAction),
      concatLatestFrom(() => [
        this.store.select(BuilderSelectors.selectCurrentTabState),
        this.store.select(BuilderSelectors.selectCurrentStepName),
      ]),
      switchMap(([{ operation }, state, currentStepName]) => {
        if (
          state &&
          currentStepName === operation.name &&
          state.rightSidebar.type === RightSideBarType.EDIT_STEP
        ) {
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
      ofType(FlowsActions.addAction),
      concatLatestFrom(() =>
        this.store.select(BuilderSelectors.selectCurrentFlowId)
      ),
      switchMap(([{ operation }]) => {
        return of(
          FlowsActions.selectStepByName({ stepName: operation.action.name })
        );
      })
    );
  });

  handleRunSnackbar$ = createEffect(
    () => {
      return this.actions$.pipe(
        ofType(FlowsActions.selectFlow),
        concatLatestFrom(() =>
          this.store.select(BuilderSelectors.selectCurrentFlowRun)
        ),
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
      concatLatestFrom(() =>
        this.store.select(BuilderSelectors.selectCurrentLeftSidebar)
      ),
      switchMap(([{ flowId }, leftSideBar]) => {
        if (
          leftSideBar != null &&
          leftSideBar.type === LeftSideBarType.SHOW_RUN
        ) {
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
      concatLatestFrom(() => [
        this.store.select(BuilderSelectors.selectCurrentFlow),
      ]),
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
      ofType(FlowsActions.selectStepByName),
      concatLatestFrom(() => [
        this.store.select(BuilderSelectors.selectCurrentStep),
        this.store.select(BuilderSelectors.selectCurrentFlowRun),
      ]),
      switchMap(([{ stepName }, step, run]) => {
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

  // We cannot merge deleteFlow with SingleFlowModifyingState,
  // as usage of current flow selector to fetch flow id
  // but after deletion instantly this will be another flow after deleted flow.
  startDeleteFlow$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(FlowsActions.deleteFlow),
      concatMap((action) => {
        const genSavedId = UUID.UUID();
        return of(
          FlowsActions.deleteFlowStarted({
            flowId: action.flowId,
            saveRequestId: genSavedId,
          })
        );
      })
    );
  });

  deleteFlowStarted$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(FlowsActions.deleteFlowStarted),
      concatMap((action: { flowId: FlowId; saveRequestId: UUID }) => {
        return this.flowService.delete(action.flowId).pipe(
          map(() => {
            return FlowsActions.deleteSuccess({
              saveRequestId: action.saveRequestId,
            });
          })
        );
      }),
      catchError((error) => of(FlowsActions.savedFailed(error)))
    );
  });

  flowModified$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(...SingleFlowModifyingState),
      concatLatestFrom(() => [
        this.store.select(BuilderSelectors.selectCurrentFlow),
      ]),
      concatMap(([action, flow]) => {
        const genSavedId = UUID.UUID();
        let flowOperation: FlowOperationRequest;
        switch (action.type) {
          case FlowsActionType.UPDATE_TRIGGER:
            flowOperation = {
              type: FlowOperationType.UPDATE_TRIGGER,
              request: action.operation,
            };
            break;
          case FlowsActionType.ADD_ACTION:
            flowOperation = {
              type: FlowOperationType.ADD_ACTION,
              request: action.operation,
            };
            break;
          case FlowsActionType.UPDATE_ACTION:
            flowOperation = {
              type: FlowOperationType.UPDATE_ACTION,
              request: action.operation,
            };
            break;
          case FlowsActionType.DELETE_ACTION:
            flowOperation = {
              type: FlowOperationType.DELETE_ACTION,
              request: action.operation,
            };
            break;
          case FlowsActionType.CHANGE_NAME:
            flowOperation = {
              type: FlowOperationType.CHANGE_NAME,
              request: {
                displayName: action.displayName,
              },
            };
            break;
        }
        return of(
          FlowsActions.applyUpdateOperation({
            flow: flow!,
            operation: flowOperation,
            saveRequestId: genSavedId,
          })
        );
      })
    );
  });

  applyUpdateOperationS = createEffect(
    () => {
      return this.actions$.pipe(
        ofType(FlowsActions.applyUpdateOperation),
        groupBy((action) => action.flow.id),
        mergeMap((changeFlowPendingAction$) => {
          return changeFlowPendingAction$.pipe(
            concatLatestFrom((action) => [
              this.store.select(BuilderSelectors.selectFlow(action.flow.id)),
              this.store.select(
                BuilderSelectors.selectTabState(action.flow.id)
              ),
            ]),
            concatMap(([action, flow, tabState]) => {
              if (flow === undefined || tabState === undefined) {
                return throwError(() => new Error('Flow is not selected'));
              }

              return this.processFlowUpdate({
                operation: action.operation,
                flow: flow,
                tabState: tabState,
                saveRequestId: action.saveRequestId,
              });
            }),
            catchError((e) => {
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

  private processFlowUpdate(request: {
    operation: FlowOperationRequest;
    flow: Flow;
    tabState: TabState;
    saveRequestId: UUID;
  }): Observable<Flow> {
    return this.flowService.update(request.flow.id, request.operation).pipe(
      tap((updatedFlow) => {
        this.store.dispatch(
          FlowsActions.savedSuccess({
            saveRequestId: request.saveRequestId,
            flow: updatedFlow,
          })
        );
        const now = new Date();
        const nowDate = now.toLocaleDateString('en-us', {
          month: 'long',
          day: 'numeric',
          year: 'numeric',
        });
        const nowTime = `${now.getHours().toString().padEnd(2, '0')}:${now
          .getMinutes()
          .toString()
          .padStart(2, '0')}`;
        this.pieceBuilderService.lastSuccessfulSaveDate = `Last saved on ${nowDate} at ${nowTime}.`;
      })
    );
  }

  constructor(
    private pieceBuilderService: CollectionBuilderService,
    private flowService: FlowService,
    private store: Store,
    private actions$: Actions,
    private snackBar: MatSnackBar,
    private runDetailsService: RunDetailsService
  ) {}
}
