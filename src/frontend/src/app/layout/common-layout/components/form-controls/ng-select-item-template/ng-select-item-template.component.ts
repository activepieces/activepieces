import { Component, Input } from '@angular/core';
import { DropdownOption } from '../../../model/fields/variable/config-settings';

@Component({
	templateUrl: './ng-select-item-template.component.html',
	styleUrls: [],
	selector: 'app-ng-select-item-template',
})
export class NgSelectItemTemplateComponent {
	@Input() item: DropdownOption;
	@Input() isSelected: boolean = false;
	constructor() {}
}
