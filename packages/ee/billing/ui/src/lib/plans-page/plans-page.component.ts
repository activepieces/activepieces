import { Component, OnInit } from '@angular/core';
import { Observable, map, tap } from 'rxjs';
import { Referral, pricingPlans } from '@activepieces/ee-shared';
import { ReferralService } from '../service/referral.service';
import {
  AuthenticationService,
  ProjectActions,
  TelemetryService,
} from '@activepieces/ui/common';
import { TelemetryEventName } from '@activepieces/shared';
import utc from 'dayjs/plugin/utc';
import dayjs from 'dayjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { openPortal } from './utils';
import { BillingService } from '../service/billing.service';
import { Store } from '@ngrx/store';

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

  options = {
    path: '/assets/lottie/gift.json',
  };
  referralUrl = 'https://cloud.activepieces.com/sign-up?referral=';
  referrals$: Observable<Referral[]> | undefined;
  upgrade$: Observable<void> | undefined;
  constructor(
    private referralService: ReferralService,
    private telemetryService: TelemetryService,
    private authenticationService: AuthenticationService,
    private billinigService: BillingService,
    private matSnackbar: MatSnackBar,
    private store: Store
  ) {}

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
    this.upgrade$ = this.billinigService.upgrade().pipe(
      tap(({ paymentLink }) => {
        window.open(paymentLink, '_blank');
      }),
      map(() => void 0)
    );
  }

  setTasksLimit(limit: number) {
    this.store.dispatch(
      ProjectActions.updateLimits({
        limits: {
          tasks: limit,
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
