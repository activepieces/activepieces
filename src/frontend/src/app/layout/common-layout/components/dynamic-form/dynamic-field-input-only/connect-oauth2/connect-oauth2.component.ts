import { Component, Input } from '@angular/core';
import { Oauth2Service } from '../../../../service/oauth2.service';
import { Oauth2LoginFormControl } from '../../../../model/dynamic-controls/oauth2-login-form-control';
import { fadeInUp400ms } from 'src/app/layout/common-layout/animation/fade-in-up.animation';

@Component({
	selector: 'app-connect-oauth2',
	templateUrl: './connect-oauth2.component.html',
	styleUrls: ['./connect-oauth2.component.css'],
	animations: [fadeInUp400ms],
})
export class ConnectOauth2Component {
	@Input() dynamicControl: Oauth2LoginFormControl;

	constructor(private oauth2Service: Oauth2Service) {}
	popUpError = false;

	openPopup(): void {
		this.oauth2Service.openPopup(this.dynamicControl.getSettings()).subscribe({
			next: value => {
				if (value) this.dynamicControl.formControl().setValue(value);
			},
			error: error => {
				this.popUpError = true;
			},
		});
	}

	isDisabled() {
		const settings = this.dynamicControl.getSettings();
		// console.log(settings);
		return !(settings.clientSecret && settings.clientId && settings.authUrl && settings.responseType && settings.scope);
	}
}
