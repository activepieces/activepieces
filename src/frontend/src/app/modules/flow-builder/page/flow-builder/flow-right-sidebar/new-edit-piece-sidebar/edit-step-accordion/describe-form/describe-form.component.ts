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
import { tap } from 'rxjs';
import { Observable } from 'rxjs/internal/Observable';
import { fadeInUp400ms } from 'src/app/modules/common/animation/fade-in-up.animation';

@Component({
	selector: 'app-describe-form',
	templateUrl: './describe-form.component.html',
	providers: [
		{
			provide: NG_VALUE_ACCESSOR,
			multi: true,
			useExisting: DescribeFormComponent,
		},
		{
			provide: NG_VALIDATORS,
			multi: true,
			useExisting: DescribeFormComponent,
		},
	],
	animations: [fadeInUp400ms],
})
export class DescribeFormComponent implements ControlValueAccessor {
	describeForm: FormGroup;
	OnChange = value => {};
	onTouched = () => {};
	updateComponentValue$: Observable<any>;
	constructor(private formBuilder: FormBuilder) {
		this.describeForm = this.formBuilder.group({
			displayName: new FormControl('', Validators.required),
			name: new FormControl({ value: '', disabled: true }),
		});
		this.updateComponentValue$ = this.describeForm.valueChanges.pipe(
			tap(value => {
				this.OnChange(this.describeForm.getRawValue());
			})
		);
	}
	writeValue(value: { name: string; displayName: string }): void {
		this.describeForm.patchValue(value);
	}
	registerOnChange(changed: any): void {
		this.OnChange = changed;
	}
	registerOnTouched(tocuhed: any): void {
		this.onTouched = tocuhed;
	}
	validate() {
		if (this.describeForm.invalid) {
			return { invalid: true };
		}
		return null;
	}
	setDisabledState?(isDisabled: boolean): void {
		if (isDisabled) {
			this.describeForm.disable();
		} else if (this.describeForm.disabled) {
			this.describeForm.enable();
		}
	}
	getControl(name: string) {
		return this.describeForm.get(name)!;
	}
}
