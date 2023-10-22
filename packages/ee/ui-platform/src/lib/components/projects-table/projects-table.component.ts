import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Observable, Subject, map, startWith, tap } from 'rxjs';
import { ProjectsDataSource } from './projects-table.datasource';
import { ProjectService } from '@activepieces/ui/common';
import { Project } from '@activepieces/shared';
import { MatDialog } from '@angular/material/dialog';
import { CreateProjectDialogComponent } from './create-project-dialog/create-project-dialog.component';
import { UpdateProjectDialogComponent } from './update-project-dialog/update-project-dialog.component';

@Component({
  selector: 'app-projects-table',
  templateUrl: './projects-table.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectsTableComponent {
  displayedColumns = ['displayName', 'created', 'action'];
  refreshTable$: Subject<boolean> = new Subject();
  dataSource!: ProjectsDataSource;
  loading = true;
  switchProject$: Observable<void> | undefined;
  createProject$: Observable<void> | undefined;
  updateProject$: Observable<void> | undefined;
  constructor(
    private projectsService: ProjectService,
    private matDialog: MatDialog
  ) {
    this.dataSource = new ProjectsDataSource(
      this.projectsService,
      this.refreshTable$.asObservable().pipe(startWith(true))
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
          }
        }),
        map(() => void 0)
      );
  }
  openProject(project: Project) {
    this.switchProject$ = this.projectsService.switchProject(project.id);
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
          }
        }),
        map(() => void 0)
      );
  }
}
