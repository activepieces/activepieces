import { Component, Input } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormGroup, FormBuilder, FormControl } from '@angular/forms';
import { Observable, Subject, takeUntil, tap } from 'rxjs';
import { ActionType } from 'src/app/modules/common/model/enum/action-type.enum';
import { Artifact } from 'src/app/modules/flow-builder/model/artifact.interface';
import { StepCacheKey } from 'src/app/modules/flow-builder/service/artifact-cache-key';
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
	codeStepForm: FormGroup<{ input: FormControl<string>; artifact: FormControl<Artifact> }>;
	_stepArtifact$: Observable<Artifact>;
	inputControlValueChanged$: Observable<any>;
	artifactControlValueChanged$: Observable<any>;
	stepArtifactChanged$: Subject<boolean> = new Subject();
	@Input()
	stepCacheKey: StepCacheKey;
	@Input()
	set stepArtifact$(artifact$: Observable<Artifact>) {
		this._stepArtifact$ = artifact$.pipe(
			tap(artifact => {
				this.stepArtifactChanged$.next(true);
				const artifactControl = this.codeStepForm.controls.artifact;
				artifactControl.setValue(artifact);
				this.artifactControlValueChanged$ = artifactControl.valueChanges.pipe(
					takeUntil(this.stepArtifactChanged$),
					tap(() => {
						const parametersControlValue = this.codeStepForm.controls.input.value;
						this.onChange({ input: parametersControlValue });
					})
				);
			})
		);
	}

	onChange = (value: CodeStepInputFormSchema) => {};
	onTouch = () => {};

	constructor(private formBuilder: FormBuilder) {
		this.codeStepForm = this.formBuilder.group({
			input: new FormControl('', { nonNullable: true }),
			artifact: new FormControl({ content: '', package: '' }, { nonNullable: true }),
		});
		this.inputControlValueChanged$ = this.codeStepForm.controls.input.valueChanges.pipe(
			tap(parametersControlValue => {
				this.onChange({ input: parametersControlValue });
			})
		);
	}

	writeValue(obj: CodeStepInputFormSchema): void {
		if (obj.type === ActionType.CODE) {
			this.codeStepForm.patchValue(obj);
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
