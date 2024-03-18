import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Observable, Subject, catchError, startWith, tap } from 'rxjs';
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
  DeleteEntityDialogComponent,
  DeleteEntityDialogData,
  GenericSnackbarTemplateComponent,
  PlatformProjectService,
  ProjectActions,
  featureDisabledTooltip,
} from '@activepieces/ui/common';
import { ActivatedRoute } from '@angular/router';
import { PLATFORM_DEMO_RESOLVER_KEY } from '../../is-platform-demo.resolver';
import { MatSnackBar } from '@angular/material/snack-bar';
import { StatusCodes } from 'http-status-codes';

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
  deleteProject$?: Observable<void>;
  title = $localize`Projects`;
  featureDisabledTooltip = featureDisabledTooltip;
  isDemo = false;

  constructor(
    private projectsService: PlatformProjectService,
    private matDialog: MatDialog,
    private authenticationService: AuthenticationService,
    private store: Store,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar
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

  deleteProject(project: Project) {
    const deleteProject$ = this.projectsService.delete(project.id).pipe(
      tap(() => {
        this.refreshTable$.next(true);
        this.snackBar.openFromComponent(GenericSnackbarTemplateComponent, {
          data: `<b>${project.displayName}</b> ${$localize`deleted`} `,
        });
      }),
      catchError((e) => {
        if (
          e.status === StatusCodes.CONFLICT &&
          e.error?.type === 'VALIDATION' &&
          e.error?.message === 'project has enabled flows'
        ) {
          this.snackBar.openFromComponent(GenericSnackbarTemplateComponent, {
            data: $localize`<b>${project.displayName}</b> has enabled flows. Please disable them first.`,
          });
        }

        throw e;
      })
    );

    const dialogData: DeleteEntityDialogData = {
      deleteEntity$: deleteProject$,
      entityName: `project (${project.displayName})`,
      note: $localize`Are you sure you want to <b> delete project (${project.displayName}) </b>?`,
    };

    this.deleteProject$ = this.matDialog
      .open(DeleteEntityDialogComponent, {
        data: dialogData,
      })
      .afterClosed();
  }

  disableDeleteProject() {
    return this.isDemo || this.dataSource.data.length < 2;
  }
}
