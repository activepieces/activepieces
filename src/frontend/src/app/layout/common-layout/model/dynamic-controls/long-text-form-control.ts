import { ControlType } from './control-type.enum';
import { DynamicFormControl } from './dynamic-form-control';
import { FormControl, ValidatorFn } from '@angular/forms';

export class LongTextFormControl extends DynamicFormControl {
	constructor({
		label,
		helpText = '',
		name,
		placeholder = '',
		hidden = false,
		disabled = false,
		value = null,
		validatorFns = [],
		errorMessages = {},
	}: {
		label: string;
		name: string;
		placeholder?: string;
		helpText?: string;
		errorMessages?: { [key: string]: string };
		validatorFns?: ValidatorFn[];
		hidden?: boolean;
		disabled?: boolean;
		value?: string | null;
	}) {
		super();
		this.placeholder = placeholder;
		this.validatorFns = validatorFns;
		this.name = name;
		this.hidden = hidden;
		this.disabled = disabled;
		this.errorMessages = errorMessages;
		this.value = value;
		this.label = label;
		this.helpText = helpText;
		this.type = ControlType.LONG_TEXT;
		this._formControl = new FormControl(this.value, { validators: validatorFns });
		if (this.disabled) {
			this._formControl.disable();
		}
	}

	formControl(): FormControl {
		return this._formControl as FormControl;
	}
}
