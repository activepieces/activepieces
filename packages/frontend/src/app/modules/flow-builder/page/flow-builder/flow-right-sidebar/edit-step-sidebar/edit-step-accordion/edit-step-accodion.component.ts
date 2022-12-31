import { AfterViewInit, ChangeDetectorRef, Component, Input } from '@angular/core';

import { delay, map, Observable, of, skipWhile, Subject, takeUntil, tap } from 'rxjs';
import { faInfoCircle } from '@fortawesome/free-solid-svg-icons';

import { UntypedFormBuilder, UntypedFormControl, UntypedFormGroup } from '@angular/forms';
import { faChevronDown } from '@fortawesome/free-solid-svg-icons/faChevronDown';
import { Store } from '@ngrx/store';
import { FlowItem } from 'src/app/modules/common/model/flow-builder/flow-item';
import { BuilderSelectors } from 'src/app/modules/flow-builder/store/selector/flow-builder.selector';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActionType, TriggerType, UpdateActionRequest } from 'shared';
import { FlowsActions } from 'src/app/modules/flow-builder/store/action/flows.action';

@Component({
	selector: 'app-edit-step-accodion',
	templateUrl: './edit-step-accodion.component.html',
	styleUrls: ['./edit-step-accodion.component.scss'],
})
export class EditStepAccordionComponent implements AfterViewInit {
	autoSaveListener$: Observable<{
		describe: { displayName: string; name: string };
		input: any;
	}>;
	readOnly$: Observable<boolean> = of(false);
	cancelAutoSaveListener$: Subject<boolean> = new Subject();
	_selectedStep: FlowItem;
	stepForm: UntypedFormGroup;
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


	@Input() set selectedStep(step: FlowItem) {
		this._selectedStep = step;
		this.cancelAutoSaveListener$.next(true);
		this.updateFormValue(step);
		this.setAutoSaveListener();
		this.setDiplayNameListener();
	}

	constructor(
		private formBuilder: UntypedFormBuilder,
		private cd: ChangeDetectorRef,
		private store: Store,
		private snackbar: MatSnackBar
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
			describe: new UntypedFormControl({ value: { name: '', displayName: '' } }),
			input: new UntypedFormControl({}),
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
			displayName: stepSelected.displayName,
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
					FlowsActions.updateAction({
						operation: this.prepareStepDataToSave(),
					})
				);
			})
		);
	}

	prepareStepDataToSave(): UpdateActionRequest {
		const describeControlValue: { displayName: string; name: string } = this.stepForm.get('describe')!.value;
		const inputControlValue = this.stepForm.get('input')!.value;
		const stepToSave: UpdateActionRequest = JSON.parse(JSON.stringify(this._selectedStep));
		stepToSave.displayName = describeControlValue.displayName;
		stepToSave.settings = inputControlValue;
		stepToSave.name = this._selectedStep.name;

		if (this._selectedStep.type === ActionType.PIECE || this._selectedStep.type === TriggerType.PIECE) {
			const componentSettings = {
				...this._selectedStep.settings,
				...inputControlValue,
			};
			stepToSave.settings = componentSettings;
		}
		return stepToSave;
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

	copyUrl(url: string) {
		navigator.clipboard.writeText(url);
		this.snackbar.open('Webhook url copied to clipboard');
	}
}
