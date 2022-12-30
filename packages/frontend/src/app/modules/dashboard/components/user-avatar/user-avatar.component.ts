import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthenticationService } from 'src/app/modules/common/service/authentication.service';

@Component({
	selector: 'app-user-avatar',
	templateUrl: './user-avatar.component.html',
	styleUrls: ['./user-avatar.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserAvatarComponent {
	showAvatarOuterCircle = false;

	constructor(public authenticationService: AuthenticationService, private router: Router) {}

	getDropDownLeftOffset(toggleElement: HTMLElement, dropDownElement: HTMLElement) {
		const leftOffset = toggleElement.clientWidth - dropDownElement.clientWidth - 5;
		return `${leftOffset}px`;
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
}
