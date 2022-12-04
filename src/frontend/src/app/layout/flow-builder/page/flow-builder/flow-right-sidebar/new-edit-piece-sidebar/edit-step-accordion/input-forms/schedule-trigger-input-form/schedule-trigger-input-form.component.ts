import { Component } from '@angular/core';
import {
	ControlValueAccessor,
	FormBuilder,
	FormControl,
	FormGroup,
	NG_VALIDATORS,
	NG_VALUE_ACCESSOR,
} from '@angular/forms';
import { Observable, tap } from 'rxjs';
import { fadeInUp400ms } from 'src/app/layout/common-layout/animation/fade-in-up.animation';
import { cronJobValidator } from 'src/app/layout/common-layout/validators/cronjob-validator';
import { InputFormsSchema } from '../input-forms-schema';
import cronstrue from 'cronstrue';
import { TriggerType } from 'src/app/layout/common-layout/model/enum/trigger-type.enum';
@Component({
	selector: 'app-schedule-trigger-input-form',
	templateUrl: './schedule-trigger-input-form.component.html',
	styleUrls: ['./schedule-trigger-input-form.component.scss'],
	providers: [
		{
			provide: NG_VALUE_ACCESSOR,
			multi: true,
			useExisting: ScheduleTriggerInputFormComponent,
		},
		{
			provide: NG_VALIDATORS,
			multi: true,
			useExisting: ScheduleTriggerInputFormComponent,
		},
	],
	animations: [fadeInUp400ms],
})
export class ScheduleTriggerInputFormComponent implements ControlValueAccessor {
	scheduledFrom: FormGroup;
	onChange = (value: InputFormsSchema) => {};
	onTouch = () => {};
	updateComponentValue$: Observable<any>;
	constructor(private formBuilder: FormBuilder) {
		this.scheduledFrom = this.formBuilder.group({ cronExpression: new FormControl('', cronJobValidator) });
		this.updateComponentValue$ = this.scheduledFrom.valueChanges.pipe(
			tap(() => {
				this.onChange(this.scheduledFrom.value);
			})
		);
	}
	writeValue(obj: InputFormsSchema): void {
		if (obj.type === TriggerType.SCHEDULE) {
			this.scheduledFrom.patchValue(obj);
		}
	}
	registerOnChange(fn: any): void {
		this.onChange = fn;
	}
	registerOnTouched(fn: any): void {
		this.onTouch = fn;
	}
	getControl(controlName: string) {
		return this.scheduledFrom.get(controlName);
	}
	validate() {
		if (this.scheduledFrom.invalid) {
			return { invalid: true };
		}
		return null;
	}
	interpretCronExpression() {
		return cronstrue.toString(this.getControl('cronExpression')!.value);
	}
	setDisabledState?(isDisabled: boolean): void {
		if (isDisabled) {
			this.scheduledFrom.disable();
		} else if (this.scheduledFrom.disabled) {
			this.scheduledFrom.enable();
		}
	}
}
