import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthenticationService } from '../../service/authentication.service';
import { ApFlagId } from '@activepieces/shared';
import { Observable } from 'rxjs';
import { FlagService } from '../../service/flag.service';
import { LocalesService } from '../../service/locales.service';
import { LocalesEnum } from '@activepieces/shared';
import { localesMap } from '../../utils/locales';
import { showPlatformDashboard$ } from '../../utils/consts';
import { TelemetryService } from '../../service';
@Component({
  selector: 'ap-user-avatar',
  templateUrl: './user-avatar.component.html',
  styleUrls: ['./user-avatar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserAvatarComponent implements OnInit {
  showAvatarOuterCircle = false;
  currentUserEmail = '';
  overflownProjectsNames: Record<string, string> = {};
  billingEnabled$: Observable<boolean>;
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
    private telemetryService: TelemetryService,
    private localesService: LocalesService
  ) {
    this.showCommunity$ = this.flagService.isFlagEnabled(
      ApFlagId.SHOW_COMMUNITY
    );
    this.billingEnabled$ = this.flagService.isFlagEnabled(
      ApFlagId.SHOW_BILLING
    );
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
    this.telemetryService.reset();
    this.authenticationService.logout();
  }

  viewPlans() {
    this.router.navigate(['plans']);
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
