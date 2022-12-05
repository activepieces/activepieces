import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthenticationService } from 'src/app/layout/common-layout/service/authentication.service';

@Component({
	selector: 'app-user-avatar',
	templateUrl: './user-avatar.component.html',
	styleUrls: ['./user-avatar.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserAvatarComponent {
	showAvatarOuterCircle = false;

	constructor(private authenticationService: AuthenticationService, private router: Router) {}

	getDropDownLeftOffset(toggleElement: HTMLElement, dropDownElement: HTMLElement) {
		const leftOffset = toggleElement.clientWidth - dropDownElement.clientWidth - 5;
		return `${leftOffset}px`;
	}

	logout() {
		this.router.navigate(['sign-in']);
		this.authenticationService.logout();
	}

	get username() {
		return `${this.authenticationService.currentUser?.firstName} ${this.authenticationService.currentUser?.lastName}`;
	}

	get userFirstLetter() {
		if (
			this.authenticationService.currentUser == undefined ||
			this.authenticationService.currentUser.firstName == undefined
		) {
			return undefined;
		}
		return this.authenticationService.currentUser?.firstName[0];
	}

	get companyName() {
		if (
			this.authenticationService.currentUser == undefined ||
			this.authenticationService.currentUser.company == undefined
		) {
			return undefined;
		}
		return this.authenticationService.currentUser?.company;
	}

	get email() {
		if (
			this.authenticationService.currentUser == undefined ||
			this.authenticationService.currentUser.email == undefined
		) {
			return undefined;
		}
		return this.authenticationService.currentUser?.email;
	}

	get isInTrial() {
		if (
			this.authenticationService.currentUser == undefined ||
			this.authenticationService.currentUser.epochExpirationTime == undefined
		) {
			return undefined;
		}
		return this.authenticationService.currentUser?.epochExpirationTime;
	}
}
