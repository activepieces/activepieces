import { Component, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Observable, map, shareReplay, startWith } from 'rxjs';
import {
  BillingResponse,
  FlowPricingPlan,
  FlowPricingSubPlan,
  Referral,
  freePlanPrice,
} from '@activepieces/ee-shared';
import { BillingService } from '../billing.service';
import { ReferralService } from '../service/referral.service';
import {
  AuthenticationService,
  TelemetryService,
} from '@activepieces/ui/common';
import { TelemetryEventName } from '@activepieces/shared';
import utc from 'dayjs/plugin/utc';
import dayjs from 'dayjs';
import { MatSnackBar } from '@angular/material/snack-bar';

import {
  formatNumberWithCommas,
  formatPrice,
  loadPlansObs,
  openPortal,
} from './utils';

dayjs.extend(utc);

type Plan = {
  formControl: FormControl<FlowPricingSubPlan>;
  selectedPrice$: Observable<string> | undefined;
  selectedTasks$: Observable<string> | undefined;
  loading: boolean;
} & FlowPricingPlan;

@Component({
  selector: 'app-plans-page',
  templateUrl: './plans-page.component.html',
  styleUrls: [],
})
export class PlansPageComponent implements OnInit {
  readonly freePlanPrice = freePlanPrice;
  readonly openPortal = openPortal;
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
  chatbotsEnabled$: Observable<boolean>;
  constructor(
    private referralService: ReferralService,
    private telemetryService: TelemetryService,
    private billingService: BillingService,
    private authenticationService: AuthenticationService,
    private matSnackbar: MatSnackBar
  ) {
    this.chatbotsEnabled$ = this.telemetryService.isFeatureEnabled('chatbots');
    this.loadPlans$ = this.billingService.getUsage().pipe(
      map((response: BillingResponse) => {
        const newPlans: Plan[] = [];
        response.plans.forEach((plan) => {
          const formControl = new FormControl();
          const initialTask = plan.tasks[0];
          newPlans.push({
            loading: false,
            ...plan,
            formControl,
            selectedPrice$: formControl.valueChanges.pipe(
              map((task: { price: string; amount: number }) =>
                formatPrice(task.price)
              ),
              startWith(formatPrice(initialTask.price))
            ),
            selectedTasks$: formControl.valueChanges.pipe(
              map((task: { price: string; amount: number }) =>
                formatNumberWithCommas(task.amount)
              ),
              startWith(
                typeof initialTask.amount === 'string'
                  ? initialTask.amount
                  : formatNumberWithCommas(initialTask.amount)
              )
            ),
          });
          formControl.setValue(plan.tasks[0]);
        });
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
          plans: newPlans,
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
