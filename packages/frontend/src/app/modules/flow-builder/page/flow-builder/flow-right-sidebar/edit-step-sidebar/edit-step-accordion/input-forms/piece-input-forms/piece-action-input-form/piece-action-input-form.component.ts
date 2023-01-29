import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import {
	ControlValueAccessor,
	UntypedFormBuilder,
	UntypedFormControl,
	UntypedFormGroup,
	NG_VALIDATORS,
	NG_VALUE_ACCESSOR,
	Validators,
} from '@angular/forms';

import { map, Observable, of, tap } from 'rxjs';
import { environment } from 'packages/frontend/src/environments/environment';
import { ActionMetaService } from 'packages/frontend/src/app/modules/flow-builder/service/action-meta.service';
import { fadeInUp400ms } from 'packages/frontend/src/app/modules/common/animation/fade-in-up.animation';
import { ComponentActionInputFormSchema } from '../../input-forms-schema';
import { DropdownItem } from 'packages/frontend/src/app/modules/common/model/dropdown-item.interface';
import { PieceConfig, propsConvertor } from 'packages/frontend/src/app/modules/common/components/configs-form/connector-action-or-config';
import { Config } from '@activepieces/shared';
declare type ActionDropdownOption = {
	label: {
		name: string;
		description: string;
	};
	value: { actionName: string; configs: PieceConfig[]; separator?: boolean };
	disabled?: boolean;
};

const CUSTOM_REQUEST_FORM_CONTROL_NAME = 'customRequest';
const ACTION_FORM_CONTROL_NAME = 'action';
const CONFIGS_FORM_CONTROL_NAME = 'configs';
@Component({
	selector: 'app-piece-action-input-form',
	templateUrl: './piece-action-input-form.component.html',
	styleUrls: ['./piece-action-input-form.component.scss'],
	providers: [
		{
			provide: NG_VALUE_ACCESSOR,
			multi: true,
			useExisting: PieceActionInputFormComponent,
		},
		{
			provide: NG_VALIDATORS,
			multi: true,
			useExisting: PieceActionInputFormComponent,
		},
	],
	animations: [fadeInUp400ms],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PieceActionInputFormComponent implements ControlValueAccessor {
	readonly ACTION_FORM_CONTROL_NAME = ACTION_FORM_CONTROL_NAME;
	readonly CUSTOM_REQUEST_FORM_CONTROL_NAME = CUSTOM_REQUEST_FORM_CONTROL_NAME;
	readonly CONFIGS_FORM_CONTROL_NAME = CONFIGS_FORM_CONTROL_NAME;
	componentForm: UntypedFormGroup;
	customRequestFeatureFlag = false;
	initialSetup$: Observable<ActionDropdownOption[]>;
	componentName: string;
	intialComponentInputFormValue: { actionName: string; input: { [key: string]: any } } | null;
	separatorItem: ActionDropdownOption = {
		label: {
			name: '',
			description: '',
		},
		value: { actionName: '', configs: [] as PieceConfig[], separator: true },
		disabled: true,
	};
	customRequestItem = {
		value: { actionName: 'CUSTOM_REQUEST', configs: [] as PieceConfig[] },
		label: { name: 'Custom Request', description: 'Sends authenticated request' },
		disabled: true,
	};
	selectedAction$: Observable<any>;
	actions$: Observable<ActionDropdownOption[]>;
	valueChanges$: Observable<void>;
	actionDropdownValueChanged$: Observable<{ actionName: string; configs: PieceConfig[] }>;
	onChange = (value: any) => { };
	onTouch = () => { };
	updateOrAddConfigModalClosed$: Observable<Config>;
	allAuthConfigs$: Observable<DropdownItem[]>;
	constructor(
		private fb: UntypedFormBuilder,
		private actionMetaDataService: ActionMetaService,
		private cd: ChangeDetectorRef
	) {
		this.customRequestFeatureFlag = environment.feature.customRequest;
		this.buildForm();
		this.actionDropdownValueChanged$ = this.componentForm.get(ACTION_FORM_CONTROL_NAME)!.valueChanges.pipe(
			tap(val => {
				this.actionSelectValueChanged(val);
			})
		);
	}

	customSearchFn(term: string, item: any) {
		const termLowerCase = term.toLowerCase();
		if (item.label === 'Custom Request') {
			return false;
		}
		const result =
			item.label.url.toLowerCase().indexOf(termLowerCase) > -1 ||
			item.label.summary.toLowerCase().indexOf(termLowerCase) > -1 ||
			item.label.description.toLowerCase().indexOf(termLowerCase) > -1 ||
			item.label.requestType.toLowerCase().indexOf(termLowerCase) > -1;
		return result;
	}

	private buildForm() {
		this.componentForm = this.fb.group({
			[ACTION_FORM_CONTROL_NAME]: new UntypedFormControl(null, Validators.required),
		});
		this.componentForm.markAllAsTouched();
		this.valueChanges$ = this.componentForm.valueChanges.pipe(
			tap(() => {
				this.onChange(this.getFormattedFormData());
			})
		);
	}

	fetchActions(pieceName: string) {
		const pieces$ = this.actionMetaDataService.getPieces().pipe(
			map(pieces => {
				const component = pieces.find(c => c.name === pieceName);
				if (!component) {
					throw new Error(`Activepieces- piece not found: ${pieceName}`);
				}
				return component;
			})
		);
		this.actions$ = pieces$.pipe(
			map(component => {
				const actionsKeys = Object.keys(component.actions);
				return actionsKeys.map(actionName => {
					const action = component.actions[actionName];
					const configs = Object.entries(action.props).map(keyEntry => {
						return propsConvertor.convertToFrontEndConfig(keyEntry[0], keyEntry[1]);
					});
					return {
						value: {
							actionName: actionName,
							configs: configs,
						},
						label: { name: action.displayName, description: action.description },
					};
				});
			}),
			map((actionDropdownItems: ActionDropdownOption[]) => {
				if (actionDropdownItems.length > 3) {
					return [...actionDropdownItems.slice(0, 3), this.separatorItem, ...actionDropdownItems.slice(3)];
				}
				return [...actionDropdownItems];
			})
		);
		this.initialSetup$ = this.actions$.pipe(
			tap(items => {
				if (this.intialComponentInputFormValue?.actionName === this.customRequestItem.value.actionName) {
					this.componentForm
						.get(ACTION_FORM_CONTROL_NAME)!
						.setValue(this.customRequestItem.value, { emitEvent: false });
					this.componentForm.addControl(
						CUSTOM_REQUEST_FORM_CONTROL_NAME,
						new UntypedFormControl(this.intialComponentInputFormValue.input),
						{ emitEvent: false }
					);
				} else if (this.intialComponentInputFormValue && this.intialComponentInputFormValue.actionName) {
					this.componentForm
						.get(ACTION_FORM_CONTROL_NAME)!
						.setValue(items.find(i => i.value.actionName === this.intialComponentInputFormValue?.actionName)?.value, {
							emitEvent: false,
						});
					this.selectedAction$ = of(
						items.find(it => it.value.actionName === this.intialComponentInputFormValue?.actionName)
					).pipe(
						tap(selectedAction => {
							if (selectedAction) {
								const configs = [...selectedAction.value.configs];
								const configsValues = this.intialComponentInputFormValue?.input;
								if (configsValues) {
									Object.keys(configsValues).forEach(key => {
										const config = configs.find(c => c.key === key);
										if (config) {
											config.value = configsValues[key];
										}
									});
								}
								this.componentForm.addControl(CONFIGS_FORM_CONTROL_NAME, new UntypedFormControl({ value: [...configs], disabled: this.componentForm.disabled }), {
									emitEvent: false
								});
								this.cd.detectChanges();
							}
						})
					);
				}
			})
		);
	}
	writeValue(obj: ComponentActionInputFormSchema): void {
		this.intialComponentInputFormValue = obj;
		this.componentName = obj.pieceName;
		this.componentForm.get(ACTION_FORM_CONTROL_NAME)?.setValue(undefined, { emitEvent: false });
		this.componentForm.removeControl(CONFIGS_FORM_CONTROL_NAME, { emitEvent: false });
		this.componentForm.removeControl(CUSTOM_REQUEST_FORM_CONTROL_NAME, { emitEvent: false });
		this.fetchActions(obj.pieceName);
	}

	removeDataControls() {
		const dataControlsNames = [CUSTOM_REQUEST_FORM_CONTROL_NAME];
		dataControlsNames.forEach(cn => {
			this.componentForm.removeControl(cn, { emitEvent: false });
		});
	}

	registerOnChange(fn: any): void {
		this.onChange = fn;
	}

	registerOnTouched(fn: any): void {
		this.onTouch = fn;
	}

	validate() {
		if (this.componentForm.valid) return null;
		return { invalid: true };
	}

	customRequestChosen() {
		this.componentForm.get(ACTION_FORM_CONTROL_NAME)!.setValue(this.customRequestItem.value);
	}

	actionSelectValueChanged(selectedActionValue: { actionName: string; configs: PieceConfig[] } | null) {
		if (selectedActionValue) {
			if (selectedActionValue.actionName === this.customRequestItem.value.actionName) {
				this.customRequestSelected();
			} else {
				this.actionSelected(selectedActionValue);
			}
			this.selectedAction$ = this.actions$.pipe(
				map(items => {
					return items.find(it => it.value.actionName === selectedActionValue.actionName);
				})
			);
		}
	}

	private actionSelected(selectedActionValue: { actionName: string; configs: PieceConfig[] }) {
		const configsForm = this.componentForm.get(CONFIGS_FORM_CONTROL_NAME);
		if (!configsForm) {
			this.componentForm.addControl(
				CONFIGS_FORM_CONTROL_NAME,
				new UntypedFormControl([...selectedActionValue.configs])
			);
		} else {
			configsForm.setValue([...selectedActionValue.configs]);
		}
		if (this.componentForm.get(CUSTOM_REQUEST_FORM_CONTROL_NAME)) {
			this.componentForm.removeControl(CUSTOM_REQUEST_FORM_CONTROL_NAME);
		}
		this.cd.detectChanges();
		this.componentForm.updateValueAndValidity();
	}

	private customRequestSelected() {
		if (this.componentForm.get(CONFIGS_FORM_CONTROL_NAME)) {
			this.componentForm.removeControl(CONFIGS_FORM_CONTROL_NAME);
		}
		const customRequestControl = this.componentForm.get(CUSTOM_REQUEST_FORM_CONTROL_NAME);
		if (!customRequestControl) {
			this.componentForm.addControl(CUSTOM_REQUEST_FORM_CONTROL_NAME, new UntypedFormControl({}));
		} else {
			customRequestControl.setValue({});
		}
	}

	getFormattedFormData(): { actionName: string; input: { [configKey: string]: any } } {
		const action = this.componentForm.get(ACTION_FORM_CONTROL_NAME)!.value;
		if (action === this.customRequestItem.value) {
			const customRequestData = this.componentForm.get(CUSTOM_REQUEST_FORM_CONTROL_NAME)?.value || {
				body: {},
				parameters: {},
				headers: {},
				endpoint: '',
			};

			return {
				actionName: this.customRequestItem.value.actionName,
				...customRequestData,
			};
		} else {
			const configs = this.componentForm.get(CONFIGS_FORM_CONTROL_NAME)?.value || {};
			const res = {
				actionName: action?.actionName,
				input: {
					...configs,
				},
			};
			return res;
		}
	}
	actionDropdownCompareFn(item, selected) {
		return item.actionName === selected.actionName;
	}
	setDisabledState?(isDisabled: boolean): void {

		if (isDisabled) {
			this.componentForm.disable();
		} else {
			this.componentForm.enable();
		}
	}
}
