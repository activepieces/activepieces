import { Component, OnInit } from '@angular/core';
import { Observable, map, shareReplay } from 'rxjs';
import {
  BillingResponse,
  Referral,
  pricingPlans,
} from '@activepieces/shared';
import { BillingService } from '../service/billing.service';
import { ReferralService } from '../service/referral.service';
import {
  AuthenticationService,
  TelemetryService,
} from '@activepieces/ui/common';
import { TelemetryEventName } from '@activepieces/shared';
import utc from 'dayjs/plugin/utc';
import dayjs from 'dayjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { loadPlansObs, openPortal } from './utils';

dayjs.extend(utc);

@Component({
  selector: 'app-plans-page',
  templateUrl: './plans-page.component.html',
  styleUrls: [],
})
export class PlansPageComponent implements OnInit {
  readonly freePlanPrice = 0;
  readonly openPortal = openPortal;
  readonly pricingPlans = pricingPlans;
  tasksStats$: Observable<{
    tasksCap: number;
    tasksExecuted: number;
    perDay: boolean;
    customerPortalUrl: string;
  }>;
  loadPlans$: loadPlansObs;
  options = {
    path: '/assets/lottie/gift.json',
  };
  referralUrl = 'https://cloud.activepieces.com/sign-up?referral=';
  referrals$: Observable<Referral[]> | undefined;
  constructor(
    private referralService: ReferralService,
    private telemetryService: TelemetryService,
    private billingService: BillingService,
    private authenticationService: AuthenticationService,
    private matSnackbar: MatSnackBar
  ) {
    this.loadPlans$ = this.billingService.getUsage().pipe(
      map((response: BillingResponse) => {
        const nextResetDatetime = response.plan.tasksPerDay
          ? dayjs().utc().endOf('day')
          : dayjs(response.usage.nextResetDatetime);

        const daysLeftBeforeReset = Math.floor(
          nextResetDatetime.diff(dayjs(), 'day', false)
        );
        const hoursLeftBeforeReset = Math.floor(
          nextResetDatetime.diff(dayjs(), 'hour', true)
        );
        return {
          defaultPlan: response.defaultPlan,
          currentPlan: response.plan,
          currentUsage: {
            ...response.usage,
            daysLeftBeforeReset: daysLeftBeforeReset,
            hoursLeftBeforeReset: hoursLeftBeforeReset,
          },
          customerPortalUrl: response.customerPortalUrl,
        };
      }),
      shareReplay(1)
    );
    this.tasksStats$ = this.loadPlans$.pipe(
      map((res) => {
        const perDay = !!res.currentPlan.tasksPerDay;
        return {
          tasksCap: res.currentPlan.tasksPerDay
            ? res.currentPlan.tasksPerDay
            : res.currentPlan.tasks,
          tasksExecuted: res.currentPlan.tasksPerDay
            ? res.currentUsage.consumedTasksToday
            : res.currentUsage.consumedTasks,
          customerPortalUrl: res.customerPortalUrl,
          perDay,
        };
      })
    );
  }

  ngOnInit(): void {
    this.referralUrl = `https://cloud.activepieces.com/sign-up?referral=${this.authenticationService.currentUser.id}`;
    this.referrals$ = this.referralService
      .list({ limit: 100 })
      .pipe(map((page) => page.data));
    this.addTallyScript();
  }

  private addTallyScript() {
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = 'https://tally.so/widgets/embed.js';
    document.head.appendChild(script);
  }

  trackClick() {
    this.telemetryService.capture({
      name: TelemetryEventName.REFERRAL_LINK_COPIED,
      payload: {
        userId: this.authenticationService.currentUser.id,
      },
    });
  }
  copyUrl() {
    navigator.clipboard.writeText(this.referralUrl);
    this.trackClick();
    this.matSnackbar.open('Referral URL copied to your clipboard.');
  }
}
