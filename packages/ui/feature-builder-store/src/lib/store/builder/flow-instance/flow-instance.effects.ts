import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType, concatLatestFrom } from '@ngrx/effects';
import { EMPTY, catchError, of, tap } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FlowInstance, FlowInstanceStatus } from '@activepieces/shared';
import { FlowInstanceActions } from './flow-instance.action';
import { FlowInstanceService } from '@activepieces/ui/common';
import { BuilderSelectors } from '../builder.selector';
import { BuilderActions } from '../builder.action';

@Injectable()
export class FlowInstanceEffects {
  loadInitial$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(BuilderActions.loadInitial),
      switchMap(({ instance }: { instance?: FlowInstance }) => {
        if (instance === undefined) {
          return EMPTY;
        }
        return of(
          FlowInstanceActions.setInitial({
            instance: instance,
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
              return of(
                FlowInstanceActions.publishSuccess({
                  instance: instance,
                  showSnackbar: true,
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
                FlowInstanceActions.publishSuccess({
                  instance: instance,
                  showSnackbar: false,
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
                FlowInstanceActions.publishSuccess({
                  instance: instance,
                  showSnackbar: false,
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

  constructor(
    private flowInstanceService: FlowInstanceService,
    private actions$: Actions,
    private store: Store,
    private snackBar: MatSnackBar
  ) {}
}
