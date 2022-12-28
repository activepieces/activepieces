import { Component, Input, OnInit } from '@angular/core';

@Component({
	selector: 'app-state-icon',
	templateUrl: './state-icon.component.html',
})
export class StateIconComponent implements OnInit {
	@Input() size = 16;
	@Input() succeeded: boolean;
	@Input() showStatusText = true;
	textAfter: string = '';
	constructor() {}
	ngOnInit(): void {
		this.textAfter = this.succeeded ? 'Success' : 'Failed';
	}
}
