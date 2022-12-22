import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import {
	ControlValueAccessor,
	FormBuilder,
	FormControl,
	FormGroup,
	NG_VALIDATORS,
	NG_VALUE_ACCESSOR,
	Validators,
} from '@angular/forms';

import { map, Observable, of, tap } from 'rxjs';
import { DropdownOption } from 'src/app/modules/common/model/dropdown-options';
import { environment } from 'src/environments/environment';
import { Config } from 'src/app/modules/common/model/fields/variable/config';
import { ActionMetaService } from 'src/app/modules/flow-builder/service/action-meta.service';
import {
	ComponnentConfigsForActionsOrTriggers,
	FrontEndConnectorConfig,
} from 'src/app/modules/common/components/configs-form/connector-action-or-config';
import { fadeInUp400ms } from 'src/app/modules/common/animation/fade-in-up.animation';
import { ComponentActionInputFormSchema } from '../../input-forms-schema';
declare type ActionDropdownOption = {
	label: {
		name: string;
		description: string;
	};
	value: { actionName: string; configs: FrontEndConnectorConfig[]; separator?: boolean };
	disabled?: boolean;
};

const CUSTOM_REQUEST_FORM_CONTROL_NAME = 'customRequest';
const ACTION_FORM_CONTROL_NAME = 'action';
const CONFIGS_FORM_CONTROL_NAME = 'configs';
@Component({
	selector: 'app-component-action-input-form',
	templateUrl: './component-action-input-form.component.html',
	styleUrls: ['./component-action-input-form.component.scss'],
	providers: [
		{
			provide: NG_VALUE_ACCESSOR,
			multi: true,
			useExisting: ComponentActionInputFormComponent,
		},
		{
			provide: NG_VALIDATORS,
			multi: true,
			useExisting: ComponentActionInputFormComponent,
		},
	],
	animations: [fadeInUp400ms],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ComponentActionInputFormComponent implements ControlValueAccessor {
	readonly ACTION_FORM_CONTROL_NAME = ACTION_FORM_CONTROL_NAME;
	readonly CUSTOM_REQUEST_FORM_CONTROL_NAME = CUSTOM_REQUEST_FORM_CONTROL_NAME;
	readonly CONFIGS_FORM_CONTROL_NAME = CONFIGS_FORM_CONTROL_NAME;
	componentForm: FormGroup;
	customRequestFeatureFlag = false;
	initialSetup$: Observable<ActionDropdownOption[]>;
	componentName: string;
	intialComponentInputFormValue: { action_name: string; input: { [key: string]: any } } | null;
	customRequestItem = {
		value: { actionName: 'CUSTOM_REQUEST', configs: [] as FrontEndConnectorConfig[] },
		label: { name: 'Custom Request', description: 'Sends authenticated request' },
		disabled: true,
	};
	separatorItem: ActionDropdownOption = {
		label: {
			name: '',
			description: '',
		},
		value: { actionName: '', configs: [] as FrontEndConnectorConfig[], separator: true },
		disabled: true,
	};
	selectedAction$: Observable<any>;
	actions$: Observable<ActionDropdownOption[]>;
	valueChanges$: Observable<void>;
	actionDropdownValueChanged$: Observable<{ actionName: string; configs: FrontEndConnectorConfig[] }>;
	onChange = (value: any) => {};
	onTouch = () => {};
	updateOrAddConfigModalClosed$: Observable<Config>;
	allAuthConfigs$: Observable<DropdownOption[]>;
	constructor(
		private fb: FormBuilder,
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
			[ACTION_FORM_CONTROL_NAME]: new FormControl(null, Validators.required),
		});
		this.valueChanges$ = this.componentForm.valueChanges.pipe(
			tap(() => {
				this.onChange(this.getFormattedFormData());
			})
		);
	}

	fetchActions(componentName: string) {
		const component$ = this.actionMetaDataService.connectorComponents().pipe(
			map(comps => {
				const component = comps.find(c => c.name === componentName);
				if (!component) {
					throw new Error(`Activepieces- component not found: ${componentName}`);
				}
				return component;
			})
		);
		this.actions$ = component$.pipe(
			map(component => {
				const actionsKeys = Object.keys(component.actions);
				return actionsKeys.map(actionName => {
					const action = component.actions[actionName];
					return {
						value: {
							actionName: action.name,
							configs: action.configs.map(c => ComponnentConfigsForActionsOrTriggers.convertToFrontEndConfig(c)),
						},
						label: { name: action.name, description: action.description },
					};
				});
			}),
			map((actionDropdownItems: ActionDropdownOption[]) => {
				if (actionDropdownItems.length > 3) {
					return [
						this.customRequestItem,
						...actionDropdownItems.slice(0, 3),
						this.separatorItem,
						...actionDropdownItems.slice(3),
					];
				}
				return [this.customRequestItem, ...actionDropdownItems];
			})
		);
		this.initialSetup$ = this.actions$.pipe(
			tap(items => {
				if (this.intialComponentInputFormValue?.action_name === this.customRequestItem.value.actionName) {
					this.componentForm
						.get(ACTION_FORM_CONTROL_NAME)!
						.setValue(this.customRequestItem.value, { emitEvent: false });
					this.componentForm.addControl(
						CUSTOM_REQUEST_FORM_CONTROL_NAME,
						new FormControl(this.intialComponentInputFormValue.input),
						{ emitEvent: false }
					);
				} else if (this.intialComponentInputFormValue && this.intialComponentInputFormValue.action_name) {
					this.componentForm
						.get(ACTION_FORM_CONTROL_NAME)!
						.setValue(items.find(i => i.value.actionName === this.intialComponentInputFormValue?.action_name)?.value, {
							emitEvent: false,
						});
					this.selectedAction$ = of(
						items.find(it => it.value.actionName === this.intialComponentInputFormValue?.action_name)
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
								this.componentForm.addControl(CONFIGS_FORM_CONTROL_NAME, new FormControl([...configs]), {
									emitEvent: false,
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
		this.componentName = obj.component_name;
		this.componentForm.get(ACTION_FORM_CONTROL_NAME)?.setValue(undefined, { emitEvent: false });
		this.componentForm.removeControl(CONFIGS_FORM_CONTROL_NAME, { emitEvent: false });
		this.componentForm.removeControl(CUSTOM_REQUEST_FORM_CONTROL_NAME, { emitEvent: false });
		this.fetchActions(obj.component_name);
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

	actionSelectValueChanged(selectedActionValue: { actionName: string; configs: FrontEndConnectorConfig[] } | null) {
		if (selectedActionValue) {
			if (selectedActionValue.actionName === this.customRequestItem.value.actionName) {
				this.customRequestSelected();
			} else {
				this.actionSelected(selectedActionValue);
			}
			this.selectedAction$ = this.actions$.pipe(
				map(items => {
					console.log(items.find(it => it.value.actionName === selectedActionValue.actionName));
					return items.find(it => it.value.actionName === selectedActionValue.actionName);
				})
			);
		}
	}

	private actionSelected(selectedActionValue: { actionName: string; configs: FrontEndConnectorConfig[] }) {
		const configsForm = this.componentForm.get(CONFIGS_FORM_CONTROL_NAME);
		if (!configsForm) {
			this.componentForm.addControl(CONFIGS_FORM_CONTROL_NAME, new FormControl([...selectedActionValue.configs]));
		} else {
			configsForm.setValue([...selectedActionValue.configs]);
		}
		if (this.componentForm.get(CUSTOM_REQUEST_FORM_CONTROL_NAME)) {
			this.componentForm.removeControl(CUSTOM_REQUEST_FORM_CONTROL_NAME);
		}
	}

	private customRequestSelected() {
		if (this.componentForm.get(CONFIGS_FORM_CONTROL_NAME)) {
			this.componentForm.removeControl(CONFIGS_FORM_CONTROL_NAME);
		}
		const customRequestControl = this.componentForm.get(CUSTOM_REQUEST_FORM_CONTROL_NAME);
		if (!customRequestControl) {
			this.componentForm.addControl(CUSTOM_REQUEST_FORM_CONTROL_NAME, new FormControl({}));
		} else {
			customRequestControl.setValue({});
		}
	}

	getFormattedFormData(): { action_name: string; input: { [configKey: string]: any } } {
		const action = this.componentForm.get(ACTION_FORM_CONTROL_NAME)!.value;
		if (action === this.customRequestItem.value) {
			const customRequestData = this.componentForm.get(CUSTOM_REQUEST_FORM_CONTROL_NAME)?.value || {
				body: {},
				parameters: {},
				headers: {},
				endpoint: '',
			};

			return {
				action_name: this.customRequestItem.value.actionName,
				...customRequestData,
			};
		} else {
			const configs = this.componentForm.get(CONFIGS_FORM_CONTROL_NAME)?.value || {};
			const res = {
				action_name: action?.actionName,
				input: {
					...configs,
				},
			};
			console.log(res);
			return res;
		}
	}
	actionDropdownCompareFn(item, selected) {
		return item.value.actionName === selected.actionName;
	}
	setDisabledState?(isDisabled: boolean): void {
		if (isDisabled) {
			this.componentForm.disable();
		} else {
			this.componentForm.enable();
		}
	}
}
