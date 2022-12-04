import { Component, OnInit } from '@angular/core';
import { AuthenticationService } from 'src/app/layout/common-layout/service/authentication.service';
import { TimeHelperService } from 'src/app/layout/common-layout/service/time-helper.service';

@Component({
	selector: 'app-trial-countdown',
	templateUrl: './trial-countdown.component.html',
	styleUrls: ['./trial-countdown.component.css'],
})
export class TrialCountdownComponent implements OnInit {
	constructor(private authenticationService: AuthenticationService, private timeHelperService: TimeHelperService) {}
	_expirationValue: number;
	countDownText: string | undefined = '0 Day';
	ngOnInit(): void {
		this._expirationValue = this.progressValue();
		this.countDownText = this.timeHelperService.countDownTimeDaysOnly(this.epochExpirationTime);
	}
	progressValue(): number {
		const now = new Date();
		const utcSecondsSinceEpoch = now.getTime() / 1000;
		const timeLeftToExpiry = this.epochExpirationTime - utcSecondsSinceEpoch;
		const totalTrialPeriod = this.epochExpirationTime - this.epochCreationTime;
		if (totalTrialPeriod < 0) {
			return 0;
		}
		const progressPrecentage = Math.floor((timeLeftToExpiry / totalTrialPeriod) * 100);
		return progressPrecentage > 97 ? 96 : progressPrecentage;
	}
	get epochCreationTime() {
		return this.authenticationService.currentUser.epochCreationTime;
	}

	get epochExpirationTime() {
		return this.authenticationService.currentUser.epochExpirationTime;
	}
}
