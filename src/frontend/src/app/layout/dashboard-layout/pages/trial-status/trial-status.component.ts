import { Component, OnInit } from '@angular/core';
import { AuthenticationService } from 'src/app/layout/common-layout/service/authentication.service';
import { TimeHelperService } from 'src/app/layout/common-layout/service/time-helper.service';

declare let Calendly: any;

@Component({
	selector: 'app-trial-status',
	templateUrl: './trial-status.component.html',
	styleUrls: ['./trial-status.component.scss'],
})
export class TrialStatusComponent implements OnInit {
	countDownText = '';
	featuresList = [
		'Low-code workflow builder',
		'In-App embedding',
		'Unlimited connectors access',
		'Deployment environments',
		'Multitenant deployment ',
		'Version control',
		'Advanced debugging',
	];
	constructor(private authenticationService: AuthenticationService, private timeHelperService: TimeHelperService) {}

	ngOnInit(): void {
		this.countDownText = this.timeHelperService.countDownTimeLeft(this.epochExpirationTime);
	}

	contactSales() {
		Calendly.initPopupWidget({
			url: 'https://calendly.com/activepieces/demo?hide_event_type_details=1&hide_gdpr_banner=1',
		});
	}

	get isTrialExpired() {
		const now = new Date().getTime() / 1000;
		return (
			this.authenticationService.currentUser.epochExpirationTime &&
			this.authenticationService.currentUser.epochExpirationTime < now
		);
	}
	get epochExpirationTime() {
		return this.authenticationService.currentUser.epochExpirationTime;
	}
}
