import { Component, Input, OnInit } from '@angular/core';
import { ControlValueAccessor, FormBuilder, FormControl, FormGroup, NG_VALUE_ACCESSOR } from '@angular/forms';
import { BsModalService } from 'ngx-bootstrap/modal';
import { debounceTime, distinctUntilChanged, Observable, Subject, takeUntil, tap } from 'rxjs';
import { Artifact } from 'src/app/layout/flow-builder/model/artifact.interface';
import {
	ArtifactCacheKey,

	StepCacheKey,
} from 'src/app/layout/flow-builder/service/artifact-cache-key';
import { CodeService } from 'src/app/layout/flow-builder/service/code.service';
import { cacheArtifactDebounceTime } from '../../../utils';
import { CodeArtifactControlFullscreenComponent } from './code-artifact-control-fullscreen/code-artifact-control-fullscreen.component';

@Component({
	selector: 'app-code-artifact-form-control',
	templateUrl: './code-artifact-form-control.component.html',
	styleUrls: ['./code-artifact-form-control.component.css'],
	providers: [
		{
			provide: NG_VALUE_ACCESSOR,
			multi: true,
			useExisting: CodeArtifactFormControlComponent,
		},
	],
})
export class CodeArtifactFormControlComponent implements ControlValueAccessor, OnInit {
	_artifactCacheKey: ArtifactCacheKey;
	@Input() autosave = true;
	@Input() set artifactCacheKey(key: ArtifactCacheKey) {
		this._artifactCacheKey = key;
		if (key) this.setupCachingAndAutoSaveListener();
	}
	@Input() artifactChanged$: Subject<boolean> = new Subject();
	codeArtifactForm: FormGroup;
	codeEditorOptions = { lineNumbers: true, lineWrapping: true, theme: 'lucario', readOnly: '', mode: 'javascript' };
	constructor(
		private formBuilder: FormBuilder,
		private modalService: BsModalService,
		private codeService: CodeService
	) {
		this.codeArtifactForm = this.formBuilder.group({ content: new FormControl(''), package: new FormControl('') });
	}
	ngOnInit(): void {
		if (!this.autosave) {
			this.setupValueListener();
		}
	}
	setDisabledState?(isDisabled: boolean): void {
		if (isDisabled) {
			this.codeArtifactForm.disable();
			this.codeEditorOptions.readOnly = 'nocursor';
		}
	}
	updateComponentValue$: Observable<any>;
	onChange = val => {};
	onTouched = () => {};

	writeValue(artifact: Artifact): void {
		if (artifact && (artifact.content || artifact.package)) {
			this.codeArtifactForm.patchValue(artifact);
		}
	}

	registerOnChange(change: any): void {
		this.onChange = change;
	}
	registerOnTouched(touched: any): void {
		this.onTouched = touched;
	}
	showFullscreenEditor() {
		this.modalService.show<CodeArtifactControlFullscreenComponent>(CodeArtifactControlFullscreenComponent, {
			class: 'modal-fullscreen',
			ignoreBackdropClick: false,
			initialState: {
				codeFilesForm: this.codeArtifactForm,
				readOnly: this.codeEditorOptions.readOnly === 'nocursor',
			},
		});
	}

	setupValueListener() {
		this.updateComponentValue$ = this.codeArtifactForm.valueChanges.pipe(
			tap(artifact => {
				this.onChange(artifact);
			})
		);
	}
	setupCachingAndAutoSaveListener() {
		this.updateComponentValue$ = this.codeArtifactForm.valueChanges.pipe(
			takeUntil(this.artifactChanged$),
			debounceTime(cacheArtifactDebounceTime),
			distinctUntilChanged((prev, current) => {
				return prev.content == current.content && prev.package == current.package;
			}),
			tap(artifact => {
				// Make sure to mark update artifact as dirty before on change
				if (this.autosave) this.updateArtifactCache();
				//OnChange triggers auto saving.
				this.onChange(artifact);
			})
		);
	}
	updateArtifactCache() {
		//The only valid case in this is the step cache key
		if (this._artifactCacheKey) {
			if (this._artifactCacheKey instanceof StepCacheKey) {
				this.codeService.updateArtifactInFlowStepsCache(this._artifactCacheKey, this.codeArtifactForm.value);
			} else {
				throw new Error('Cache key type has no corresponding cache');
			}
		}
	}
}
