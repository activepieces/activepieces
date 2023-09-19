import { Injectable } from '@angular/core';
import { Actions, concatLatestFrom, createEffect, ofType } from '@ngrx/effects';
import { EMPTY, of } from 'rxjs';
import { catchError, map, switchMap, tap } from 'rxjs/operators';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Store } from '@ngrx/store';
import { CommonActions } from '../common.action';
import { ProjectActions } from './project.action';
import { ProjectSelectors } from './project.selector';
import { AuthenticationService } from '../../service/authentication.service';
import { ProjectService } from '../../service/project.service';

@Injectable()
export class ProjectEffects {
  loadInitial$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(CommonActions.loadInitial),
      switchMap(({ user }) => {
        if (user === undefined) {
          return EMPTY;
        }
        return this.projectService.list().pipe(
          tap((projects) => {
            if (!projects || projects.length === 0) {
              console.error('No projects are assigned to the current user');
              this.authenticationService.logout();
            }
          }),
          map((projects) => ProjectActions.setProjects({ projects })),
          catchError((error) => {
            this.snackBar.open(
              `Error loading projects: ${error.message}`,
              'Dismiss'
            );
            this.authenticationService.logout();
            return of({ type: 'Load Projects Error' });
          })
        );
      })
    );
  });

  updateProject$ = createEffect(
    () => {
      return this.actions$.pipe(
        ofType(ProjectActions.updateProject),
        concatLatestFrom(() =>
          this.store.select(ProjectSelectors.selectProject)
        ),
        switchMap(([{ notifyStatus }, project]) => {
          return this.projectService
            .update(project.id, {
              notifyStatus: notifyStatus,
            })
            .pipe(
              catchError((error) => {
                this.snackBar.open(
                  `Error updating project: ${error.message}`,
                  'Dismiss'
                );
                return EMPTY;
              })
            );
        })
      );
    },
    { dispatch: false }
  );

  constructor(
    private actions$: Actions,
    private store: Store,
    private authenticationService: AuthenticationService,
    private projectService: ProjectService,
    private snackBar: MatSnackBar
  ) {}
}
