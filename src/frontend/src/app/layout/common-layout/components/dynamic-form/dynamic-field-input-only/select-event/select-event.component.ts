import { Component, Input } from '@angular/core';
import { SelectEventFormControl } from '../../../../model/dynamic-controls/select-event-form-control';
import { CreateNewEventModalComponent } from '../../../create-new-event-modal/create-new-event-modal.component';
import { BsModalService } from 'ngx-bootstrap/modal';

@Component({
	selector: 'app-select-event',
	templateUrl: './select-event.component.html',
	styleUrls: ['./select-event.component.scss'],
})
export class SelectEventComponent {
	@Input() dynamicControl: SelectEventFormControl;

	constructor(private modalService: BsModalService) {}

	openEvent() {
		this.modalService.show(CreateNewEventModalComponent);
	}
}
