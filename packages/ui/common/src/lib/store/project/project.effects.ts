import { Injectable } from '@angular/core';
import { Actions, concatLatestFrom, createEffect, ofType } from '@ngrx/effects';
import { EMPTY } from 'rxjs';
import { catchError, switchMap, tap } from 'rxjs/operators';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Store } from '@ngrx/store';
import { ProjectActions } from './project.action';
import { ProjectSelectors } from './project.selector';
import { PlatformProjectService } from '../../service/platform-project.service';

@Injectable()
export class ProjectEffects {
  constructor(
    private actions$: Actions,
    private store: Store,
    private platformProjectService: PlatformProjectService,
    private snackBar: MatSnackBar
  ) {}

  updateLimits$ = createEffect(
    () => {
      return this.actions$.pipe(
        ofType(ProjectActions.updateLimits),
        concatLatestFrom(() =>
          this.store.select(ProjectSelectors.selectCurrentProject)
        ),
        switchMap(([{ limits }, project]) => {
          return this.platformProjectService
            .update(project.id, {
              plan: limits,
              displayName: project.displayName,
              notifyStatus: project.notifyStatus,
            })
            .pipe(
              tap(() => {
                this.snackBar.open('Project Limits is updated', '', {
                  panelClass: 'success',
                });
              }),
              catchError((error) => {
                this.snackBar.open(
                  `Error updating project: ${error.message}`,
                  '',
                  {
                    panelClass: 'error',
                  }
                );
                return EMPTY;
              })
            );
        })
      );
    },
    { dispatch: false }
  );

  updateNotifyStatus$ = createEffect(
    () => {
      return this.actions$.pipe(
        ofType(ProjectActions.updateNotifyStatus),
        concatLatestFrom(() =>
          this.store.select(ProjectSelectors.selectCurrentProject)
        ),
        switchMap(([{ notifyStatus }, project]) => {
          return this.platformProjectService
            .update(project.id, {
              notifyStatus: notifyStatus,
              displayName: project.displayName,
            })
            .pipe(
              catchError((error) => {
                this.snackBar.open(
                  `Error updating project: ${error.message}`,
                  '',
                  {
                    panelClass: 'error',
                  }
                );
                return EMPTY;
              })
            );
        })
      );
    },
    { dispatch: false }
  );
}
