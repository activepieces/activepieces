import { ControlType } from './control-type.enum';
import { DynamicFormControl } from './dynamic-form-control';
import { FormControl, ValidatorFn } from '@angular/forms';
import { OAuth2Response } from '../fields/variable/subfields/oauth2-response.interface';
import { Oauth2LoginSettingsInterface } from '../fields/variable/subfields/oauth2-login-settings.interface';

export class Oauth2LoginFormControl extends DynamicFormControl {
	private settings: Oauth2LoginSettingsInterface;

	constructor({
		label,
		name,
		helpText = '',
		value = null,
		hidden = false,
		disabled = false,
		validatorFns = [],
		settings,
	}: {
		label: string;
		name: string;
		helpText?: string;
		validatorFns?: ValidatorFn[];
		hidden?: boolean;
		disabled?: boolean;
		settings: Oauth2LoginSettingsInterface;
		value?: OAuth2Response | null;
	}) {
		super();
		this.name = name;
		this.value = value;
		this.validatorFns = validatorFns;
		this.label = label;
		this.hidden = hidden;
		this.disabled = disabled;
		this.settings = settings;
		this.helpText = helpText;
		this.type = ControlType.OAUTH2_LOGIN;
		this._formControl = new FormControl(this.value, { validators: validatorFns });
	}

	formControl(): FormControl {
		return this._formControl as FormControl;
	}

	getSettings() {
		return this.settings;
	}
}
