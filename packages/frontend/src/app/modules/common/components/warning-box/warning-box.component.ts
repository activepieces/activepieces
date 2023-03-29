import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-warning-box',
  template: `
    <div
      class="ap-rounded ap-bg-[#fff4e5] ap-py-[10px] ap-px-[15px] !ap-text-[#663c00] ap-flex ap-flex-col ap-gap-2"
    >
      <ng-content></ng-content>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WarningBoxComponent {}
