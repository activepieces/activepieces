import { Injectable } from '@angular/core';
import { Actions, concatLatestFrom, createEffect, ofType } from '@ngrx/effects';
import {
  catchError,
  concatMap,
  delay,
  EMPTY,
  Observable,
  of,
  map,
  switchMap,
  tap,
} from 'rxjs';
import { Store } from '@ngrx/store';
import {
  FlowsActions,
  FlowsActionType,
  SingleFlowModifyingState,
} from './flow.action';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BuilderSelectors } from '../builder/builder.selector';
import { UUID } from 'angular2-uuid';
import { BuilderActions } from '../builder/builder.action';
import { PannerService } from '@activepieces/ui-canvas-utils';
import {
  ActionType,
  PopulatedFlow,
  FlowOperationRequest,
  FlowOperationType,
  TriggerType,
  flowHelper,
  FlowVersionState,
  FlowStatus,
} from '@activepieces/shared';
import { RightSideBarType } from '../../model/enums/right-side-bar-type.enum';
import { LeftSideBarType } from '../../model/enums/left-side-bar-type.enum';
import { NO_PROPS } from '../../model/canvas-state';
import {
  BuilderAutocompleteMentionsDropdownService,
  FlowService,
  environment,
  FlowBuilderService,
  appConnectionsActions,
} from '@activepieces/ui/common';
import { canvasActions } from '../builder/canvas/canvas.action';
import { ViewModeActions } from '../builder/viewmode/view-mode.action';
import { ViewModeEnum } from '../../model';
import { HttpStatusCode } from '@angular/common/http';
import { FlowStructureUtil } from '../../utils/flowStructureUtil';
@Injectable()
export class FlowsEffects {
  initialiseFlowState$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(BuilderActions.loadInitial),
      switchMap(({ flow, run, publishedVersion }) => {
        return of(
          FlowsActions.setInitial({
            flow: { ...flow, publishedFlowVersion: publishedVersion },
            run,
          })
        );
      }),
      catchError((err) => {
        console.error(err);
        throw err;
      })
    );
  });
  initialiseConnectionsState$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(BuilderActions.loadInitial),
      switchMap(({ appConnections }) => {
        return of(
          appConnectionsActions.loadInitial({ connections: appConnections })
        );
      }),
      catchError((err) => {
        console.error(err);
        throw err;
      })
    );
  });

  replaceTrigger$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(FlowsActions.updateTrigger),
      concatLatestFrom(() =>
        this.store.select(BuilderSelectors.selectCurrentFlow)
      ),
      switchMap(([action, flow]) => {
        return of(
          canvasActions.selectStepByName({
            stepName: flow.version.trigger.name,
          })
        );
      })
    );
  });

  selectFirstInvalidStep$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(FlowsActions.selectFirstInvalidStep),
      concatLatestFrom(() =>
        this.store.select(BuilderSelectors.selectCurrentFlow)
      ),
      switchMap(([_, flow]) => {
        const invalidSteps = flowHelper
          .getAllSteps(flow.version.trigger)
          .filter((s) => !s.valid);
        if (invalidSteps.length > 0) {
          return of(
            canvasActions.selectStepByName({
              stepName: invalidSteps[0].name,
            })
          );
        }
        return EMPTY;
      })
    );
  });

  deleteStep$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(FlowsActions.deleteAction),
      concatLatestFrom(() => [
        this.store.select(BuilderSelectors.selectCurrentRightSideBarType),
      ]),
      switchMap(([{ operation }, rightSidebar]) => {
        if (rightSidebar === RightSideBarType.EDIT_STEP) {
          return of(
            canvasActions.setRightSidebar({
              sidebarType: RightSideBarType.NONE,
              props: NO_PROPS,
              deselectCurrentStep: true,
            })
          );
        }
        return EMPTY;
      })
    );
  });
  moveStep$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(FlowsActions.moveAction),
      concatLatestFrom(() => [
        this.store.select(BuilderSelectors.selectCurrentRightSideBarType),
      ]),
      switchMap(([{ operation }, rightSidebar]) => {
        if (rightSidebar === RightSideBarType.EDIT_STEP) {
          return of(
            canvasActions.setRightSidebar({
              sidebarType: RightSideBarType.NONE,
              props: NO_PROPS,
              deselectCurrentStep: true,
            })
          );
        }
        return EMPTY;
      })
    );
  });

  addStep$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(FlowsActions.addAction),
      concatLatestFrom(() =>
        this.store.select(BuilderSelectors.selectCurrentFlow)
      ),
      switchMap(([{ operation }]) => {
        return of(
          canvasActions.selectStepByName({ stepName: operation.action.name })
        );
      })
    );
  });

  stepSelected$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(canvasActions.selectStepByName),
      concatLatestFrom(() => [
        this.store.select(BuilderSelectors.selectCurrentStep),
        this.store.select(BuilderSelectors.selectCurrentFlowRun),
      ]),
      tap(() => {
        this.builderAutocompleteService.currentAutocompleteInputId$.next(null);
        this.builderAutocompleteService.currentAutoCompleteInputContainer$.next(
          null
        );
      }),
      switchMap(([{ stepName }, step, run]) => {
        if (step) {
          switch (step.type) {
            case TriggerType.EMPTY:
              return of(
                canvasActions.setRightSidebar({
                  sidebarType: RightSideBarType.TRIGGER_TYPE,
                  props: NO_PROPS,
                  deselectCurrentStep: false,
                })
              );
            case ActionType.BRANCH:
            case ActionType.CODE:
            case ActionType.LOOP_ON_ITEMS:
            case TriggerType.PIECE:
            case ActionType.PIECE: {
              const actionsToDispatch: Array<any> = [
                canvasActions.setRightSidebar({
                  sidebarType: RightSideBarType.EDIT_STEP,
                  props: NO_PROPS,
                  deselectCurrentStep: false,
                }),
              ];
              if (run) {
                actionsToDispatch.push(
                  canvasActions.setLeftSidebar({
                    sidebarType: LeftSideBarType.SHOW_RUN,
                  })
                );
              }
              return of(...actionsToDispatch);
            }
          }
        }
        return EMPTY;
      })
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
          case FlowsActionType.UPDATE_TRIGGER: {
            const op = FlowStructureUtil.removeAnySubequentStepsFromTrigger(
              action.operation
            );
            flowOperation = {
              type: FlowOperationType.UPDATE_TRIGGER,
              request: op,
            };
            break;
          }
          case FlowsActionType.ADD_ACTION:
            flowOperation = {
              type: FlowOperationType.ADD_ACTION,
              request: action.operation,
            };
            break;
          case FlowsActionType.UPDATE_ACTION: {
            const op = FlowStructureUtil.removeAnySubequentStepsFromAction(
              action.operation
            );
            flowOperation = {
              type: FlowOperationType.UPDATE_ACTION,
              request: op,
            };
            break;
          }
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
          case FlowsActionType.MOVE_ACTION: {
            flowOperation = {
              type: FlowOperationType.MOVE_ACTION,
              request: action.operation,
            };
            break;
          }
          case FlowsActionType.DUPLICATE_ACTION: {
            flowOperation = {
              request: {
                stepName: action.operation.originalStepName,
              },
              type: FlowOperationType.DUPLICATE_ACTION,
            };
            break;
          }
        }
        if (flow) {
          return of(
            FlowsActions.applyUpdateOperation({
              flow: flow,
              operation: flowOperation,
              saveRequestId: genSavedId,
            })
          );
        }
        return EMPTY;
      })
    );
  });

  applyUpdateOperation$ = createEffect(
    () => {
      return this.actions$.pipe(
        ofType(FlowsActions.applyUpdateOperation),
        concatMap((action) => {
          return this.processFlowUpdate({
            operation: action.operation,
            flow: action.flow,
            saveRequestId: action.saveRequestId,
          });
        }),
        catchError((e) => {
          console.error(e);
          if (e.status === HttpStatusCode.Conflict) {
            const shownBar = this.snackBar.open(
              'The flow was edited by another teammate less than 1 minute ago. Please wait and try again later.',
              'Refresh',
              { duration: undefined, panelClass: 'error' }
            );
            shownBar.afterDismissed().subscribe(() => location.reload());
          } else {
            const shownBar = this.snackBar.open(
              'You have unsaved changes on this page due to network disconnection.',
              'Refresh',
              { duration: undefined, panelClass: 'error' }
            );
            shownBar.afterDismissed().subscribe(() => location.reload());
          }
          return of(FlowsActions.savedFailed(e));
        })
      );
    },
    { dispatch: false }
  );

  private processFlowUpdate(request: {
    operation: FlowOperationRequest;
    flow: PopulatedFlow;
    saveRequestId: UUID;
  }): Observable<PopulatedFlow> {
    const update$ = this.flowService.update(request.flow.id, request.operation);

    const saveSuccessEffect = (obs$: Observable<PopulatedFlow>) =>
      obs$.pipe(
        concatLatestFrom(() => {
          return [
            this.store.select(BuilderSelectors.selectReadOnly),
            this.store.select(BuilderSelectors.selectPublishedFlowVersion),
            this.store.select(BuilderSelectors.selectViewedVersion),
          ];
        }),
        tap(
          ([
            updatedFlow,
            readOnly,
            publishedFlowVersion,
            selectViewedVersion,
          ]) => {
            if (
              !readOnly &&
              publishedFlowVersion?.id === selectViewedVersion.id
            ) {
              this.store.dispatch(
                canvasActions.updateViewedVersionId({
                  versionId: updatedFlow.version.id,
                })
              );
            }
          }
        ),
        map(([updatedFlow]) => updatedFlow),
        tap((updatedFlow: PopulatedFlow) => {
          this.store.dispatch(
            FlowsActions.savedSuccess({
              saveRequestId: request.saveRequestId,
              flow: updatedFlow,
            })
          );
          this.setLastSaveDate();
        })
      );
    if (environment.production) {
      return update$.pipe(saveSuccessEffect.bind(this));
    }
    //so in development mode the publish button doesn't flicker constantly and cause us to have epilieptic episodes
    return update$.pipe(delay(150), saveSuccessEffect.bind(this));
  }

  publishFailed$ = createEffect(
    () => {
      return this.actions$.pipe(
        ofType(FlowsActions.publishFailed),
        tap(() => {
          this.snackBar.open(`Publishing failed`, '', {
            panelClass: 'error',
            duration: 5000,
          });
        })
      );
    },
    { dispatch: false }
  );

  publishingSuccess$ = createEffect(
    () => {
      return this.actions$.pipe(
        ofType(FlowsActions.publishSuccess),
        tap((action) => {
          if (action.showSnackbar) {
            this.snackBar.open(`Publishing finished`);
          }
        })
      );
    },
    { dispatch: false }
  );

  publish$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(FlowsActions.publish),
      concatLatestFrom(() =>
        this.store.select(BuilderSelectors.selectCurrentFlow)
      ),
      switchMap(([_, flow]) => {
        return this.flowService
          .update(flow.id, {
            type: FlowOperationType.LOCK_AND_PUBLISH,
            request: {},
          })
          .pipe(
            map((flow) => {
              return FlowsActions.publishSuccess({
                status: flow.status,
                showSnackbar: true,
                publishedFlowVersionId: flow.publishedVersionId!,
              });
            }),
            catchError((err) => {
              console.error(err);
              return of(FlowsActions.publishFailed());
            })
          );
      })
    );
  });

  enableInstance$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(FlowsActions.enableFlow),
      concatLatestFrom(() =>
        this.store.select(BuilderSelectors.selectCurrentFlow)
      ),
      switchMap(([_, flow]) => {
        return this.flowService
          .update(flow.id, {
            type: FlowOperationType.CHANGE_STATUS,
            request: {
              status: FlowStatus.ENABLED,
            },
          })
          .pipe(
            switchMap((flow) => {
              return of(
                FlowsActions.updateStatusSuccess({
                  status: flow.status,
                })
              );
            }),
            catchError((err) => {
              console.error(err);
              return of(FlowsActions.publishFailed());
            })
          );
      })
    );
  });

  disableInstance$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(FlowsActions.disableFlow),
      concatLatestFrom(() =>
        this.store.select(BuilderSelectors.selectCurrentFlow)
      ),
      switchMap(([_, flow]) => {
        return this.flowService
          .update(flow.id, {
            type: FlowOperationType.CHANGE_STATUS,
            request: {
              status: FlowStatus.DISABLED,
            },
          })
          .pipe(
            switchMap((flow) => {
              return of(
                FlowsActions.updateStatusSuccess({
                  status: flow.status,
                })
              );
            }),
            catchError((err) => {
              console.error(err);
              return of(FlowsActions.publishFailed());
            })
          );
      })
    );
  });

  viewVersion$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(ViewModeActions.setViewMode),
      concatLatestFrom(() => [
        this.store.select(BuilderSelectors.selectPublishedFlowVersion),
        this.store.select(BuilderSelectors.selectCurrentFlow),
      ]),
      switchMap(([action, publishedVersion, currentFlow]) => {
        switch (action.viewMode) {
          case ViewModeEnum.SHOW_PUBLISHED:
            if (publishedVersion) {
              return of(
                canvasActions.viewVersion({
                  viewedFlowVersion: publishedVersion,
                })
              );
            } else {
              throw Error(
                'Trying to view published version when there is none'
              );
            }
          case ViewModeEnum.BUILDING:
            if (currentFlow.version.state === FlowVersionState.LOCKED) {
              throw Error('Trying to view draft version when there is none');
            } else {
              return of(
                canvasActions.viewVersion({
                  viewedFlowVersion: currentFlow.version,
                })
              );
            }
          case ViewModeEnum.SHOW_OLD_VERSION: {
            return of(
              canvasActions.viewVersion({
                viewedFlowVersion: action.version,
              })
            );
          }
        }
      })
    );
  });

  flowImported$ = createEffect(
    () => {
      return this.actions$.pipe(
        ofType(FlowsActions.importFlow),
        tap((res) => {
          this.pannerService.resetZoom(res.flow.version);
        })
      );
    },
    { dispatch: false }
  );

  constructor(
    private pieceBuilderService: FlowBuilderService,
    private flowService: FlowService,
    private store: Store,
    private actions$: Actions,
    private snackBar: MatSnackBar,
    private builderAutocompleteService: BuilderAutocompleteMentionsDropdownService,
    private pannerService: PannerService
  ) {}

  private setLastSaveDate() {
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
  }
}
