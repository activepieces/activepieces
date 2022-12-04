import { Component, Input } from '@angular/core';

@Component({
	selector: 'app-filter-bar',
	templateUrl: './filter-bar.component.html',
	styleUrls: ['./filter-bar.component.css'],
})
export class FilterBarComponent {
	@Input() environment = true;
	@Input() account = false;
	@Input() instance = false;

	constructor() {}
}
