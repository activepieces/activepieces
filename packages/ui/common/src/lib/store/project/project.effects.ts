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
import { PlatformProjectService } from '../../service/platform-project.service';
import { StatusCodes } from 'http-status-codes';

@Injectable()
export class ProjectEffects {
  loadInitial$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(CommonActions.loadProjects),
      switchMap(({ user, currentProjectId }) => {
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
          map((projects) => {
            return ProjectActions.setProjects({
              projects,
              selectedIndex: projects.findIndex(
                (p) => p.id === currentProjectId
              ),
            });
          }),
          catchError((error) => {
            const status = error?.status;
            if (status === StatusCodes.UNAUTHORIZED) {
              this.snackBar.open(
                `Error loading projects: ${error.message}`,
                'Dismiss'
              );
              this.authenticationService.logout();
            }
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
    private projectService: ProjectService,
    private authenticationService: AuthenticationService,
    private platformProjectService: PlatformProjectService,
    private snackBar: MatSnackBar
  ) {}
}
