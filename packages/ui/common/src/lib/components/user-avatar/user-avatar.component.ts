import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthenticationService } from '../../service/authentication.service';
import { environment } from '../../environments/environment';
import { ProjectService } from '../../service/project.service';
import { ApFlagId, Project } from '@activepieces/shared';
import { Observable, map, tap } from 'rxjs';
import { JwtHelperService } from '@auth0/angular-jwt';
import { HttpClient } from '@angular/common/http';
import { FlagService } from '../../service/flag.service';
@Component({
  selector: 'ap-user-avatar',
  templateUrl: './user-avatar.component.html',
  styleUrls: ['./user-avatar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserAvatarComponent {
  showAvatarOuterCircle = false;

  // BEGIN EE
  private jwtHelper = new JwtHelperService();
  projects$: Observable<Project[]>;
  selectedProject$: Observable<Project | undefined>;
  switchProject$: Observable<void>;
  billingEnabled$: Observable<boolean>;
  projectEnabled$: Observable<boolean>;
  overflownProjectsNames: Record<string, string> = {};
  // END EE

  showCommunity$: Observable<boolean>;

  constructor(
    public authenticationService: AuthenticationService,
    private router: Router,
    private flagService: FlagService,
    // BEGIN EE
    private projectService: ProjectService,
    private http: HttpClient // END EE
  ) {
    this.showCommunity$ = this.flagService.isFlagEnabled(
      ApFlagId.SHOW_COMMUNITY
    );
    // BEGIN EE
    this.billingEnabled$ = this.flagService.isFlagEnabled(
      ApFlagId.BILLING_ENABLED
    );
    this.projectEnabled$ = this.flagService.isFlagEnabled(
      ApFlagId.PROJECT_MEMBERS_ENABLED
    );
    this.projects$ = this.projectService.list();
    const currentProjectId = this.jwtHelper.decodeToken(
      localStorage.getItem(environment.jwtTokenName) || ''
    )?.projectId;
    this.selectedProject$ = this.projects$.pipe(
      map((projects) => {
        return projects.find((f) => {
          return f.id === currentProjectId;
        });
      })
    );
    // END EE
  }

  getDropDownLeftOffset(
    toggleElement: HTMLElement,
    dropDownElement: HTMLElement
  ) {
    const leftOffset =
      toggleElement.clientWidth - dropDownElement.clientWidth - 5;
    return `${leftOffset}px`;
  }

  goToDeveloperPage() {
    this.router.navigate(['settings/my-pieces']);
  }

  logout() {
    this.router.navigate(['sign-in']);
    this.authenticationService.logout();
  }

  // BEGIN EE
  viewPlans() {
    this.router.navigate(['plans']);
  }
  switchProject(projectId: string) {
    this.switchProject$ = this.http
      .post<{
        token: string;
      }>(`${environment.apiUrl}/projects/${projectId}/token`, {
        projectId,
      })
      .pipe(
        tap(({ token }) => {
          localStorage.setItem(environment.jwtTokenName, token);
          window.location.reload();
        }),
        map(() => void 0)
      );
  }
  // END EE

  get userFirstLetter() {
    if (
      this.authenticationService.currentUser == undefined ||
      this.authenticationService.currentUser.firstName == undefined
    ) {
      return '';
    }
    return this.authenticationService.currentUser.firstName[0];
  }
  goToCommunity() {
    window.open('https://community.activepieces.com/', '_blank', 'noopener');
  }

  showWhatIsNew() {
    window.open(
      'https://community.activepieces.com/c/announcements',
      '_blank',
      'noopener'
    );
  }
}
