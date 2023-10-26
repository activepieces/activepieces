import { Component, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Observable, map, shareReplay, startWith, switchMap, tap } from 'rxjs';
import {
  BillingResponse,
  FlowPricingPlan,
  FlowPricingSubPlan,
  ProjectPlan,
  ProjectUsage,
  Referral,
} from '@activepieces/ee-shared';
import { BillingService } from '../billing.service';
import { ReferralService } from '../service/referral.service';
import {
  AuthenticationService,
  TelemetryService,
} from '@activepieces/ui/common';
import { TelemetryEventName, isNil } from '@activepieces/shared';
import utc from 'dayjs/plugin/utc';
import dayjs from 'dayjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { UpgradePlanConfirmationDialogComponent } from '../upgrade-dialog-confirmation/upgrade-plan-dialog-confirmration.component';

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
  openCheckout$: Observable<void> | undefined;
  tasksStats$: Observable<{
    tasksCap: number;
    tasksExecuted: number;
    perDay: boolean;
    customerPortalUrl: string;
  }>;
  loadPlans$: Observable<{
    plans: Plan[];
    defaultPlan: { nickname: string };
    currentPlan: ProjectPlan;
    currentUsage: ProjectUsage & {
      daysLeftBeforeReset: number;
      hoursLeftBeforeReset: number;
    };
    customerPortalUrl: string;
  }>;

  options = {
    path: '/assets/lottie/gift.json',
  };
  chatbotsEnabled$: Observable<boolean>;
  constructor(
    private referralService: ReferralService,
    private telemetryService: TelemetryService,
    private billingService: BillingService,
    private authenticationService: AuthenticationService,
    private matSnackbar: MatSnackBar,
    private matDialog: MatDialog
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
                this.formatPrice(task.price)
              ),
              startWith(this.formatPrice(initialTask.price))
            ),
            selectedTasks$: formControl.valueChanges.pipe(
              map((task: { price: string; amount: number }) =>
                this.formatNumberWithCommas(task.amount)
              ),
              startWith(this.formatNumberWithCommas(initialTask.amount))
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

  openPaymentLink(plan: Plan) {
    const upgradeFromStripeWindow$ = this.billingService
      .upgrade(plan.formControl.value.pricePlanId)
      .pipe(
        tap((response: { paymentLink: string | null }) => {
          const paymentLink = response.paymentLink;
          if (!isNil(paymentLink)) {
            window.open(paymentLink, '_blank', 'noopener noreferer');
          }
          plan.loading = false;
        }),
        map(() => void 0)
      );

    this.openCheckout$ = this.loadPlans$.pipe(
      switchMap((plans) => {
        const hasPlan = !isNil(plans.currentPlan.stripeSubscriptionId);
        if (!hasPlan) {
          plan.loading = true;
          return upgradeFromStripeWindow$;
        } else {
          return this.matDialog
            .open(UpgradePlanConfirmationDialogComponent, {
              data: { planId: plan.formControl.value.pricePlanId },
            })
            .afterClosed()
            .pipe(
              tap((upgraded: boolean | undefined) => {
                if (upgraded) location.reload();
              }),
              map(() => void 0)
            );
        }
      })
    );
  }

  formatPrice(price: string): string {
    return price === 'Free' ? price : '$' + price + '/month';
  }

  openPortal(portalUrl: string) {
    window.open(portalUrl, '_blank', 'noopener noreferer');
  }

  formatNumberWithCommas(number: number): string {
    // Convert the number to a string
    const numStr = number.toString();

    // Split the string into integer and decimal parts (if any)
    const parts = numStr.split('.');

    // Format the integer part with commas
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');

    // Join the integer and decimal parts (if any)
    return parts.join('.');
  }

  url = 'https://activepieces.com';
  referrals$: Observable<Referral[]> | undefined;

  ngOnInit(): void {
    this.url = `https://cloud.activepieces.com/sign-up?referral=${this.authenticationService.currentUser.id}`;
    this.referrals$ = this.referralService
      .list({ limit: 100 })
      .pipe(map((page) => page.data));
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
    navigator.clipboard.writeText(this.url);
    this.trackClick();
    this.matSnackbar.open('Referral Url copied to your clipboard.');
  }
}
