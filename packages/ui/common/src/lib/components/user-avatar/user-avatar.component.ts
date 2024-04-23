import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthenticationService } from '../../service/authentication.service';
import { ApFlagId, ProjectWithLimits } from '@activepieces/shared';
import { Observable, map } from 'rxjs';
import { FlagService } from '../../service/flag.service';
import { LocalesService } from '../../service/locales.service';
import { LocalesEnum } from '@activepieces/shared';
import { localesMap } from '../../utils/locales';
import { ProjectService } from '../../service/project.service';
import { showPlatformDashboard$ } from '../../utils/consts';
@Component({
  selector: 'ap-user-avatar',
  templateUrl: './user-avatar.component.html',
  styleUrls: ['./user-avatar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserAvatarComponent implements OnInit {
  showAvatarOuterCircle = false;
  currentUserEmail = '';
  projects$: Observable<ProjectWithLimits[]>;
  selectedProject$: Observable<ProjectWithLimits | null>;
  switchProject$: Observable<void>;
  overflownProjectsNames: Record<string, string> = {};
  billingEnabled$: Observable<boolean>;
  projectEnabled$: Observable<boolean>;
  showPlatform$: Observable<boolean>;
  showCommunity$: Observable<boolean>;
  locales = localesMap;
  selectedLanguage = {
    languageName: localesMap[LocalesEnum.ENGLISH],
    locale: LocalesEnum.ENGLISH,
  };

  constructor(
    public authenticationService: AuthenticationService,
    private router: Router,
    private flagService: FlagService,
    private projectService: ProjectService,
    private localesService: LocalesService
  ) {
    this.showCommunity$ = this.flagService.isFlagEnabled(
      ApFlagId.SHOW_COMMUNITY
    );
    this.billingEnabled$ = this.flagService.isFlagEnabled(
      ApFlagId.SHOW_BILLING
    );
    this.projectEnabled$ = this.flagService.isFlagEnabled(
      ApFlagId.PROJECT_MEMBERS_ENABLED
    );
    this.projects$ = this.projectService
      .list({
        limit: 100,
        cursor: undefined,
      })
      .pipe(map((page) => page.data));
    this.selectedProject$ = this.projectService.currentProject$;
    this.selectedLanguage =
      this.localesService.getCurrentLanguageFromLocalStorageOrDefault();
    this.showPlatform$ = showPlatformDashboard$(
      this.authenticationService,
      this.flagService
    );
  }
  ngOnInit(): void {
    this.currentUserEmail = this.authenticationService.currentUser.email;
  }

  getDropDownLeftOffset(
    toggleElement: HTMLElement,
    dropDownElement: HTMLElement
  ) {
    const leftOffset =
      toggleElement.clientWidth - dropDownElement.clientWidth - 5;
    return `${leftOffset}px`;
  }

  logout() {
    this.router.navigate(['sign-in']);
    this.authenticationService.logout();
  }

  viewPlans() {
    this.router.navigate(['plans']);
  }

  switchProject(projectId: string) {
    this.switchProject$ = this.authenticationService.switchProject({
      projectId,
      refresh: true,
      redirectHome: false,
    });
  }

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
  redirectToLocale(locale: LocalesEnum) {
    this.localesService.setCurrentLocale(locale);
    this.localesService.redirectToLocale(locale);
  }
}
