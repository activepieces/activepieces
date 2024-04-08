import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UiCommonModule } from '@activepieces/ui/common';
import { RouterModule } from '@angular/router';
export type RewardItem = {
  jobName: string;
  tasksPerMonth: string;
  icon: string;
  cta: string;
  ctaEffect: () => void;
};
@Component({
  selector: 'app-rewards-item',
  standalone: true,
  imports: [CommonModule, UiCommonModule, RouterModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="ap-flex ap-items-center ap-gap-2.5">
      <svg-icon
        [src]="rewardItem.icon"
        [applyClass]="true"
        class="ap-w-[20px] ap-h-[20px] ap-fill-body"
      >
      </svg-icon>
      <div class="ap-w-[600px] ap-flex ap-flex-col ap-text-body ">
        {{ rewardItem.jobName }}
      </div>
      <div class="ap-flex-grow"></div>

      <div class="ap-text-description ap-typography-body-2 ">
        +{{ rewardItem.tasksPerMonth }} tasks / month
      </div>
      <div class="ap-w-[90px] ap-flex ap-justify-center">
        <ap-button
          btnColor="primary"
          btnStyle="basic"
          btnSize="medium"
          (buttonClicked)="rewardItem.ctaEffect()"
        >
          {{ rewardItem.cta }}
        </ap-button>
      </div>
    </div>
  `,
})
export class RewardsItemComponent {
  @Input({ required: true }) rewardItem: RewardItem;
}
