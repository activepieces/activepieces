import { Component, EventEmitter, Input, Output } from '@angular/core';
import { StepResult } from 'src/app/layout/common-layout/model/instance-run.interface';

@Component({
	selector: 'app-iteration-accordion',
	templateUrl: './iteration-accordion.component.html',
	styleUrls: ['./iteration-accordion.component.css'],
})
export class IterationAccordionComponent {
	@Input() iterationIndex: number;
	@Input() IterationResults: { stepName: string; result: StepResult }[];
	@Input() selectedStepName: string | null;
	@Input() nestingLevel = 0;
	@Output() childStepSelected = new EventEmitter();
	constructor() {}

	stopPropagation(event: MouseEvent) {
		event.stopPropagation();
	}
	childStepSelectedHandler() {
		this.childStepSelected.emit();
	}
}
