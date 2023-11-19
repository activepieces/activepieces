import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import {
  customPlanPrice,
  freePlanPrice,
  FlowPricingPlan,
  PlanName,
} from '@activepieces/ee-shared';
import {
  BehaviorSubject,
  Observable,
  combineLatest,
  map,
  shareReplay,
  startWith,
  switchMap,
  tap,
} from 'rxjs';
import { FormControl } from '@angular/forms';
import { isNil } from '@activepieces/shared';
import { UpgradePlanConfirmationDialogComponent } from '../../upgrade-dialog-confirmation/upgrade-plan-dialog-confirmration.component';
import { formatNumberWithCommas, loadPlansObs } from '../utils';
import { MatDialog } from '@angular/material/dialog';
import { BillingService } from '../../service/billing.service';

@Component({
  selector: 'app-automation-plan-card',
  templateUrl: './automation-plan-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AutomationPlanCardComponent {
  readonly freePlanPrice = freePlanPrice;
  readonly customPlanPrice = customPlanPrice;
  readonly extraUsersMax = 100;
  loading$: BehaviorSubject<boolean> = new BehaviorSubject(false);
  price$?: Observable<number>;
  tasksSliderControl: FormControl<number> = new FormControl(0, {
    nonNullable: true,
  });
  usersFormControl: FormControl<number> = new FormControl(0, {
    nonNullable: true,
  });
  extraUsersValueChanged$: Observable<number>;
  _plan!: FlowPricingPlan;
  planId$: Observable<string> | undefined;
  tasks$!: Observable<string>;
  openCheckout$?: Observable<void>;
  disableChangeButton$!: Observable<boolean>;
  @Input({ required: true }) loadPlans$!: loadPlansObs;
  @Input({ required: true })
  set plan(value: FlowPricingPlan) {
    this._plan = value;
    this.usersFormControl.setValue(this._plan.includedUsers);
    this.price$ = this.getPrice$();
    this.planId$ = this.getPlanId$();
    this.tasks$ = this.getTasks$();
    this.disableChangeButton$ = combineLatest({
      users: this.usersFormControl.valueChanges,
      tasksSlider: this.tasksSliderControl.valueChanges,
    }).pipe(
      map(({ users, tasksSlider }) => {
        return users === this._plan.includedUsers && tasksSlider > 0;
      })
    );
    this.tasksSliderControl.setValue(0);
  }
  constructor(
    private matDialog: MatDialog,
    private billingService: BillingService
  ) {
    this.extraUsersValueChanged$ = this.usersFormControl.valueChanges.pipe(
      tap((val) => {
        if (val > this.extraUsersMax) {
          this.usersFormControl.setValue(this.extraUsersMax);
        } else if (val < this._plan.includedUsers) {
          this.usersFormControl.setValue(this._plan.includedUsers);
        }
      })
    );
  }

  openPaymentLink() {
    if (!this.planId$) {
      return;
    }
    const upgradeFromStripeWindow$ = this.planId$.pipe(
      switchMap((planId) => {
        return this.billingService
          .upgrade({
            plan: PlanName.PRO,
            priceId: planId,
            extraUsers: this.usersFormControl.value - this._plan.includedUsers,
          })
          .pipe(
            tap((response: { paymentLink: string | null }) => {
              const paymentLink = response.paymentLink;
              if (!isNil(paymentLink)) {
                window.open(paymentLink, '_blank', 'noopener noreferer');
              }
              this.loading$.next(false);
            }),
            map(() => void 0)
          );
      })
    );

    this.openCheckout$ = this.planId$.pipe(
      switchMap((planId) => {
        return this.loadPlans$.pipe(
          switchMap((plans) => {
            const hasPlan = !isNil(plans.currentPlan.stripeSubscriptionId);
            if (!hasPlan) {
              this.loading$.next(true);
              return upgradeFromStripeWindow$;
            } else {
              return this.matDialog
                .open(UpgradePlanConfirmationDialogComponent, {
                  data: { planId: planId },
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
      })
    );
  }

  incrementExtraUsers() {
    if (this.usersFormControl) {
      const newValue = this.usersFormControl.value + 1;
      if (newValue <= this.extraUsersMax) {
        this.usersFormControl.setValue(newValue);
      }
    }
  }
  decrementExtraUsers() {
    const newValue = this.usersFormControl.value - 1;
    if (newValue >= this._plan.includedUsers) {
      this.usersFormControl.setValue(newValue);
    }
  }
  getPrice$(): Observable<number> {
    return this.tasksSliderControl.valueChanges.pipe(
      startWith(0),
      map((val) => {
        if (this._plan.tasks.length === 0) {
          return -1;
        }
        return this._plan.tasks[val].unitPrice * this._plan.tasks[val].quantity;
      }),
      shareReplay(1)
    );
  }
  getPlanId$() {
    return this.tasksSliderControl.valueChanges.pipe(
      startWith(0),
      map((sliderValue) => {
        if (this._plan.tasks.length === 0) {
          return '';
        }
        const newPlanId =
          sliderValue >= this._plan.tasks.length
            ? this._plan.tasks.at(-1)?.pricePlanId
            : this._plan.tasks[sliderValue].pricePlanId;
        if (newPlanId === undefined) {
          throw Error('new plan Id is undefined');
        }
        return newPlanId;
      }),
      shareReplay(1)
    );
  }

  getTasks$() {
    return this.tasksSliderControl.valueChanges.pipe(
      startWith(0),
      map((sliderValue) => {
        if (this._plan.tasks.length === 0) {
          return '0';
        }
        if (sliderValue < this._plan.tasks.length) {
          return `${formatNumberWithCommas(
            this._plan.tasks[sliderValue].unitAmount
          )} tasks / month`;
        }
        const lastSubPlan = this._plan.tasks.at(-1);
        if (!lastSubPlan) {
          throw Error('last plan is undefined');
        }
        const extraTasks = (sliderValue - this._plan.tasks.length + 1) * 1000;

        return `${formatNumberWithCommas(
          lastSubPlan.unitAmount + extraTasks
        )} tasks / month`;
      }),
      shareReplay(1)
    );
  }
}
