import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ViewChild,
} from '@angular/core';
import { Observable, Subject, map, tap } from 'rxjs';
import { ProjectsDataSource } from './projects-table.datasource';
import { Project, ProjectWithLimits } from '@activepieces/shared';
import { MatDialog } from '@angular/material/dialog';
import { CreateProjectDialogComponent } from './create-project-dialog/create-project-dialog.component';
import {
  ApPaginatorComponent,
  AuthenticationService,
  DeleteEntityDialogComponent,
  DeleteEntityDialogData,
  MANAGE_PROJECTS_DISABLED_RESOLVER_KEY,
  ProjectService,
} from '@activepieces/ui/common';
import { ActivatedRoute } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { StatusCodes } from 'http-status-codes';
import { MatSidenav } from '@angular/material/sidenav';

@Component({
  selector: 'app-projects-table',
  templateUrl: './projects-table.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectsTableComponent implements AfterViewInit {
  @ViewChild(ApPaginatorComponent, { static: false })
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
  dataSource: ProjectsDataSource | undefined;
  loading = true;
  switchProject$: Observable<void> | undefined;
  createProject$: Observable<ProjectWithLimits | undefined> | undefined;
  updateProject$: Observable<ProjectWithLimits | undefined> | undefined;
  isLocked: boolean;
  deleteProject$?: Observable<void>;
  title = $localize`Projects`;

  constructor(
    private projectsService: ProjectService,
    private matDialog: MatDialog,
    private authenticationService: AuthenticationService,
    private activatedRoute: ActivatedRoute,
    private router: ActivatedRoute
  ) {
    this.isLocked = this.router.snapshot.data[
      MANAGE_PROJECTS_DISABLED_RESOLVER_KEY
    ] as boolean;
    this.dataSource = new ProjectsDataSource(
      this.projectsService,
      this.refreshTable$.asObservable(),
      this.activatedRoute.queryParams,
      this.isLocked
    );
  }
  ngAfterViewInit(): void {
    if (this.dataSource) {
      this.dataSource.paginator = this.paginator;
      this.refreshTable$.next(true);
    }
  }

  createProject() {
    this.createProject$ = this.matDialog
      .open(CreateProjectDialogComponent)
      .afterClosed()
      .pipe(
        tap((project: ProjectWithLimits | undefined) => {
          if (project) {
            this.refreshTable$.next(true);
          }
        })
      );
  }
  openProject(project: Project) {
    this.switchProject$ = this.authenticationService.switchProject({
      projectId: project.id,
      refresh: true,
      redirectHome: true,
    });
  }

  updateProject(project: ProjectWithLimits) {
    this.updateProject$ = this.authenticationService
      .switchProject({
        projectId: project.id,
        refresh: false,
        redirectHome: false,
      })
      .pipe(
        tap(() => {
          window.location.href = 'settings';
        }),
        map(() => project)
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
    return isCurrentActiveProject;
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
