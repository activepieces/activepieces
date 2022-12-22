import { Component } from '@angular/core';
import {
	ControlValueAccessor,
	UntypedFormBuilder,
	UntypedFormControl,
	UntypedFormGroup,
	NG_VALIDATORS,
	NG_VALUE_ACCESSOR,
} from '@angular/forms';
import { Observable, tap } from 'rxjs';
import { ActionType } from 'src/app/modules/common/model/enum/action-type.enum';
import { InputFormsSchema, ResponseStepInputFormSchema } from '../input-forms-schema';

@Component({
	selector: 'app-response-step-input-form',
	templateUrl: './response-step-input-form.component.html',
	providers: [
		{
			provide: NG_VALUE_ACCESSOR,
			multi: true,
			useExisting: ResponseStepInputFormComponent,
		},
		{
			provide: NG_VALIDATORS,
			multi: true,
			useExisting: ResponseStepInputFormComponent,
		},
	],
})
export class ResponseStepInputFormComponent implements ControlValueAccessor {
	responseStepForm: UntypedFormGroup;
	onChange = (value: InputFormsSchema) => {};
	onTouch = () => {};
	updateComponentValue$: Observable<any>;
	constructor(private formBuilder: UntypedFormBuilder) {
		this.responseStepForm = this.formBuilder.group({
			output: new UntypedFormControl(''),
		});
		this.updateComponentValue$ = this.responseStepForm.valueChanges.pipe(
			tap(() => {
				this.onChange(this.responseStepForm.value);
			})
		);
	}
	writeValue(obj: ResponseStepInputFormSchema): void {
		if (obj.type === ActionType.RESPONSE) {
			this.responseStepForm.patchValue(obj);
		}
	}
	registerOnChange(fn: any): void {
		this.onChange = fn;
	}
	registerOnTouched(fn: any): void {
		this.onTouch = fn;
	}
	validate() {
		if (this.responseStepForm.invalid) {
			return { invalid: true };
		}
		return null;
	}
	setDisabledState?(isDisabled: boolean): void {
		if (isDisabled) {
			this.responseStepForm.disable();
		} else if (this.responseStepForm.disabled) {
			this.responseStepForm.enable();
		}
	}
}
