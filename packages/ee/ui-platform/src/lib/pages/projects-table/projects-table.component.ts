import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Observable, Subject, startWith, tap } from 'rxjs';
import { ProjectsDataSource } from './projects-table.datasource';
import { Project, ProjectWithLimits } from '@activepieces/shared';
import { MatDialog } from '@angular/material/dialog';
import { CreateProjectDialogComponent } from './create-project-dialog/create-project-dialog.component';
import {
  UpdateProjectDialogComponent,
  UpdateProjectDialogData,
} from './update-project-dialog/update-project-dialog.component';
import { Store } from '@ngrx/store';
import {
  AuthenticationService,
  PlatformProjectService,
  ProjectActions,
  featureDisabledTooltip,
} from '@activepieces/ui/common';
import { ActivatedRoute } from '@angular/router';
import { PLATFORM_DEMO_RESOLVER_KEY } from '../../is-platform-demo.resolver';

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
  upgradeNote = $localize`Create new projects and set limits on tasks and users for each project.`;
  refreshTable$: Subject<boolean> = new Subject();
  dataSource: ProjectsDataSource;
  loading = true;
  switchProject$: Observable<void> | undefined;
  createProject$: Observable<ProjectWithLimits | undefined> | undefined;
  updateProject$: Observable<ProjectWithLimits | undefined> | undefined;
  title = $localize`Projects`;
  featureDisabledTooltip = featureDisabledTooltip;
  isDemo = false;
  constructor(
    private projectsService: PlatformProjectService,
    private matDialog: MatDialog,
    private authenticationService: AuthenticationService,
    private store: Store,
    private route: ActivatedRoute
  ) {
    this.isDemo = this.route.snapshot.data[PLATFORM_DEMO_RESOLVER_KEY];
    this.dataSource = new ProjectsDataSource(
      this.projectsService,
      this.refreshTable$.asObservable().pipe(startWith(true)),
      this.authenticationService.getPlatformId()!,
      this.isDemo
    );
  }

  createProject() {
    this.createProject$ = this.matDialog
      .open(CreateProjectDialogComponent)
      .afterClosed()
      .pipe(
        tap((project: ProjectWithLimits | undefined) => {
          if (project) {
            this.refreshTable$.next(true);
            this.store.dispatch(ProjectActions.addProject({ project }));
          }
        })
      );
  }
  openProject(project: Project) {
    this.switchProject$ = this.projectsService.switchProject(project.id, true);
  }

  updateProject(project: ProjectWithLimits) {
    if (this.isDemo) {
      return;
    }
    const data: UpdateProjectDialogData = { project };
    this.updateProject$ = this.matDialog
      .open(UpdateProjectDialogComponent, {
        data,
      })
      .afterClosed()
      .pipe(
        tap((updatedProject) => {
          if (updatedProject) {
            this.refreshTable$.next(true);
            this.store.dispatch(
              ProjectActions.updateProject({ project: updatedProject })
            );
          }
        })
      );
  }
}
