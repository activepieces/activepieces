import { Injectable } from '@angular/core';
import { FormGroup, Validators } from '@angular/forms';
import { Config } from '../model/fields/variable/config';
import { ConfigType } from '../model/enum/config-type';
import { DynamicFormControl } from '../model/dynamic-controls/dynamic-form-control';
import { IntegerFormControl } from '../model/dynamic-controls/integer-form-control';
import { IntegerVariable } from '../model/fields/variable/integer-variable.class';
import { KeyValueVariable } from '../model/fields/variable/key-value-variable';
import { LongTextFormControl } from '../model/dynamic-controls/long-text-form-control';
import { LongTextVariableClass } from '../model/fields/variable/subfields/long-text-variable.class';
import { KeyValueFormControl } from '../model/dynamic-controls/key-value-form-control';
import { UUID } from 'angular2-uuid';
import { OAuth2Response } from '../model/fields/variable/subfields/oauth2-response.interface';
import { CheckboxFormControl } from '../model/dynamic-controls/checkbox-control';

@Injectable({
	providedIn: 'root',
})
export class FormService {
	constructor() {}

	public createInternalDynamicControl(
		variable: any,
		flowId: UUID | null,
		piecePanel: boolean,
		viewMode: boolean
	): any | null {
		switch (variable.type) {
			case ConfigType.LONG_TEXT:
				const longtextVariable = variable as LongTextVariableClass;
				return new LongTextFormControl({
					name: variable.key,
					label: variable.label,
					value: longtextVariable.value,
					disabled: viewMode,
					validatorFns: variable.settings.required ? [Validators.required] : [],
				});
			case ConfigType.INTEGER:
				const integerVariable = variable as IntegerVariable;
				return new IntegerFormControl({
					name: variable.key,
					label: variable.label,
					value: integerVariable.value,
					helpText: integerVariable.hintText,
					disabled: viewMode,
					validatorFns: variable.settings.required ? [Validators.required] : [],
				});
			case ConfigType.SHORT_TEXT: {
				const shortTextVariable = variable;
				return {
					name: variable.key,
					label: variable.label,
					value: shortTextVariable.value,
					helpText: shortTextVariable.hintText,
					disabled: viewMode,
					validatorFns: variable.settings.required ? [Validators.required] : [],
				};
			}
			case ConfigType.CHECKBOX: {
				const dictionary = variable as KeyValueVariable;
				return new CheckboxFormControl({
					name: variable.key,
					label: variable.label,
					value: dictionary.value,
					helpText: dictionary.hintText,
					disabled: viewMode,
					validatorFns: [Validators.required],
				});
			}
			case ConfigType.DICTIONARY: {
				const dictionary = variable as KeyValueVariable;
				return new KeyValueFormControl({
					name: variable.key,
					label: variable.label,
					value: dictionary.value,
					helpText: dictionary.hintText,
					disabled: viewMode,
					validatorFns: [Validators.required],
				});
			}
			case ConfigType.OAUTH2:
				if (piecePanel) {
					const oauth2 = variable;
					return {
						name: variable.key,
						label: variable.label,
						flowId: flowId!,
						value: oauth2.value as string,
						variable: oauth2,
						helpText: oauth2.hintText,
						disabled: viewMode,
						validatorFns: [Validators.required],
					};
				} else {
					const oauth2 = variable;
					return {
						name: variable.key,
						label: variable.label,
						value: oauth2.value as OAuth2Response,
						settings: oauth2.settings,
						helpText: oauth2.hintText,
						disabled: viewMode,
						validatorFns: [Validators.required],
					};
				}
			case ConfigType.DROPDOWN: {
				return {
					label: variable.label,
					name: variable.key,
					helpText: variable.hintText,
					validatorFns: variable.settings.required ? [Validators.required] : [],
					disabled: viewMode,
					value: variable.value,
					dropdownOptions: variable.settings.options ? variable.settings.options : [],
					isDynamic: variable.settings.dropdownType ? variable.settings.dropdownType === 'DYNAMIC' : false,
					refreshReferences: variable.settings.dropdownType === 'DYNAMIC' ? variable.settings.refreshReferences : [],
					//for test flow
					collectionVersionId: variable.collectionVersionId,
					flowVersionId: variable.flowVersionId,
				};
			}
			default:
				throw new Error('Unsupported type ' + variable.type);
		}
	}

	public createDynamicControl(variable: Config, viewMode: boolean): DynamicFormControl | null {
		return this.createInternalDynamicControl(variable, null, false, viewMode);
	}

	public createDynamicControls(
		variables: Config[],

		viewMode: boolean = false
	): DynamicFormControl[] {
		const dynamicControls: DynamicFormControl[] = [];
		for (let i = 0; i < variables.length; ++i) {
			const dynamicControl = this.createDynamicControl(variables[i], viewMode);
			if (dynamicControl) dynamicControls.push(dynamicControl);
		}
		return dynamicControls;
	}

	getErrorCount(form: FormGroup): number {
		let errorCount = 0;
		for (const controlKey in form.controls) {
			if (form.controls.hasOwnProperty(controlKey)) {
				if (form.controls[controlKey].errors != null) {
					// @ts-ignore
					errorCount += Object.keys(form.controls[controlKey].errors).length;
				}
			}
		}
		return errorCount;
	}
}
