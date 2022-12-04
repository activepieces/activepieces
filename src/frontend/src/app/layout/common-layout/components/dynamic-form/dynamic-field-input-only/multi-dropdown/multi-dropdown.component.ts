import { Component, HostListener, Input } from '@angular/core';
import { DropdownItemOption } from 'src/app/layout/common-layout/model/fields/variable/subfields/dropdown-item-option';
import { MultiDropdownFormControl } from '../../../../model/dynamic-controls/multi-dropdown-form-control';

@Component({
	selector: 'app-multi-dropdown',
	templateUrl: './multi-dropdown.component.html',
	styleUrls: ['./multi-dropdown.component.scss'],
})
export class MultiDropdownComponent {
	opened = false;
	wasInside = false;
	@Input() dynamicControl: MultiDropdownFormControl;

	constructor() {}

	flip() {
		this.opened = !this.opened;
	}

	@HostListener('click')
	clickInside() {
		this.wasInside = true;
	}

	@HostListener('document:click')
	clickout() {
		if (!this.wasInside) {
			this.opened = false;
		}
		this.wasInside = false;
	}
	itemSelected(item: DropdownItemOption) {
		const values: any[] = this.dynamicControl.formControl().value;
		return values.find(v => v == item.value) !== undefined;
	}
}
