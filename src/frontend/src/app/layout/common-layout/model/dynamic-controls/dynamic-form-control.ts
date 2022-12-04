import { ControlType } from './control-type.enum';
import { AbstractControl, FormControl, FormGroup, ValidatorFn, Validators } from '@angular/forms';
import { Observable } from 'rxjs';

export abstract class DynamicFormControl {
	protected label: string;
	protected name: string;
	protected placeholder: string;
	protected helpText?: string;
	protected value: any;
	protected hidden: boolean = false;
	protected disabled: boolean = false;
	protected initialValue: Observable<any>;
	protected type: ControlType;
	protected errorMessages: { [key: string]: string };
	protected validatorFns: ValidatorFn[];
	protected _formControl: AbstractControl;

	public abstract formControl(): FormControl | FormGroup;

	public getName(): string {
		return this.name;
	}

	public getrequired(): string {
		let suffix = '';
		if (this.validatorFns.indexOf(Validators.required) != -1) {
			suffix = ' *';
		}
		return this.label + suffix;
	}

	public getLabel(): string {
		return this.label;
	}

	public getHelpText() {
		return this.helpText;
	}

	public getErrorMessages() {
		return this.errorMessages;
	}

	public isHidden() {
		return this.hidden;
	}

	public getType() {
		return this.type;
	}

	public isDisabled() {
		return this.disabled;
	}

	setHidden(b: boolean) {
		this.hidden = b;
	}

	getPlaceholder() {
		return this.placeholder;
	}
}
