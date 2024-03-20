import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UiCommonModule } from '@activepieces/ui/common';
import { FormControl } from '@angular/forms';
import { CheckboxProperty } from '@activepieces/pieces-framework';

@Component({
  selector: 'app-checkbox-control',
  standalone: true,
  imports: [CommonModule, UiCommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="ap-flex ap-items-center ap-gap-2 ">
      <div
        apTrackHover
        #slider="hoverTrackerDirective"
        class="ap-flex ap-items-center ap-gap-2 ap-align-center"
      >
        <mat-slide-toggle
          [formControl]="passedFormControl"
          color="primary"
          class="ap-flex-grow-1"
          >{{ property.displayName }}</mat-slide-toggle
        >
      </div>
      <div class="ap-flex-grow"></div>
      <div>
        <ng-content></ng-content>
      </div>
    </div>
  `,
})
export class CheckboxControlComponent {
  @Input({ required: true }) passedFormControl: FormControl;
  @Input({ required: true }) property: CheckboxProperty<boolean>;
}
