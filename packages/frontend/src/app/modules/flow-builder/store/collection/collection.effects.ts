import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType, concatLatestFrom } from '@ngrx/effects';
import { catchError, debounceTime, of, tap } from 'rxjs';
import { concatMap, map, switchMap } from 'rxjs/operators';
import {
  CollectionActions,
  CollectionModifyingState,
  savedFailed,
  savedSuccess,
} from './collection.action';
import { CollectionService } from '../../../common/service/collection.service';
import { Store } from '@ngrx/store';
import { CollectionBuilderService } from '../../service/collection-builder.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BuilderSelectors } from '../builder/builder.selector';
import { BuilderActions } from '../builder/builder.action';
import { InstanceStatus } from '@activepieces/shared';
import { InstanceService } from '../../../common/service/instance.service';
import { autoSaveDebounceTime } from '../../../common/utils';

@Injectable()
export class CollectionEffects {
  saving$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(...CollectionModifyingState),
      concatLatestFrom(() =>
        this.store.select(BuilderSelectors.selectCurrentCollection)
      ),
      debounceTime(autoSaveDebounceTime),
      concatMap(([action, collection]) => {
        return this.collectionService
          .update(collection.id, {
            displayName: collection.displayName,
          })
          .pipe(
            tap(() => {
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
              this.collectionBuilderService.lastSuccessfulSaveDate = `Last saved on ${nowDate} at ${nowTime}.`;
            }),
            concatMap((collection) => {
              return of(savedSuccess({ collection: collection }));
            }),
            catchError((error) => {
              const shownBar = this.snackBar.open(
                'You have unsaved changes on this page due to network disconnection.',
                'Refresh',
                { panelClass: 'error', duration: undefined }
              );
              shownBar.afterDismissed().subscribe(() => location.reload());
              return of(savedFailed(error));
            })
          );
      })
    );
  });

  loadInitial$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(BuilderActions.loadInitial),
      map(({ collection, instance }) => {
        return CollectionActions.setInitial({
          collection: collection,
          instance: instance,
        });
      })
    );
  });

  publishFailed$ = createEffect(
    () => {
      return this.actions$.pipe(
        ofType(CollectionActions.publishFailed),
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
        ofType(CollectionActions.publishSuccess),
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
      ofType(CollectionActions.publish),
      concatLatestFrom((action) => [
        this.store.select(BuilderSelectors.selectCurrentCollection),
      ]),
      switchMap(([action, collection]) => {
        return this.instanceService
          .publish({
            collectionId: collection.id,
            status: InstanceStatus.ENABLED,
          })
          .pipe(
            switchMap((instance) => {
              return of(
                CollectionActions.publishSuccess({
                  instance: instance,
                  showSnackbar: true,
                })
              );
            }),
            catchError((err) => {
              console.error(err);
              return of(CollectionActions.publishFailed());
            })
          );
      })
    );
  });

  enableInstance$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(CollectionActions.enableInstance),
      concatLatestFrom((action) => [
        this.store.select(BuilderSelectors.selectCurrentCollection),
      ]),
      switchMap(([action, collection]) => {
        return this.instanceService
          .publish({
            collectionId: collection.id,
            status: InstanceStatus.ENABLED,
          })
          .pipe(
            switchMap((instance) => {
              return of(
                CollectionActions.publishSuccess({
                  instance: instance,
                  showSnackbar: false,
                })
              );
            }),
            catchError((err) => {
              console.error(err);
              return of(CollectionActions.publishFailed());
            })
          );
      })
    );
  });

  disableInstance$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(CollectionActions.disableInstance),
      concatLatestFrom((action) => [
        this.store.select(BuilderSelectors.selectCurrentCollection),
      ]),
      switchMap(([action, collection]) => {
        return this.instanceService
          .publish({
            collectionId: collection.id,
            status: InstanceStatus.DISABLED,
          })
          .pipe(
            switchMap((instance) => {
              return of(
                CollectionActions.publishSuccess({
                  instance: instance,
                  showSnackbar: false,
                })
              );
            }),
            catchError((err) => {
              console.error(err);
              return of(CollectionActions.publishFailed());
            })
          );
      })
    );
  });

  constructor(
    private collectionBuilderService: CollectionBuilderService,
    private collectionService: CollectionService,
    private instanceService: InstanceService,
    private store: Store,
    private actions$: Actions,
    private snackBar: MatSnackBar
  ) {}
}
