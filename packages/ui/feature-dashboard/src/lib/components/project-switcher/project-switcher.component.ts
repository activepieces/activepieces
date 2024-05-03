import { ChangeDetectionStrategy, Component } from '@angular/core';
import { AuthenticationService, ProjectService } from '@activepieces/ui/common';
import { Observable, map } from 'rxjs';
import { ProjectWithLimits } from '@activepieces/shared';

@Component({
  selector: 'app-project-switcher',
  templateUrl: './project-switcher.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectSwitcherComponent {
  currentProject$: Observable<ProjectWithLimits>;
  areProjectsEnabled$: Observable<boolean>;
  projects$: Observable<ProjectWithLimits[]>;
  switchProject$?: Observable<void>;
  constructor(
    private projectService: ProjectService,
    private authenticationService: AuthenticationService
  ) {
    this.currentProject$ = this.projectService.currentProject$.pipe(
      map((project) => project!)
    );
    this.projects$ = this.projectService.getAll();
    this.areProjectsEnabled$ = this.projects$.pipe(
      map((projects) => {
        return projects.length > 0;
      })
    );
  }
  switchProject(projectId: string) {
    this.switchProject$ = this.authenticationService.switchProject({
      projectId,
      redirectHome: true,
      refresh: true,
    });
  }
}
