import { Injectable } from '@angular/core';
import { Actions, concatLatestFrom, createEffect, ofType } from '@ngrx/effects';
import {
  catchError,
  concatMap,
  delay,
  EMPTY,
  Observable,
  of,
  switchMap,
  tap,
} from 'rxjs';
import { Store } from '@ngrx/store';
import {
  FlowsActions,
  FlowsActionType,
  SingleFlowModifyingState,
} from './flows.action';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BuilderSelectors } from '../builder/builder.selector';
import { UUID } from 'angular2-uuid';
import { BuilderActions } from '../builder/builder.action';
import {
  Flow,
  FlowOperationRequest,
  FlowOperationType,
  TriggerType,
} from '@activepieces/shared';
import { RightSideBarType } from '../../model/enums/right-side-bar-type.enum';
import { LeftSideBarType } from '../../model/enums/left-side-bar-type.enum';
import { NO_PROPS } from '../../model/builder-state';
import { CollectionBuilderService } from '../../service/collection-builder.service';
import { FlowService, environment } from '@activepieces/ui/common';
@Injectable()
export class FlowsEffects {
  loadInitial$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(BuilderActions.loadInitial),
      switchMap(({ flow, run, folder }) => {
        return of(FlowsActions.setInitial({ flow, run, folder }));
      }),
      catchError((err) => {
        console.error(err);
        throw err;
      })
    );
  });

  removeStepSelection$ = createEffect(() => {
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
            stepName: flow.version.trigger.name,
          })
        );
      })
    );
  });

  deleteStep = createEffect(() => {
    return this.actions$.pipe(
      ofType(FlowsActions.deleteAction),
      concatLatestFrom(() => [
        this.store.select(BuilderSelectors.selectCurrentRightSideBarType),
      ]),
      switchMap(([{ operation }, rightSidebar]) => {
        if (rightSidebar === RightSideBarType.EDIT_STEP) {
          return of(
            FlowsActions.setRightSidebar({
              sidebarType: RightSideBarType.NONE,
              props: NO_PROPS,
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
        this.store.select(BuilderSelectors.selectCurrentFlow)
      ),
      switchMap(([{ operation }]) => {
        return of(
          FlowsActions.selectStepByName({ stepName: operation.action.name })
        );
      })
    );
  });

  exitRun$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(FlowsActions.exitRun),
      concatLatestFrom(() =>
        this.store.select(BuilderSelectors.selectCurrentLeftSidebarType)
      ),
      switchMap(([action, leftSideBar]) => {
        if (leftSideBar === LeftSideBarType.SHOW_RUN) {
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
      concatMap(([run]) => {
        return of(
          FlowsActions.setLeftSidebar({
            sidebarType: LeftSideBarType.SHOW_RUN,
          })
        );
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
              props: NO_PROPS,
            })
          );
        }
        const actionsToDispatch: Array<any> = [
          FlowsActions.setRightSidebar({
            sidebarType: RightSideBarType.EDIT_STEP,
            props: NO_PROPS,
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

  applyUpdateOperationS = createEffect(
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
          const shownBar = this.snackBar.open(
            'You have unsaved changes on this page due to network disconnection.',
            'Refresh',
            { duration: undefined, panelClass: 'error' }
          );
          shownBar.afterDismissed().subscribe(() => location.reload());
          return of(FlowsActions.savedFailed(e));
        })
      );
    },
    { dispatch: false }
  );

  private processFlowUpdate(request: {
    operation: FlowOperationRequest;
    flow: Flow;
    saveRequestId: UUID;
  }): Observable<Flow> {
    const update$ = this.flowService.update(request.flow.id, request.operation);
    const updateTap = tap((updatedFlow: Flow) => {
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
    });
    if (environment.production) {
      return update$.pipe(updateTap);
    }
    //so in development mode the publish button doesn't flicker constantly and cause us to have epilieptic episodes
    return update$.pipe(delay(150), updateTap);
  }

  constructor(
    private pieceBuilderService: CollectionBuilderService,
    private flowService: FlowService,
    private store: Store,
    private actions$: Actions,
    private snackBar: MatSnackBar
  ) {}
}
