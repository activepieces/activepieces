import { Component, Input, OnInit } from '@angular/core';
import { StepOutput, StepOutputStatus } from '@activepieces/shared';

@Component({
	selector: 'app-selected-step-result',
	templateUrl: './selected-step-result.component.html',
	styleUrls: ['./selected-step-result.component.scss'],
})
export class SelectedStepResultComponent implements OnInit {
	@Input() selectedStepResult: StepOutput;
	@Input() selectedStepName: string;
	constructor() {}
	ngOnInit(): void {
		if (!this.selectedStepResult.output && this.selectedStepResult.errorMessage) {
			this.selectedStepResult = { ...this.selectedStepResult, output: this.selectedStepResult.errorMessage };
		}
	}

	get ActionStatusEnum() {
		return StepOutputStatus;
	}
}
