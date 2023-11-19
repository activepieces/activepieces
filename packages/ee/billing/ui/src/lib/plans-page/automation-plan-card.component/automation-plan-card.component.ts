import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import {
  customPlanPrice,
  freePlanPrice,
  FlowPricingPlan,
} from '@activepieces/ee-shared';
import {
  BehaviorSubject,
  Observable,
  map,
  shareReplay,
  startWith,
  switchMap,
  tap,
} from 'rxjs';
import { FormControl } from '@angular/forms';
import { isNil } from '@activepieces/shared';
import { UpgradePlanConfirmationDialogComponent } from '../../upgrade-dialog-confirmation/upgrade-plan-dialog-confirmration.component';
import { formatNumberWithCommas, formatPrice, loadPlansObs } from '../utils';
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
  formattedPrice$?: Observable<string>;
  tasksSliderControl: FormControl<number> = new FormControl(0, {
    nonNullable: true,
  });
  usersFormControl: FormControl<number> = new FormControl(0, {
    nonNullable: true,
  });
  extraUsersValueChanged$: Observable<number>;
  _plan!: FlowPricingPlan;
  planId$!: Observable<string>;
  tasks$!: Observable<string>;
  openCheckout$?: Observable<void>;
  @Input({ required: true }) loadPlans$!: loadPlansObs;
  @Input({ required: true })
  set plan(value: FlowPricingPlan) {
    this._plan = value;
    this.usersFormControl.setValue(this._plan.includedUsers);
    this.price$ = this.getPrice$();
    this.formattedPrice$ = this.price$.pipe(map((res) => formatPrice(res)));
    this.planId$ = this.getPlanId$();
    this.tasks$ = this.getTasks$();
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

  openPaymentLink(newPlanId: string) {
    const upgradeFromStripeWindow$ = this.billingService
      .upgrade(newPlanId)
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
    this.openCheckout$ = this.loadPlans$.pipe(
      switchMap((plans) => {
        const hasPlan = !isNil(plans.currentPlan.stripeSubscriptionId);
        if (!hasPlan) {
          this.loading$.next(true);
          return upgradeFromStripeWindow$;
        } else {
          return this.matDialog
            .open(UpgradePlanConfirmationDialogComponent, {
              data: { planId: newPlanId },
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
        // TODO FIX
        return this._plan.tasks[0].unitPrice;
      }),
      shareReplay(1)
    );
  }
  getPlanId$() {
    return this.tasksSliderControl.valueChanges.pipe(
      startWith(0),
      map((sliderValue) => {
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
