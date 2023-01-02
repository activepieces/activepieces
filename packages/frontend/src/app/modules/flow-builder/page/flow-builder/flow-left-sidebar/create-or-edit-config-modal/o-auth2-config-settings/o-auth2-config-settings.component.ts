import { Component, Input } from '@angular/core';
import {
	ControlValueAccessor,
	NG_VALIDATORS,
	NG_VALUE_ACCESSOR,
	Validators,
	FormGroup,
	FormControl,
	FormBuilder,
} from '@angular/forms';
import { map, Observable, tap } from 'rxjs';
import { fadeInUp400ms } from 'src/app/modules/common/animation/fade-in-up.animation';
import { environment } from 'src/environments/environment';
interface SetttingsForm {
	redirectUrl: FormControl<string>;
	clientSecret: FormControl<string>;
	clientId: FormControl<string>;
	authUrl: FormControl<string>;
	refreshUrl: FormControl<string>;
	tokenUrl: FormControl<string>;
	responseType: FormControl<string>;
	scope: FormControl<string>;
}
@Component({
	selector: 'app-o-auth2-config-settings',
	templateUrl: './o-auth2-config-settings.component.html',
	providers: [
		{
			provide: NG_VALUE_ACCESSOR,
			multi: true,
			useExisting: OAuth2ConfigSettingsComponent,
		},
		{
			provide: NG_VALIDATORS,
			multi: true,
			useExisting: OAuth2ConfigSettingsComponent,
		},
	],
	animations: [fadeInUp400ms],
})
export class OAuth2ConfigSettingsComponent implements ControlValueAccessor {
	settingsForm: FormGroup<SetttingsForm>;
	settingsFormValueChanged$: Observable<void>;
	@Input() submitted: boolean = false;
	onChange = val => {};
	constructor(private formBuilder: FormBuilder) {
		this.settingsForm = this.formBuilder.group({
			redirectUrl: new FormControl(
				{ value: environment.redirectUrl, disabled: false },
				{ nonNullable: true, validators: [Validators.required] }
			),
			clientSecret: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
			clientId: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
			authUrl: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
			refreshUrl: new FormControl('', { nonNullable: true }),
			tokenUrl: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
			responseType: new FormControl('code', { nonNullable: true, validators: [Validators.required] }),
			scope: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
		});
		this.settingsFormValueChanged$ = this.settingsForm.valueChanges.pipe(
			tap(() =>
				this.onChange({
					...this.settingsForm.getRawValue(),
				})
			),
			map(() => void 0)
		);
	}
	writeValue(obj: any): void {
		this.settingsForm.patchValue(obj);
	}
	registerOnChange(fn: any): void {
		this.onChange = fn;
	}
	registerOnTouched(fn: any): void {}
	setDisabledState?(isDisabled: boolean): void {
		if (isDisabled) {
			this.settingsForm.disable();
		}
	}
	validate() {
		if (this.settingsForm.invalid) {
			return { invalid: true };
		}
		return null;
	}
}
