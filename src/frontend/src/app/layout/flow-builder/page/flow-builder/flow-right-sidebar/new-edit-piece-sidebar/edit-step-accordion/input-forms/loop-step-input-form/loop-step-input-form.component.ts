import { Component } from '@angular/core';
import {
	ControlValueAccessor,
	FormBuilder,
	FormControl,
	FormGroup,
	NG_VALIDATORS,
	NG_VALUE_ACCESSOR,
	Validators,
} from '@angular/forms';

import { Observable, tap } from 'rxjs';
import { fadeInUp400ms } from 'src/app/layout/common-layout/animation/fade-in-up.animation';
import { ActionType } from 'src/app/layout/common-layout/model/enum/action-type.enum';
import { InputFormsSchema } from '../input-forms-schema';

@Component({
	selector: 'app-loop-step-input-form',
	templateUrl: './loop-step-input-form.component.html',
	providers: [
		{
			provide: NG_VALUE_ACCESSOR,
			multi: true,
			useExisting: LoopStepInputFormComponent,
		},
		{
			provide: NG_VALIDATORS,
			multi: true,
			useExisting: LoopStepInputFormComponent,
		},
	],
	animations: [fadeInUp400ms],
})
export class LoopStepInputFormComponent implements ControlValueAccessor {
	loopStepForm: FormGroup;
	updateComponentValue$: Observable<any>;
	onChange = (value: InputFormsSchema) => {};
	onTouch = () => {};

	constructor(private formBuilder: FormBuilder) {
		this.loopStepForm = this.formBuilder.group({
			items: new FormControl('', Validators.required),
		});
		this.updateComponentValue$ = this.loopStepForm.valueChanges.pipe(
			tap(() => {
				this.onChange(this.loopStepForm.value);
			})
		);
	}

	writeValue(obj: InputFormsSchema): void {
		if (obj.type === ActionType.LOOP_ON_ITEMS) {
			this.loopStepForm.patchValue(obj);
		}
	}
	registerOnChange(fn: any): void {
		this.onChange = fn;
	}
	registerOnTouched(fn: any): void {
		this.onTouch = fn;
	}

	validate() {
		if (this.loopStepForm.invalid) {
			return { invalid: true };
		}
		return null;
	}

	getControl(name: string) {
		return this.loopStepForm.get(name)!;
	}
	setDisabledState?(isDisabled: boolean): void {
		if (isDisabled) {
			this.loopStepForm.disable();
		} else if (this.loopStepForm.disabled) {
			this.loopStepForm.enable();
		}
	}
}
