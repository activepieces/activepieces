import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'ap-warning-box',
  template: `
    <div
      class="ap-rounded ap-bg-[#fff4e5] ap-py-[10px] ap-px-[15px] ap-items-center !ap-text-[#663c00] ap-flex ap-gap-2"
    >
      <svg-icon
        [svgStyle]="{ width: '20px', height: '20px' }"
        src="assets/img/custom/warn.svg"
      >
      </svg-icon>
      <div>
        <ng-content></ng-content>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WarningBoxComponent {}
