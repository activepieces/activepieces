import { Component, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { ControlValueAccessor, FormBuilder, FormControl, FormGroup, NG_VALUE_ACCESSOR } from '@angular/forms';
import { BodyType } from './body-type.enum';
import jsonlint from 'jsonlint-mod';
import { Observable, tap } from 'rxjs';
import { CodeService } from 'src/app/layout/flow-builder/service/code.service';
import { HttpMethod } from '../../configs-form/connector-action-or-config';
interface CustomRequestFormSchema {
	endpoint: { url: string; method: HttpMethod };
	parameters: { [key: string]: any };
	headers: { [key: string]: any };
	body: { [key: string]: any } | string;
}
@Component({
	selector: 'app-connector-custom-request-form-control',
	templateUrl: './connector-custom-request-form-control.component.html',
	styleUrls: ['./connector-custom-request-form-control.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
	providers: [
		{
			provide: NG_VALUE_ACCESSOR,
			multi: true,
			useExisting: ConnectorCustomRequestFormControlComponent,
		},
	],
})
export class ConnectorCustomRequestFormControlComponent implements ControlValueAccessor {
	customRequestFormGroup: FormGroup;
	bodyTypeMenuOpened = false;
	valueChanges$: Observable<CustomRequestFormSchema>;
	codeEditorOptions = {
		lineNumbers: true,
		lineWrapping: true,
		theme: 'lucario',
		mode: 'application/ld+json',
		lint: true,
		gutters: ['CodeMirror-lint-markers'],
	};
	bodyTypesLabels: Map<BodyType, string> = new Map([
		[BodyType.JSON, 'JSON'],
		[BodyType.KEY_PAIR, 'Key/Value'],
		[BodyType.RAW, 'Raw'],
	]);
	onChange = (value: CustomRequestFormSchema) => {};
	constructor(private fb: FormBuilder, private codeService: CodeService, private cd: ChangeDetectorRef) {
		this.customRequestFormGroup = this.fb.group({
			endpoint: new FormControl({}),
			parameters: new FormControl(),
			headers: new FormControl(),
			body: new FormControl(),
		});
		this.valueChanges$ = this.customRequestFormGroup.valueChanges.pipe(
			tap(value => {
				this.onChange(value);
			})
		);
		(<any>window).jsonlint = jsonlint;
	}
	BodyType = BodyType;
	bodyType: BodyType = BodyType.KEY_PAIR;
	writeValue(obj: CustomRequestFormSchema): void {
		if (typeof obj.body === 'string') {
			this.bodyType = BodyType.JSON;
		} else {
			this.bodyType = BodyType.KEY_PAIR;
		}
		this.cd.detectChanges();
		this.customRequestFormGroup.patchValue(obj, { emitEvent: false, onlySelf: true });
	}
	registerOnChange(fn: any): void {
		this.onChange = fn;
	}
	registerOnTouched(fn: any): void {}
	setDisabledState?(isDisabled: boolean): void {
		if (isDisabled) {
			this.customRequestFormGroup.disable();
		} else {
			this.customRequestFormGroup.enable();
		}
	}
	changeBodyType(newBodyType: BodyType) {
		if (newBodyType !== this.bodyType) {
			this.bodyType = newBodyType;
			const bodyValue = this.customRequestFormGroup.get('body')!.value;
			const bodyControl = this.customRequestFormGroup.get('body');
			switch (newBodyType) {
				case BodyType.JSON: {
					if (typeof bodyValue === 'object') {
						bodyControl?.setValue(this.codeService.beautifyJson(bodyValue));
					}
					break;
				}
				case BodyType.KEY_PAIR: {
					const jsonValue = this.getJsonValue(bodyValue);
					if (Object.keys(jsonValue).length === 0) {
						this.customRequestFormGroup.get('body')!.setValue({});
					} else {
						this.customRequestFormGroup.get('body')!.setValue(jsonValue);
					}

					break;
				}
				case BodyType.RAW: {
					if (typeof bodyValue === 'object') {
						bodyControl!.setValue(this.codeService.beautifyJson(bodyValue));
					}
				}
			}
		}
	}
	getJsonValue(bodyStringValue: string) {
		try {
			return JSON.parse(bodyStringValue);
		} catch (err) {
			return {};
		}
	}
}
