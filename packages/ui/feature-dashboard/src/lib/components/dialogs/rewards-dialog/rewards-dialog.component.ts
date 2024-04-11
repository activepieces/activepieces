import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  AuthenticationService,
  FlagService,
  TelemetryService,
  UiCommonModule,
} from '@activepieces/ui/common';
import { RouterModule } from '@angular/router';
import {
  RewardItem,
  RewardsItemComponent,
} from '../../rewards-item/rewards-item.component';
import { MatDialog } from '@angular/material/dialog';
import { ApEdition, TelemetryEventName } from '@activepieces/shared';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Observable, map, tap } from 'rxjs';

@Component({
  selector: 'app-rewards-dialog',
  standalone: true,
  imports: [CommonModule, UiCommonModule, RouterModule, RewardsItemComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './rewards-dialog.component.html',
})
export class RewardsDialogComponent {
  referalItemClicked$: Observable<void>;
  constructor(
    public matDialog: MatDialog,
    private telemetryService: TelemetryService,
    private authenticationService: AuthenticationService,
    private matSnackbar: MatSnackBar,
    private flagService: FlagService
  ) {}
  rewards: RewardItem[] = [
    {
      cta: 'Contribute',
      ctaEffect: () => {
        window.open(
          'https://community.activepieces.com/t/templates-rewards/3782',
          '_blank',
          'noopener noreferrer'
        );
        this.trackRewardsItems(
          TelemetryEventName.TEMPLATE_REWARD_INSTRUCTIONS_CLICKED
        );
      },
      icon: 'assets/img/custom/dashboard/templates.svg',
      jobName: 'Contribute a Template',
      tasksPerMonth: '400',
    },
    {
      cta: 'Contribute',
      ctaEffect: () => {
        window.open(
          'https://www.activepieces.com/docs/developers/building-pieces/start-building',
          '_blank',
          'noopener noreferrer'
        );
        this.trackRewardsItems(
          TelemetryEventName.PIECE_REWARD_INSTRUCTIONS_CLICKED
        );
      },
      icon: 'assets/img/custom/dashboard/pieces.svg',
      jobName: 'Contribute a piece',
      tasksPerMonth: '1,400',
    },
    {
      cta: 'Instructions',
      ctaEffect: () => {
        window.open(
          'https://www.activepieces.com/blog/linkedin-sharing-reward',
          '_blank',
          'noopener noreferrer'
        );
        this.trackRewardsItems(TelemetryEventName.LINKED_IN_REWARD_CLICKED);
      },
      icon: 'assets/img/custom/rewards/linkedin.svg',
      jobName: 'Tell your network about your experience with us on LinkedIn',
      tasksPerMonth: 'up to 3,000',
    },
    {
      cta: 'Copy Link',
      ctaEffect: () => {
        this.referalItemClicked();
      },
      icon: 'assets/img/custom/rewards/referals.svg',
      jobName:
        'Refer us to 5 friends using your referral link (reward per referal)',
      tasksPerMonth: '500',
    },
  ];

  referalTracking() {
    this.telemetryService.capture({
      name: TelemetryEventName.REFERRAL_LINK_COPIED,
      payload: {
        userId: this.authenticationService.currentUser.id,
      },
    });
  }
  trackRewardsItems(
    eventName:
      | TelemetryEventName.PIECE_REWARD_INSTRUCTIONS_CLICKED
      | TelemetryEventName.TEMPLATE_REWARD_INSTRUCTIONS_CLICKED
      | TelemetryEventName.LINKED_IN_REWARD_CLICKED
  ) {
    this.telemetryService.capture({
      name: eventName,
      payload: {
        userId: this.authenticationService.currentUser.id,
        email: this.authenticationService.currentUser.email,
      },
    });
  }
  copyUrl() {
    const url = `https://cloud.activepieces.com/sign-up?referral=${this.authenticationService.currentUser.id}`;
    navigator.clipboard.writeText(url);
    this.matSnackbar.open('Referral URL copied to your clipboard.');
  }

  referalItemClicked() {
    this.referalItemClicked$ = this.flagService.getEdition().pipe(
      tap((ed) => {
        if (ed === ApEdition.COMMUNITY) {
          window.open(
            'https://cloud.activepieces.com/sign-up',
            '_blank',
            'noopener noreferrer'
          );
        } else if (ed === ApEdition.CLOUD) {
          this.copyUrl();
          this.referalTracking();
        }
      }),
      map(() => void 0)
    );
  }
}
