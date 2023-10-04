import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthenticationService } from '../../service/authentication.service';
import { FlagService } from '../../service/flag.service';
import { Observable } from 'rxjs';
import { ApFlagId } from '@activepieces/shared';
@Component({
  selector: 'ap-user-avatar',
  templateUrl: './user-avatar.component.html',
  styleUrls: ['./user-avatar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserAvatarComponent {
  showAvatarOuterCircle = false;
  showCommunity$: Observable<boolean>

  constructor(
    public authenticationService: AuthenticationService,
    private router: Router,
    private flagService: FlagService
  ) {
    this.showCommunity$ = this.flagService.isFlagEnabled(ApFlagId.SHOW_COMMUNITY);
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
