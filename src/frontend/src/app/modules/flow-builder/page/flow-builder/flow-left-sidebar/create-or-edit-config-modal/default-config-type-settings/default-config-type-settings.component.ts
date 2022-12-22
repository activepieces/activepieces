import { Component } from '@angular/core';
import { ControlValueAccessor, UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, NG_VALUE_ACCESSOR } from '@angular/forms';
import { Observable, tap } from 'rxjs';

@Component({
	selector: 'app-default-config-type-settings',
	templateUrl: './default-config-type-settings.component.html',
	styleUrls: ['./default-config-type-settings.component.css'],
	providers: [
		{
			provide: NG_VALUE_ACCESSOR,
			multi: true,
			useExisting: DefaultConfigTypeSettingsComponent,
		},
	],
})
export class DefaultConfigTypeSettingsComponent implements ControlValueAccessor {
	defaultConfigSettingsForm: UntypedFormGroup;
	onTouch = () => {};
	onChange = val => {};
	formValueChanged$: Observable<void>;
	constructor(private formBuilder: UntypedFormBuilder) {
		this.defaultConfigSettingsForm = this.formBuilder.group({ optional: new UntypedFormControl() });
		this.formValueChanged$ = this.defaultConfigSettingsForm.valueChanges.pipe(
			tap(() => {
				this.onChange(this.defaultConfigSettingsForm.value);
			})
		);
	}
	writeValue(obj: any): void {
		if (obj && obj.required) this.defaultConfigSettingsForm.patchValue({ optional: !obj.required });
	}
	registerOnChange(fn: any): void {
		this.onChange = fn;
	}
	registerOnTouched(fn: any): void {
		this.onTouch = fn;
	}
	setDisabledState?(isDisabled: boolean): void {
		if (isDisabled) {
			this.defaultConfigSettingsForm.disable();
		} else {
			this.defaultConfigSettingsForm.enable();
		}
	}
}
