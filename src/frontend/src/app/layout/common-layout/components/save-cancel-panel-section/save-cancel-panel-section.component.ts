import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
	selector: 'app-save-cancel-panel-section',
	templateUrl: './save-cancel-panel-section.component.html',
	styleUrls: ['./save-cancel-panel-section.component.css'],
})
export class SaveCancelPanelSectionComponent {
	@Input() saveHidden = false;
	@Input() saving = false;
	@Input() buttonsOnTheLeftOfContainer = false;
	@Output() saveClicked: EventEmitter<null> = new EventEmitter();
	@Output() cancelClicked: EventEmitter<null> = new EventEmitter();
	constructor() {}
}
