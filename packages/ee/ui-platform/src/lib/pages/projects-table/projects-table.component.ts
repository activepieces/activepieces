import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Observable, Subject, map, startWith, tap } from 'rxjs';
import { ProjectsDataSource } from './projects-table.datasource';
import { Project } from '@activepieces/shared';
import { MatDialog } from '@angular/material/dialog';
import { CreateProjectDialogComponent } from './create-project-dialog/create-project-dialog.component';
import { UpdateProjectDialogComponent } from './update-project-dialog/update-project-dialog.component';
import { Store } from '@ngrx/store';
import {
  AuthenticationService,
  CommonActions,
  PlatformProjectService,
  featureDisabledTooltip,
} from '@activepieces/ui/common';
import { ActivatedRoute } from '@angular/router';
import { PLATFORM_RESOLVER_KEY } from '../../platform.resolver';
import { Platform } from '@activepieces/ee-shared';

@Component({
  selector: 'app-projects-table',
  templateUrl: './projects-table.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectsTableComponent {
  displayedColumns = [
    'displayName',
    'created',
    'tasks',
    'users',
    'externalId',
    'action',
  ];
  refreshTable$: Subject<boolean> = new Subject();
  dataSource: ProjectsDataSource;
  loading = true;
  switchProject$: Observable<void> | undefined;
  createProject$: Observable<void> | undefined;
  updateProject$: Observable<void> | undefined;
  title = $localize`Projects`;
  featureDisabledTooltip = featureDisabledTooltip;
  platform: Platform;
  constructor(
    private projectsService: PlatformProjectService,
    private matDialog: MatDialog,
    private authenticationService: AuthenticationService,
    private store: Store,
    private route: ActivatedRoute
  ) {
    this.platform = this.route.snapshot.data[PLATFORM_RESOLVER_KEY];
    this.dataSource = new ProjectsDataSource(
      this.projectsService,
      this.refreshTable$.asObservable().pipe(startWith(true)),
      this.authenticationService.getPlatformId()!
    );
  }

  createProject() {
    this.createProject$ = this.matDialog
      .open(CreateProjectDialogComponent)
      .afterClosed()
      .pipe(
        tap((res) => {
          if (res) {
            this.refreshTable$.next(true);
            this.reinitializeProjectsInStore();
          }
        }),
        map(() => void 0)
      );
  }
  openProject(project: Project) {
    this.switchProject$ = this.projectsService.switchProject(project.id, true);
  }

  updateProject(project: Project) {
    this.updateProject$ = this.matDialog
      .open(UpdateProjectDialogComponent, {
        data: {
          project,
        },
      })
      .afterClosed()
      .pipe(
        tap((res) => {
          if (res) {
            this.refreshTable$.next(true);
            this.reinitializeProjectsInStore();
          }
        }),
        map(() => void 0)
      );
  }
  reinitializeProjectsInStore() {
    const user = this.authenticationService.currentUserSubject.value;
    const decodedToken = this.authenticationService.getDecodedToken();
    if (!decodedToken) {
      console.error('Token is invalid or not set');
      return;
    }
    if (user) {
      this.store.dispatch(
        CommonActions.loadProjects({
          user,
          currentProjectId: decodedToken['projectId'],
        })
      );
    }
  }
}
