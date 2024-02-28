import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import {
  AppConnectionsService,
  AuthenticationService,
  PlatformService,
  RedirectService,
} from '../service';
import { Store } from '@ngrx/store';
import {
  ProjectActions,
  ProjectSelectors,
  appConnectionsActions,
} from '../store';
import {
  Observable,
  catchError,
  forkJoin,
  map,
  of,
  switchMap,
  tap,
} from 'rxjs';
import { ProjectService } from '../service/project.service';
import { StatusCodes } from 'http-status-codes';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ProjectWithLimits, isNil } from '@activepieces/shared';

@Injectable({
  providedIn: 'root',
})
export class UserLoggedIn {
  constructor(
    private auth: AuthenticationService,
    private router: Router,
    private redirectService: RedirectService,
    private store: Store,
    private projectService: ProjectService,
    private platformService: PlatformService,
    private snackBar: MatSnackBar,
    private authenticationService: AuthenticationService,
    private connectionsService: AppConnectionsService
  ) {}

  canActivate(): boolean | Observable<boolean> {
    const currentURL = window.location.href;
    const relativeURL = currentURL.replace(window.location.origin, '');

    // Set the default redirect URL
    let redirectTo = '/sign-in';

    // Check if the URL starts with "/invitation"
    if (relativeURL.startsWith('/invitation')) {
      redirectTo = '/sign-up';
    }

    // Redirect to the appropriate page if the user is not logged in
    if (!this.auth.isLoggedIn()) {
      this.redirectService.setRedirectRouteToCurrentRoute();
      this.router.navigate([redirectTo]);
      return false;
    }
    if (this.auth.isLoggedIn() && isNil(this.auth.getPlatformId())) {
      this.authenticationService.logout();
      return false;
    }

    return this.store.select(ProjectSelectors.selectCurrentProject).pipe(
      switchMap((project) => {
        if (project) {
          return of(true);
        }
        const observables = {
          projects: this.projectService.list(),
          connections: this.connectionsService.list({
            limit: 999999,
            projectId: this.auth.getProjectId(),
          }),
        };
        return forkJoin(observables).pipe(
          tap(({ projects }) => {
            if (!projects || projects.length === 0) {
              console.error('No projects are assigned to the current user');
              this.auth.logout();
            }
          }),
          switchMap(({ projects, connections }) => {
            const platformId =
              projects.length > 0 ? projects[0].platformId : undefined;
            const currentProjectId = this.auth.getProjectId();
            this.store.dispatch(
              appConnectionsActions.loadInitial({
                connections: connections.data,
              })
            );

            if (platformId) {
              return this.loadPlatformAndProjects({
                platformId,
                projects,
                currentProjectId,
              });
            }
            this.store.dispatch(
              ProjectActions.setProjects({
                projects,
                selectedIndex: projects.findIndex(
                  (p) => p.id === currentProjectId
                ),
                platform: undefined,
              })
            );

            return of(true);
          }),
          catchError((error) => {
            const status = error?.status;
            if (
              status === StatusCodes.UNAUTHORIZED ||
              status === StatusCodes.INTERNAL_SERVER_ERROR
            ) {
              this.snackBar.open($localize`Your session expired`);
              this.auth.logout();
              this.router.navigate(['/sign-in']);
            }
            return of(false);
          })
        );
      })
    );
  }

  private loadPlatformAndProjects({
    projects,
    platformId,
    currentProjectId,
  }: {
    platformId: string;
    projects: ProjectWithLimits[];
    currentProjectId: string;
  }) {
    return this.platformService.getPlatform(platformId).pipe(
      tap((platform) => {
        this.store.dispatch(
          ProjectActions.setProjects({
            projects,
            selectedIndex: projects.findIndex((p) => p.id === currentProjectId),
            platform,
          })
        );
      }),
      map(() => true)
    );
  }
}
