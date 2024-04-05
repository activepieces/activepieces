import {
    ChangeDetectionStrategy,
    Component,
  } from '@angular/core';
  import { CommonModule } from '@angular/common';
  import { UiCommonModule } from '@activepieces/ui/common';
import { RouterModule } from '@angular/router';
import { RewardItem, RewardsItemComponent } from '../../rewards-item/rewards-item.component';
import { MatDialog } from '@angular/material/dialog';
  
  @Component({
    selector: 'app-rewards-dialog',
    standalone: true,
    imports: [CommonModule, UiCommonModule,RouterModule,RewardsItemComponent],
    changeDetection: ChangeDetectionStrategy.OnPush,
   templateUrl: './rewards-dialog.component.html',
  })
  export class RewardsDialogComponent {

    constructor(public matDialog: MatDialog) { }
    rewards:RewardItem[] = [
        {
            cta:'Contribute',
            ctaEffect: () => {
              window.open('https://community.activepieces.com/c/tutorials/10','_blank','noopener noreferrer')
            },
            icon:'assets/img/custom/dashboard/templates.svg',
            jobName:'Contribute a Template',
            tasksPerMonth:'400',
        },
        {
            cta:'Contribute',
            ctaEffect: () => {
              window.open('https://www.activepieces.com/docs/developers/overview#how-to-contribute','_blank','noopener noreferrer')
            },
            icon:'assets/img/custom/dashboard/pieces.svg',
            jobName:'Contribute a piece',
            tasksPerMonth:'600',
        },
        {
            cta:'Instructions',
            ctaEffect: () => {
              window.open('https://www.linkedin.com/sharing/share-offsite/?url=https://activepieces.com/','_blank','noopener noreferrer')
            },
            icon:'assets/img/custom/rewards/linkedin.svg',
            jobName:'Tell your network about your experience with us on LinkedIn',
            tasksPerMonth:'up to 2,000',
        },
        {
            cta:'Copy Link',
            ctaEffect: () => {},
            icon:'assets/img/custom/rewards/referals.svg',
            jobName:'Refer us to a friend using your referral link',
            tasksPerMonth:'500',
        },
    ]
  }
  