import { Component, EventEmitter, Input, Output } from '@angular/core';
import { StepOutput } from '@activepieces/shared';

@Component({
	selector: 'app-iteration-accordion',
	templateUrl: './iteration-accordion.component.html',
	styleUrls: ['./iteration-accordion.component.css'],
})
export class IterationAccordionComponent {
	@Input() iterationIndex: number;
	@Input() IterationResults: { stepName: string; result: StepOutput }[];
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
