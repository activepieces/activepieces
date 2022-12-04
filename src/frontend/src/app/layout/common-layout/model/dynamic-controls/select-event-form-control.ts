import { ControlType } from './control-type.enum';
import { FormControl, ValidatorFn } from '@angular/forms';
import { DropdownItemOption } from '../fields/variable/subfields/dropdown-item-option';
import { MultiDropdownFormControl } from './multi-dropdown-form-control';

export class SelectEventFormControl extends MultiDropdownFormControl {
	constructor({
		label,
		name,
		helpText = '',
		validatorFns = [],
		dropdownOptions,
		hidden = false,
		disabled = false,
		value = [],
	}: {
		label: string;
		name: string;
		helpText?: string;
		validatorFns?: ValidatorFn[];
		dropdownOptions: DropdownItemOption[];
		hidden?: boolean;
		disabled?: boolean;
		value?: any[] | null;
	}) {
		super({
			name,
			label,
			disabled,
			hidden,
			helpText,
			validatorFns,
			dropdownOptions,
			value,
		});
		this.type = ControlType.SELECT_EVENT;
		this._formControl = new FormControl(this.value, validatorFns);
	}
}
