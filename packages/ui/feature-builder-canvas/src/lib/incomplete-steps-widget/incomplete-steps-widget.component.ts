import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-incomplete-steps-widget',
  templateUrl: './incomplete-steps-widget.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IncompleteStepsWidgetComponent {}
