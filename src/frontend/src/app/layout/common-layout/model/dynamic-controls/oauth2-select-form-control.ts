import { ControlType } from './control-type.enum';
import { DynamicFormControl } from './dynamic-form-control';
import { FormControl, ValidatorFn } from '@angular/forms';
import { Config } from '../fields/variable/config';

import { UUID } from 'angular2-uuid';

export class Oauth2SelectFormControl extends DynamicFormControl {
	private variable: any;
	private flowId: UUID;

	constructor({
		label,
		name,
		helpText = '',
		value = null,
		hidden = false,
		disabled = false,
		validatorFns = [],
		variable,
		flowId,
	}: {
		label: string;
		name: string;
		helpText?: string;
		validatorFns?: ValidatorFn[];
		variable: any;
		hidden?: boolean;
		disabled?: boolean;
		flowId: UUID;
		value?: string | null;
	}) {
		super();
		this.variable = variable;
		this.name = name;
		this.value = value;
		this.validatorFns = validatorFns;
		this.label = label;
		this.flowId = flowId;
		this.hidden = hidden;
		this.disabled = disabled;
		this.helpText = helpText;
		this.type = ControlType.OAUTH2_SELECT;
		this._formControl = new FormControl(this.value, {
			validators: validatorFns,
		});
		if (this.disabled) {
			this._formControl.disable();
		}
	}

	getVariable(): Config {
		return this.variable;
	}

	formControl(): FormControl {
		return this._formControl as FormControl;
	}

	getFlowId() {
		return this.flowId;
	}
}
