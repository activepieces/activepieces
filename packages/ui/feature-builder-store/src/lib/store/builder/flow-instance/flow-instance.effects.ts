import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType, concatLatestFrom } from '@ngrx/effects';
import { EMPTY, catchError, of, tap } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FlowInstanceStatus, FlowVersionState } from '@activepieces/shared';
import { FlowInstanceActions } from './flow-instance.action';
import { FlowInstanceService, FlowService } from '@activepieces/ui/common';
import { BuilderSelectors } from '../builder.selector';
import { BuilderActions } from '../builder.action';
import { ViewModeActions } from '../viewmode/view-mode.action';
import { ViewModeEnum } from '../../../model';
import { canvasActions } from '../canvas/canvas.action';

@Injectable()
export class FlowInstanceEffects {
  loadInitial$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(BuilderActions.loadInitial),
      switchMap((action) => {
        if (
          action.instance === undefined ||
          action.publishedVersion === undefined
        ) {
          return EMPTY;
        }
        return of(
          FlowInstanceActions.setInitial({
            instance: action.instance,
            publishedFlowVersion: action.publishedVersion,
          })
        );
      })
    );
  });

  publishFailed$ = createEffect(
    () => {
      return this.actions$.pipe(
        ofType(FlowInstanceActions.publishFailed),
        tap((action) => {
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
        ofType(FlowInstanceActions.publishSuccess),
        tap((action) => {
          if (action.showSnackbar) {
            this.snackBar.open(`Publishing finished`);
          }
          FlowInstanceActions.setInitial({
            instance: action.instance,
            publishedFlowVersion: action.publishedFlowVersion,
          });
        })
      );
    },
    { dispatch: false }
  );

  publish$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(FlowInstanceActions.publish),
      concatLatestFrom(() =>
        this.store.select(BuilderSelectors.selectCurrentFlow)
      ),
      switchMap(([action, flow]) => {
        return this.flowInstanceService
          .publish({
            flowId: flow.id,
          })
          .pipe(
            switchMap((instance) => {
              return this.flowService
                .get(instance.flowId, instance.flowVersionId)
                .pipe(
                  map((flow) => {
                    return FlowInstanceActions.publishSuccess({
                      instance: instance,
                      showSnackbar: true,
                      publishedFlowVersion: flow.version,
                    });
                  })
                );
            }),
            catchError((err) => {
              console.error(err);
              return of(FlowInstanceActions.publishFailed());
            })
          );
      })
    );
  });

  enableInstance$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(FlowInstanceActions.enableInstance),
      concatLatestFrom(() =>
        this.store.select(BuilderSelectors.selectCurrentFlow)
      ),
      switchMap(([action, flow]) => {
        return this.flowInstanceService
          .updateStatus(flow.id, {
            status: FlowInstanceStatus.ENABLED,
          })
          .pipe(
            switchMap((instance) => {
              return of(
                FlowInstanceActions.updateInstanceStatusSuccess({
                  instance: instance,
                })
              );
            }),
            catchError((err) => {
              console.error(err);
              return of(FlowInstanceActions.publishFailed());
            })
          );
      })
    );
  });

  disableInstance$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(FlowInstanceActions.disableInstance),
      concatLatestFrom(() =>
        this.store.select(BuilderSelectors.selectCurrentFlow)
      ),
      switchMap(([action, flow]) => {
        return this.flowInstanceService
          .updateStatus(flow.id, {
            status: FlowInstanceStatus.DISABLED,
          })
          .pipe(
            switchMap((instance) => {
              return of(
                FlowInstanceActions.updateInstanceStatusSuccess({
                  instance: instance,
                })
              );
            }),
            catchError((err) => {
              console.error(err);
              return of(FlowInstanceActions.publishFailed());
            })
          );
      })
    );
  });

  showPublishedVersion$ = createEffect(() => {
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
                canvasActions.setInitial({
                  displayedFlowVersion: publishedVersion,
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
                canvasActions.setInitial({
                  displayedFlowVersion: currentFlow.version,
                })
              );
            }
          case ViewModeEnum.VIEW_INSTANCE_RUN: {
            throw Error(
              'Trying to view run version, viewing run version should only be the initial state'
            );
          }
        }
      })
    );
  });
  constructor(
    private flowInstanceService: FlowInstanceService,
    private actions$: Actions,
    private store: Store,
    private snackBar: MatSnackBar,
    private flowService: FlowService
  ) {}
}
