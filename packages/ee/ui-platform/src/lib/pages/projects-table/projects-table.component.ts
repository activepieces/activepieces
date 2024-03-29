import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  ViewChild,
} from '@angular/core';
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
  ApPaginatorComponent,
  AuthenticationService,
  DeleteEntityDialogComponent,
  DeleteEntityDialogData,
  PlatformProjectService,
  ProjectActions,
  featureDisabledTooltip,
} from '@activepieces/ui/common';
import { ActivatedRoute } from '@angular/router';
import { PLATFORM_DEMO_RESOLVER_KEY } from '../../is-platform-demo.resolver';
import { HttpErrorResponse } from '@angular/common/http';
import { StatusCodes } from 'http-status-codes';
import { MatSidenav } from '@angular/material/sidenav';

@Component({
  selector: 'app-projects-table',
  templateUrl: './projects-table.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectsTableComponent implements OnInit {
  @ViewChild(ApPaginatorComponent, { static: true })
  paginator!: ApPaginatorComponent;

  @ViewChild('sidenav') sidenav!: MatSidenav;

  displayedColumns = [
    'displayName',
    'created',
    'tasks',
    'users',
    'externalId',
    'action',
  ];
  upgradeNoteTitle = $localize`Unlock Projects`;
  upgradeNote = $localize`Orchestrate your automation teams across projects with their own flows, connections and usage quotas`;
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
    private activatedRoute: ActivatedRoute,
    private store: Store,
    private route: ActivatedRoute
  ) {
    this.isDemo = this.route.snapshot.data[PLATFORM_DEMO_RESOLVER_KEY];
    this.dataSource = new ProjectsDataSource(
      this.projectsService,
      this.refreshTable$.asObservable().pipe(startWith(true)),
      this.paginator,
      this.activatedRoute.queryParams,
      this.isDemo
    );
  }
  ngOnInit(): void {
    this.dataSource = new ProjectsDataSource(
      this.projectsService,
      this.refreshTable$.asObservable().pipe(startWith(true)),
      this.paginator,
      this.activatedRoute.queryParams,
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

  deleteProject(event: Event, project: Project) {
    event.stopPropagation();

    const deleteProject$ = this.projectsService.delete(project.id).pipe(
      tap(() => {
        this.refreshTable$.next(true);
      })
    );

    const dialogData: DeleteEntityDialogData = {
      deleteEntity$: deleteProject$,
      entityName: `project (${project.displayName})`,
      note: $localize`Are you sure you want to <b> delete project (${project.displayName}) </b>?`,
      errorMessageBuilder: this.errorHandler(project),
    };

    this.deleteProject$ = this.matDialog
      .open(DeleteEntityDialogComponent, {
        data: dialogData,
      })
      .afterClosed();
  }

  // TODO this should be removed as the token should be decoupled from the project.
  disableDeleteProject(projectId: string) {
    const isCurrentActiveProject =
      projectId === this.authenticationService.getProjectId();
    return isCurrentActiveProject || this.isDemo;
  }

  private errorHandler(
    project: Project
  ): (error: unknown) => string | undefined {
    return (error) => {
      if (this.isValidationError(error)) {
        switch (error.error?.params?.message) {
          case 'PROJECT_HAS_ENABLED_FLOWS':
            return `<b>project (${project.displayName})</b> has enabled flows. Please disable them first.`;
          case 'ACTIVE_PROJECT':
            return `<b>project (${project.displayName})</b> is active. Please switch to another project first.`;
        }
      }

      return undefined;
    };
  }

  private isValidationError(error: unknown): error is HttpErrorResponse {
    return (
      error instanceof HttpErrorResponse &&
      error.status === StatusCodes.CONFLICT &&
      error.error?.code === 'VALIDATION'
    );
  }

  toggleSidenav() {
    this.sidenav.toggle();
  }
}
