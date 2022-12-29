import { Component, Input } from '@angular/core';

@Component({
	templateUrl: './ng-select-item-template.component.html',
	styleUrls: [],
	selector: 'app-ng-select-item-template',
})
export class NgSelectItemTemplateComponent {
	@Input() item: { label: string; value: any };
	@Input() isSelected: boolean = false;
	constructor() {}
}
