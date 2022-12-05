import { ControlType } from './control-type.enum';
import { DynamicFormControl } from './dynamic-form-control';
import { FormControl, ValidatorFn } from '@angular/forms';

export class IntegerFormControl extends DynamicFormControl {
	constructor({
		label,
		name,
		helpText = '',
		value = null,
		hidden = false,
		disabled = false,
		validatorFns = [],
		placeholder = 0,
	}: {
		label: string;
		name: string;
		helpText?: string;
		placeholder?: number;
		validatorFns?: ValidatorFn[];
		hidden?: boolean;
		disabled?: boolean;
		value?: number | null;
	}) {
		super();
		this.name = name;
		this.value = value;
		this.validatorFns = validatorFns;
		this.label = label;
		this.hidden = hidden;
		this.placeholder = placeholder.toString();
		this.disabled = disabled;
		this.helpText = helpText;
		this.type = ControlType.INTEGER;
		this._formControl = new FormControl(this.value, { validators: validatorFns });
	}

	formControl(): FormControl {
		return this._formControl as FormControl;
	}
}
