import { ControlType } from './control-type.enum';
import { DynamicFormControl } from './dynamic-form-control';
import { FormControl, ValidatorFn } from '@angular/forms';

export class KeyValueFormControl extends DynamicFormControl {
	constructor({
		label,
		name,
		helpText = '',
		value = null,
		hidden = false,
		disabled = false,
		validatorFns = [],
	}: {
		label: string;
		name: string;
		helpText?: string;
		validatorFns?: ValidatorFn[];
		hidden?: boolean;
		disabled?: boolean;
		value?: any | null;
	}) {
		super();
		this.name = name;
		this.value = value;
		this.validatorFns = validatorFns;
		this.label = label;
		this.hidden = hidden;
		this.disabled = disabled;
		this.helpText = helpText;
		this.type = ControlType.KEY_VALUE;
		this._formControl = new FormControl(this.value ?? {}, { validators: validatorFns });
	}

	formControl(): FormControl {
		return this._formControl as FormControl;
	}
}
