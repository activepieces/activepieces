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
import { fadeInUp400ms } from 'src/app/modules/common/animation/fade-in-up.animation';
import { cronJobValidator } from 'src/app/modules/common/validators/cronjob-validator';
import { InputFormsSchema, ScheduledTriggerInputFormSchema } from '../input-forms-schema';
import cronstrue from 'cronstrue';
import { TriggerType } from 'src/app/modules/common/model/enum/trigger-type.enum';
@Component({
	selector: 'app-schedule-trigger-input-form',
	templateUrl: './schedule-trigger-input-form.component.html',
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
	scheduledFrom: FormGroup<{ cron_expression: FormControl<string> }>;
	onChange = (value: InputFormsSchema) => {};
	onTouch = () => {};
	updateComponentValue$: Observable<any>;
	constructor(private formBuilder: FormBuilder) {
		this.scheduledFrom = this.formBuilder.group({
			cron_expression: new FormControl('', { nonNullable: true, validators: [cronJobValidator] }),
		});
		this.updateComponentValue$ = this.scheduledFrom.valueChanges.pipe(
			tap(() => {
				this.onChange(this.scheduledFrom.getRawValue());
			})
		);
	}
	writeValue(obj: InputFormsSchema): void {
		if (obj.type === TriggerType.SCHEDULE) {
			this.scheduledFrom.patchValue({ cron_expression: (obj as ScheduledTriggerInputFormSchema).cron_expression });
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
		return cronstrue.toString(this.getControl('cron_expression')!.value);
	}
	setDisabledState?(isDisabled: boolean): void {
		if (isDisabled) {
			this.scheduledFrom.disable();
		} else if (this.scheduledFrom.disabled) {
			this.scheduledFrom.enable();
		}
	}
}
