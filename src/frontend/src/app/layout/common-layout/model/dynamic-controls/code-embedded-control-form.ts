import { ControlType } from './control-type.enum';
import { DynamicFormControl } from './dynamic-form-control';
import { FormControl, FormGroup, ValidatorFn, Validators } from '@angular/forms';
import { Artifact } from '../../../flow-builder/model/artifact.interface';

export class CodeEmbeddedControl extends DynamicFormControl {
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
		value?: Artifact | null;
	}) {
		super();
		this.name = name;
		this.value = value;
		this.validatorFns = validatorFns;
		this.label = label;
		this.hidden = hidden;
		this.disabled = disabled;
		this.helpText = helpText;
		this.type = ControlType.EMBEDDED_CODE_EDITOR;
		// this.value
		this._formControl = new FormGroup(
			{
				content: new FormControl(value?.content ?? '', [Validators.required]),
				package: new FormControl(value?.package ?? '', [Validators.required]),
			},
			{ validators: validatorFns }
		);
	}

	formControl(): FormGroup {
		return this._formControl as FormGroup;
	}
}
