import { ControlType } from './control-type.enum';
import { DynamicFormControl } from './dynamic-form-control';
import { FormControl, ValidatorFn } from '@angular/forms';
import { DropdownItemOption } from '../fields/variable/subfields/dropdown-item-option';

export class MultiDropdownFormControl extends DynamicFormControl {
	protected dropdownOptions: DropdownItemOption[];

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
		super();
		this.name = name;
		this.label = label;
		this.disabled = disabled;
		this.hidden = hidden;
		this.helpText = helpText;
		this.validatorFns = validatorFns;
		this.dropdownOptions = dropdownOptions;
		this.value = value;
		this.type = ControlType.MULTI_DROPDOWN;
		this._formControl = new FormControl(this.value, validatorFns);
	}

	formControl(): FormControl {
		return this._formControl as FormControl;
	}

	getDropdownOptions() {
		return this.dropdownOptions;
	}
}
