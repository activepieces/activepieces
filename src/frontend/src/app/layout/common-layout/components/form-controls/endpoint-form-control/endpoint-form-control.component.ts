import { Component, ChangeDetectionStrategy, Input } from '@angular/core';
import { ControlValueAccessor, FormBuilder, FormControl, FormGroup, NG_VALUE_ACCESSOR } from '@angular/forms';
import { Observable, tap } from 'rxjs';
import { HttpMethod } from '../../configs-form/configs-form-for-connectors/connector-action-or-config';

type EndpointFormData = {
	method: HttpMethod;
	path: string;
};

@Component({
	selector: 'app-endpoint-form-control',
	templateUrl: './endpoint-form-control.component.html',
	styleUrls: ['./endpoint-form-control.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
	providers: [
		{
			provide: NG_VALUE_ACCESSOR,
			multi: true,
			useExisting: EndpointFormControlComponent,
		},
	],
})
export class EndpointFormControlComponent implements ControlValueAccessor {
	endpointForm: FormGroup;
	@Input()
	url = 'testurl.com/';
	onChange = (value: EndpointFormData) => {};
	valueChanges$: Observable<EndpointFormData>;
	methods = [
		HttpMethod.GET,
		HttpMethod.HEAD,
		HttpMethod.POST,
		HttpMethod.PUT,
		HttpMethod.DELETE,
		HttpMethod.OPTIONS,
		HttpMethod.PATCH,
		HttpMethod.TRACE,
	];
	constructor(private fb: FormBuilder) {
		this.endpointForm = this.fb.group({
			path: new FormControl(''),
			method: new FormControl(HttpMethod.GET),
		});
		this.valueChanges$ = this.endpointForm.valueChanges.pipe(
			tap(value => {
				this.onChange(value);
			})
		);
	}
	writeValue(obj: EndpointFormData): void {
		if (obj.path || obj.method) {
			this.endpointForm.patchValue(obj, { emitEvent: false });
		}
	}
	registerOnChange(fn: any): void {
		this.onChange = fn;
	}
	registerOnTouched(fn: any): void {}
	setDisabledState?(isDisabled: boolean): void {
		if (isDisabled) {
			this.endpointForm.disable();
		} else {
			this.endpointForm.enable();
		}
	}
}
