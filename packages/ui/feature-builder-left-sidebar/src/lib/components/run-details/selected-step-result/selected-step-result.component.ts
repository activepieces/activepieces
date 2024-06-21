import { Component, Input } from '@angular/core';
import { StepOutput, StepOutputStatus } from '@activepieces/shared';

@Component({
  selector: 'app-selected-step-result',
  templateUrl: './selected-step-result.component.html',
})
export class SelectedStepResultComponent {
  readonly StepOutputStatus = StepOutputStatus;
  @Input() selectedStepResult: StepOutput;
  @Input() selectedStepName: string;
}
