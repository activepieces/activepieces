import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { Observable, map, tap } from 'rxjs';
import {
  MAXIMUM_ALLOWED_TASKS,
  ProjectBillingRespone,
  Referral,
} from '@activepieces/ee-shared';
import { ReferralService } from '../service/referral.service';
import {
  AuthenticationService,
  ProjectActions,
  ProjectSelectors,
  TelemetryService,
} from '@activepieces/ui/common';
import { ProjectWithLimits, TelemetryEventName } from '@activepieces/shared';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BillingService } from '../service/billing.service';
import { Store } from '@ngrx/store';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';

interface BillingLimits {
  tasks: FormControl<number>;
}

@Component({
  selector: 'app-plans-page',
  templateUrl: './plans-page.component.html',
  styleUrls: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlansPageComponent implements OnInit {
  options = {
    path: '/assets/lottie/gift.json',
  };
  referralUrl = 'https://cloud.activepieces.com/sign-up?referral=';
  referrals$: Observable<Referral[]> | undefined;
  upgrade$: Observable<void> | undefined;
  upgradeLoading = false;
  manageLoading = false;
  billingForm: FormGroup<BillingLimits>;
  loadInitialValue$: Observable<void> | undefined;
  project$: Observable<ProjectWithLimits> | undefined;
  billingInformation$: Observable<ProjectBillingRespone> | undefined;
  openPortal$: Observable<void> | undefined;
  disableOrEnable$: Observable<void>;
  constructor(
    private referralService: ReferralService,
    private telemetryService: TelemetryService,
    private authenticationService: AuthenticationService,
    private billingService: BillingService,
    private matSnackbar: MatSnackBar,
    private fb: FormBuilder,
    private store: Store
  ) {
    this.billingForm = this.fb.group({
      tasks: this.fb.control(15000, {
        nonNullable: true,
        validators: [
          Validators.required,
          Validators.min(1),
          Validators.pattern(/^[0-9]*$/),
          Validators.max(MAXIMUM_ALLOWED_TASKS),
        ],
      }),
    });
    this.billingInformation$ = this.billingService.getSubscription();
    this.disableOrEnable$ = this.billingInformation$.pipe(
      map((billingInformation) => {
        if (billingInformation.subscription.subscriptionStatus === 'active') {
          this.billingForm.enable();
        } else {
          this.billingForm.disable();
        }
      })
    );
    this.project$ = this.store.select(ProjectSelectors.selectCurrentProject);
    this.loadInitialValue$ = this.store
      .select(ProjectSelectors.selectCurrentProject)
      .pipe(
        tap((project) => {
          this.billingForm.patchValue({
            tasks: project.plan.tasks,
          });
        }),
        map(() => void 0)
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

  upgrade() {
    this.upgradeLoading = true;
    this.upgrade$ = this.billingService.upgrade().pipe(
      tap(({ paymentLink }) => {
        this.upgradeLoading = false;
        window.location.href = paymentLink;
      }),
      map(() => void 0)
    );
  }

  openPortal() {
    this.manageLoading = true;
    this.openPortal$ = this.billingService.portalLink().pipe(
      tap(({ portalLink }) => {
        this.manageLoading = false;
        window.location.href = portalLink;
      }),
      map(() => void 0)
    );
  }

  saveLimits() {
    if (this.billingForm.invalid) {
      return;
    }
    const limit = this.billingForm.value.tasks;
    this.store.dispatch(
      ProjectActions.updateLimits({
        limits: {
          tasks: limit!,
        },
      })
    );
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
