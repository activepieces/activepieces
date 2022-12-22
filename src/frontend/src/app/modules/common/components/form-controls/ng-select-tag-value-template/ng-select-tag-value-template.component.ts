import { Component, Input } from '@angular/core';
import { DropdownOption } from '../../../model/dropdown-options';

@Component({
	selector: 'app-ng-select-tag-value-template',
	templateUrl: './ng-select-tag-value-template.component.html',
	styleUrls: ['./ng-select-tag-value-template.component.scss'],
})
export class NgSelectTagValueTemplateComponent {
	constructor() {}
	@Input() clear: Function;
	@Input() item: DropdownOption | string;
}
