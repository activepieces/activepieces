import { Component, Input } from '@angular/core';
import { StepOutput, StepOutputStatus } from '@activepieces/shared';

@Component({
  selector: 'app-selected-step-result',
  templateUrl: './selected-step-result.component.html',
  styleUrls: ['./selected-step-result.component.scss'],
})
export class SelectedStepResultComponent {
  @Input() selectedStepResult: StepOutput;
  @Input() selectedStepName: string;

  get ActionStatusEnum() {
    return StepOutputStatus;
  }
}
