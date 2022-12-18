import { Component, Input, OnInit } from '@angular/core';
import { ActionStatus } from 'src/app/layout/common-layout/model/enum/action-status';
import { StepResult } from 'src/app/layout/common-layout/model/instance-run.interface';

@Component({
	selector: 'app-selected-step-result',
	templateUrl: './selected-step-result.component.html',
	styleUrls: ['./selected-step-result.component.scss'],
})
export class SelectedStepResultComponent implements OnInit {
	@Input() selectedStepResult: StepResult;
	@Input() selectedStepName: string;
	constructor() {}
	ngOnInit(): void {
		if (!this.selectedStepResult.output && this.selectedStepResult.error_message) {
			this.selectedStepResult = { ...this.selectedStepResult, output: this.selectedStepResult.error_message };
		}
	}

	get ActionStatusEnum() {
		return ActionStatus;
	}
}
