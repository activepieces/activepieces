import { Component } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormGroup, FormBuilder, FormControl } from '@angular/forms';
import { from, Observable, switchMap, tap } from 'rxjs';
import { ActionType } from '@activepieces/shared';
import { Artifact } from 'src/app/modules/flow-builder/model/artifact.interface';
import { CodeService } from 'src/app/modules/flow-builder/service/code.service';
import { CodeStepInputFormSchema } from '../input-forms-schema';

@Component({
	selector: 'app-code-step-input-form',
	templateUrl: './code-step-input-form.component.html',
	styleUrls: ['./code-step-input-form.component.scss'],
	providers: [
		{
			provide: NG_VALUE_ACCESSOR,
			multi: true,
			useExisting: CodeStepInputFormComponent,
		},
	],
})
export class CodeStepInputFormComponent implements ControlValueAccessor {
	codeStepForm: FormGroup<{ input: FormControl<Record<string, unknown>>; artifact: FormControl<Artifact> }>;
	_stepArtifact$: Observable<Artifact>;
	formValueChanged$: Observable<any>;
	obs$: Observable<any>;
	onChange = (value: CodeStepInputFormSchema) => {};
	onTouch = () => {};

	constructor(private formBuilder: FormBuilder, private codeService: CodeService) {
		this.codeStepForm = this.formBuilder.group({
			input: new FormControl({}, { nonNullable: true }),
			artifact: new FormControl({ content: '', package: '' }, { nonNullable: true }),
		});
		this.formValueChanged$ = this.codeStepForm.valueChanges.pipe(
			switchMap(formValue => {
				return CodeService.zipFile(formValue.artifact!);
			}),
			tap(zippedArtifact => {
				const zippedArtifactEncodedB64 = btoa(zippedArtifact);
				this.onChange({
					input: this.codeStepForm.value.input || {},
					artifactPackagedId: '',
					artifactSourceId: '',
					artifact: zippedArtifactEncodedB64,
					type: ActionType.CODE,
				});
			})
		);
	}

	writeValue(obj: CodeStepInputFormSchema): void {
		if (obj.type === ActionType.CODE) {
			if (obj.artifactSourceId) {
				this._stepArtifact$ = this.codeService
					.downloadAndReadFile(CodeService.constructFileUrl(obj.artifactSourceId))
					.pipe(
						tap(res => {
							this.codeStepForm.controls.artifact.setValue(res, { emitEvent: false });
						})
					);
			} else if (obj.artifact) {
				this._stepArtifact$ = from(this.codeService.readFile(atob(obj.artifact))).pipe(
					tap(res => {
						this.codeStepForm.controls.artifact.setValue(res, { emitEvent: false });
					})
				);
			}

			this.codeStepForm.controls.input.setValue(obj.input, { emitEvent: false });
			if (this.codeStepForm.disabled) {
				this.codeStepForm.disable();
			}
		}
	}
	registerOnChange(fn: any): void {
		this.onChange = fn;
	}
	registerOnTouched(fn: any): void {
		this.onTouch = fn;
	}
	setDisabledState?(isDisabled: boolean): void {
		if (isDisabled) {
			this.codeStepForm.disable();
		} else if (this.codeStepForm.disabled) {
			this.codeStepForm.enable();
		}
	}
}
