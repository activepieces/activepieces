import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { UiCommonModule } from '@activepieces/ui/common';

@Component({
  selector: 'app-dynamic-input-toggle-control',
  standalone: true,
  imports: [CommonModule, UiCommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <svg-icon
      [svgStyle]="{ width: '20px', height: '20px' }"
      class="ap-mb-[3px] ap-cursor-pointer"
      apTrackHover
      [class.!ap-opacity-100]="hoverTracker.isHovered"
      #hoverTracker="hoverTrackerDirective"
      [class.ap-opacity-40]="!selected"
      src="assets/img/custom/variable.svg"
      matTooltip="Dynamic Value"
      (click)="toggle()"
    >
    </svg-icon>
  `,
})
export class DynamicInputToggleComponent {
  @Input({ required: true }) selected = false;
  @Output() valueChanged = new EventEmitter<boolean>();
  toggle() {
    this.selected = !this.selected;
    this.valueChanged.emit(this.selected);
  }
}
