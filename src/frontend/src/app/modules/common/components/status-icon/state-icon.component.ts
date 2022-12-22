import { Component, Input } from '@angular/core';

@Component({
	selector: 'app-state-icon',
	templateUrl: './state-icon.component.html',
	styleUrls: ['./state-icon.component.css'],
})
export class StateIconComponent {
	@Input() size = 16;
	@Input() succeeded: boolean;
	@Input() textAfter = '';
	constructor() {}
	textClass() {
		if (!this.succeeded) {
			return 'text-danger';
		}
		return 'text-success';
	}
}
