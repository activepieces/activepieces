import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import {
  FlowPricingPlan,
  FlowPricingSubPlan,
  freePlanPrice,
  PlanSupportType,
} from '@activepieces/ee-shared';
import { Observable, map, switchMap, tap } from 'rxjs';
import { FormControl } from '@angular/forms';
import { isNil } from '@activepieces/shared';
import { UpgradePlanConfirmationDialogComponent } from '../../upgrade-dialog-confirmation/upgrade-plan-dialog-confirmration.component';
import { formatNumberWithCommas, loadPlansObs } from '../utils';
import { MatDialog } from '@angular/material/dialog';
import { BillingService } from '../../billing.service';

type Plan = {
  formControl: FormControl<FlowPricingSubPlan>;
  selectedPrice$: Observable<string> | undefined;
  selectedTasks$: Observable<string> | undefined;
  loading: boolean;
} & FlowPricingPlan;

@Component({
  selector: 'app-automation-plan-card',
  templateUrl: './automation-plan-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AutomationPlanCardComponent {
  readonly freePlanPrice = freePlanPrice;
  readonly PlanSupportType = PlanSupportType;

  readonly extraUsersMax = 100;
  usersFormControl: FormControl<number> = new FormControl(0, {
    nonNullable: true,
  });
  extraUsersValueChanged$: Observable<number>;
  _plan!: Plan;
  openCheckout$?: Observable<void>;
  @Input({ required: true }) loadPlans$!: loadPlansObs;
  @Input({ required: true })
  set plan(value: Plan) {
    this._plan = {
      ...value,
      tasks: value.tasks.map((t) => {
        if (typeof t.amount === 'number') {
          return { ...t, amount: formatNumberWithCommas(t.amount) };
        } else {
          return { ...t };
        }
      }),
    };

    this._plan.formControl.setValue(this._plan.tasks[0]);
    this.usersFormControl.setValue(this._plan.teamMembers);
  }
  constructor(
    private matDialog: MatDialog,
    private billingService: BillingService
  ) {
    this.extraUsersValueChanged$ = this.usersFormControl.valueChanges.pipe(
      tap((val) => {
        if (val > this.extraUsersMax) {
          this.usersFormControl.setValue(this.extraUsersMax);
        } else if (val < this._plan.teamMembers) {
          this.usersFormControl.setValue(this._plan.teamMembers);
        }
      })
    );
  }
  contactUs() {
    window.open('mailto:sales@activepieces.com');
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
    if (newValue >= this._plan.teamMembers) {
      this.usersFormControl.setValue(newValue);
    }
  }
}
