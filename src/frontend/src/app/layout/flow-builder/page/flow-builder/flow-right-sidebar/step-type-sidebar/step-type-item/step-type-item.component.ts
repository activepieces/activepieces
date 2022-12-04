import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { FlowItemDetails } from './flow-item-details';
import { faInfoCircle } from '@fortawesome/free-solid-svg-icons';
import { Observable } from 'rxjs';

@Component({
	selector: 'app-step-type-item',
	templateUrl: './step-type-item.component.html',
	styleUrls: ['./step-type-item.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StepTypItemComponent {
	@Input() clickable = true;
	@Input() flowItemDetails: FlowItemDetails;
	@Input() flowItemDetails$: Observable<FlowItemDetails | undefined>;
	faInfo = faInfoCircle;
	hover: boolean = false;
	constructor() {}
}
