import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-new-flow-card',
  templateUrl: './new-flow-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NewFlowCardComponent {}
