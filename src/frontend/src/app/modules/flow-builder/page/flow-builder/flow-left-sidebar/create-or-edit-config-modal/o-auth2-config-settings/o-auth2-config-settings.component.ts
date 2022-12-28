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
	redirect_url: FormControl<string>;
	client_secret: FormControl<string>;
	client_id: FormControl<string>;
	auth_url: FormControl<string>;
	refresh_url: FormControl<string>;
	token_url: FormControl<string>;
	response_type: FormControl<string>;
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
			redirect_url: new FormControl({ value: environment.redirectUrl, disabled: true }, { nonNullable: true }),
			client_secret: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
			client_id: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
			auth_url: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
			refresh_url: new FormControl('', { nonNullable: true }),
			token_url: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
			response_type: new FormControl('code', { nonNullable: true, validators: [Validators.required] }),
			scope: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
		});
		this.settingsFormValueChanged$ = this.settingsForm.valueChanges.pipe(
			tap(() => this.onChange({ ...this.settingsForm.getRawValue(), user_input_type: 'LOGIN' })),
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
