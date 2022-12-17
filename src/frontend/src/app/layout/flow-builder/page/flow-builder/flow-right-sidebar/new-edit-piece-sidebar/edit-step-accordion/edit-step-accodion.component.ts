import { AfterViewInit, ChangeDetectorRef, Component, Input } from '@angular/core';

import { delay, map, Observable, of, skipWhile, Subject, takeUntil, tap } from 'rxjs';
import { faInfoCircle } from '@fortawesome/free-solid-svg-icons';

import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { faChevronDown } from '@fortawesome/free-solid-svg-icons/faChevronDown';
import { Store } from '@ngrx/store';
import { FlowsActions } from 'src/app/layout/flow-builder/store/action/flows.action';
import { ActionType } from 'src/app/layout/common-layout/model/enum/action-type.enum';
import { StepCacheKey } from 'src/app/layout/flow-builder/service/artifact-cache-key';
import { FlowItem } from 'src/app/layout/common-layout/model/flow-builder/flow-item';
import { Artifact } from 'src/app/layout/flow-builder/model/artifact.interface';
import { CodeService } from 'src/app/layout/flow-builder/service/code.service';
import { TriggerType } from 'src/app/layout/common-layout/model/enum/trigger-type.enum';
import { BuilderSelectors } from 'src/app/layout/flow-builder/store/selector/flow-builder.selector';

@Component({
	selector: 'app-edit-step-accodion',
	templateUrl: './edit-step-accodion.component.html',
	styleUrls: ['./edit-step-accodion.component.scss'],
})
export class EditStepAccordionComponent implements AfterViewInit {
	codeArtifact$: Observable<Artifact> | null;
	stepCacheKey: StepCacheKey | null;
	autoSaveListener$: Observable<{
		describe: { displayName: string; name: string };
		input: any;
	}>;
	readOnly$: Observable<boolean> = of(false);
	cancelAutoSaveListener$: Subject<boolean> = new Subject();
	_selectedStep: FlowItem;
	stepForm: FormGroup;
	openedIndex = 1;
	faChevornDown = faChevronDown;
	faInfoCircle = faInfoCircle;
	webhookUrl$: Observable<string>;

	//delayExpansionPanelRendering$ is an observable that fixes an issue with angular material's accordions rendering content even though they are closed
	delayExpansionPanelRendering$: Observable<boolean>;
	displayNameChangedListener$: Observable<string>;
	ActionType = ActionType;
	TriggerType = TriggerType;
	@Input() displayNameChanged$: Subject<string>;

	@Input() set stepArtifactCacheKeyAndUrl(urlAndCacheKey: { cacheKey: StepCacheKey; url: string } | null) {
		if (urlAndCacheKey) {
			this.codeArtifact$ = this.codeService.getOrCreateStepArtifact(urlAndCacheKey.cacheKey, urlAndCacheKey.url);
			this.stepCacheKey = urlAndCacheKey.cacheKey;
		} else {
			this.codeArtifact$ = null;
			this.stepCacheKey = null;
		}
	}
	@Input() set selectedStep(step: FlowItem) {
		this._selectedStep = step;
		this.cancelAutoSaveListener$.next(true);
		this.updateFormValue(step);
		this.setAutoSaveListener();
		this.setDiplayNameListener();
	}

	constructor(
		private formBuilder: FormBuilder,
		private cd: ChangeDetectorRef,
		private store: Store,
		private codeService: CodeService
	) {
		this.webhookUrl$ = this.store.select(BuilderSelectors.selectCurrentFlowWebhookUrl);
		this.readOnly$ = this.store.select(BuilderSelectors.selectReadOnly).pipe(
			tap(readOnly => {
				if (readOnly) {
					console.log('readonly');
					this.stepForm.disable();
				} else if (!this.stepForm.enabled) {
					this.stepForm.enable();
				}
			})
		);
		this.stepForm = this.formBuilder.group({
			describe: new FormControl({ value: { name: '', displayName: '' } }),
			input: new FormControl({}),
		});
	}
	ngAfterViewInit(): void {
		const expansionAnimationDuration = 500;
		this.delayExpansionPanelRendering$ = of(true).pipe(delay(expansionAnimationDuration));
	}

	setOpenedIndex(index: number) {
		this.openedIndex = index;
		this.cd.detectChanges();
	}

	closed(index: number) {
		if (this.openedIndex == index) {
			this.openedIndex = -1;
		}
	}
	updateFormValue(stepSelected: FlowItem) {
		const describeControl = this.stepForm.get('describe')!;
		describeControl.setValue({
			displayName: stepSelected.display_name,
			name: stepSelected.name,
		});
		const inputControl = this.stepForm.get('input')!;
		const settings = stepSelected.settings;
		inputControl.setValue({ ...settings, type: stepSelected.type });
	}

	setAutoSaveListener() {
		this.autoSaveListener$ = this.stepForm.valueChanges.pipe(
			takeUntil(this.cancelAutoSaveListener$),
			skipWhile(() => this.stepForm.disabled),
			tap(() => {
				this.store.dispatch(
					FlowsActions.updateStep({
						stepName: this._selectedStep.name,
						newStep: this.prepareStepDataToSave(),
					})
				);
			})
		);
	}
	setDiplayNameListener() {
		this.displayNameChangedListener$ = this.stepForm.get('describe')!.valueChanges.pipe(
			takeUntil(this.cancelAutoSaveListener$),
			map(describeFormValue => {
				return describeFormValue.displayName;
			}),
			tap(displayName => {
				this.displayNameChanged$.next(displayName);
			})
		);
	}

	prepareStepDataToSave() {
		const describeControlValue: { displayName: string; name: string } = this.stepForm.get('describe')!.value;
		const inputControlValue = this.stepForm.get('input')!.value;
		const stepToSave: FlowItem = JSON.parse(JSON.stringify(this._selectedStep));
		stepToSave.display_name = describeControlValue.displayName;
		stepToSave.settings = inputControlValue;
		stepToSave.name = this._selectedStep.name;

		if (this._selectedStep.type === ActionType.COMPONENT) {

			const componentSettings = {
				...this._selectedStep.settings,
				...inputControlValue,
			};
			stepToSave.settings = componentSettings;
		}
		stepToSave.valid = this.stepForm.valid;
		delete stepToSave.settings.artifact;
		return stepToSave;
	}
}
