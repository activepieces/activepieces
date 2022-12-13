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
import { fadeInUp400ms } from '../../../../../../../../common-layout/animation/fade-in-up.animation';
import { ComponentInputFormSchema } from '../input-forms-schema';
import { map, mapTo, Observable, of, take, tap } from 'rxjs';
import { BuilderSelectors } from 'src/app/layout/flow-builder/store/selector/flow-builder.selector';
import { Store } from '@ngrx/store';
import { BsModalService } from 'ngx-bootstrap/modal';
import { DropdownOption } from 'src/app/layout/common-layout/model/dynamic-controls/dropdown-options';
import { ComponentFormOutput } from './component-input-form-output';
import { environment } from 'src/environments/environment';
import {
	ComponnentConfigsForActionsOrTriggers,
	FrontEndConnectorConfig,
	HttpMethod,
} from 'src/app/layout/common-layout/components/configs-form/configs-form-for-connectors/connector-action-or-config';
import { apps } from '@activepieces/components';
import { CreateEditConfigModalComponent } from '../../../../../flow-left-sidebar/create-or-edit-config-modal/create-or-edit-config-modal.component';
import { Config } from 'src/app/layout/common-layout/model/fields/variable/config';
import { ConfigType } from 'src/app/layout/common-layout/model/enum/config-type';
declare type ActionDropdownOption = {
	label:
		| {
				requestType: HttpMethod;
				url: string;
				summary?: string;
				description: string;
		  }
		| string;
	value: { actionName: string; configs: FrontEndConnectorConfig[]; separator?: boolean };
	disabled?: boolean;
};

export declare type AuthConfigDropdownValue = {
	configInterpolation: string;
	accessToken: string;
};
const CUSTOM_REQUEST_FORM_CONTROL_NAME = 'customRequest';
const OPTIONAL_CONFIGS_FORM_CONTROL_NAME = 'optionalConfigs';
const REQUIRED_CONFIGS_FORM_CONTROL_NAME = 'requiredConfigs';
const ACTION_FORM_CONTROL_NAME = 'action';
const SECURITY_FORM_CONTROL_NAME = 'security';
@Component({
	selector: 'app-component-input-form',
	templateUrl: './component-input-form.component.html',
	styleUrls: ['./component-input-form.component.scss'],
	providers: [
		{
			provide: NG_VALUE_ACCESSOR,
			multi: true,
			useExisting: ComponentInputFormComponent,
		},
		{
			provide: NG_VALIDATORS,
			multi: true,
			useExisting: ComponentInputFormComponent,
		},
	],
	animations: [fadeInUp400ms],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ComponentInputFormComponent implements ControlValueAccessor {
	customRequestFeatureFlag = false;
	initialSetup$: Observable<ActionDropdownOption[]>;
	optionalConfigsMenuOpened = false;
	requiredConfigs: { configs: FrontEndConnectorConfig[]; triggerChangeDetection: boolean } = {
		configs: [],
		triggerChangeDetection: false,
	};
	optionalConfigsSelected: { configs: FrontEndConnectorConfig[]; triggerChangeDetection: boolean } = {
		configs: [],
		triggerChangeDetection: false,
	};
	allOptionalConfigs: FrontEndConnectorConfig[] = [];
	componentName: string;
	intialComponentInputFormValue: { action_name: string; input: { action: { [key: string]: any } } } | null;
	customRequestItem = {
		value: { actionName: 'CUSTOM_REQUEST', configs: [] as FrontEndConnectorConfig[] },
		label: 'Custom Request',
		disabled: true,
	};
	separatorItem = {
		label: {
			requestType: HttpMethod.HEAD,
			url: '',
			summary: '',
			description: '',
		},
		value: { actionName: '', configs: [] as FrontEndConnectorConfig[], separator: true },
		disabled: true,
	};
	selectedAction$: Observable<any>;
	configs: FrontEndConnectorConfig[] = [];
	items = [];
	actions$: Observable<ActionDropdownOption[]>;
	componentForm: FormGroup;
	valueChanges$: Observable<void>;
	actionDropdownValueChanged$: Observable<{ actionName: string; configs: FrontEndConnectorConfig[] }>;
	updateAuthConfig$: Observable<{ indexInList: number; config: FrontEndConnectorConfig } | undefined>;
	setInitiallySelectedAuthConfig$: Observable<void>;
	onChange = (value: any) => {};
	onTouch = () => {};
	authenticationDropdownCompareWithFunction = (
		a: { label: string; value: AuthConfigDropdownValue },
		formControlValue: AuthConfigDropdownValue
	) => {
		return JSON.stringify(formControlValue) === JSON.stringify(a.value);
	};
	newAuthConfigAdded$: Observable<Config>;
	allAuthConfigs$: Observable<DropdownOption[]>;
	constructor(
		private fb: FormBuilder,
		private store: Store,
		private modalService: BsModalService,
		private cd: ChangeDetectorRef
	) {
		this.customRequestFeatureFlag = environment.feature.customRequest;
		this.buildForm();
		this.actionDropdownValueChanged$ = this.componentForm.get(ACTION_FORM_CONTROL_NAME)!.valueChanges.pipe(
			tap(val => {
				this.actionSelectValueChanged(val);
			})
		);
		this.allAuthConfigs$ = this.store.select(BuilderSelectors.selectAuthConfigsDropdownOptions).pipe(tap(console.log));
		this.modalService;
	}

	editSelectedAuthConfig() {
		const selectedValue: AuthConfigDropdownValue = this.componentForm.get(SECURITY_FORM_CONTROL_NAME)!.value;
		const configKey = selectedValue.configInterpolation.split('.')[1].replace('}', '');
		this.updateAuthConfig$ = this.store.select(BuilderSelectors.selectConfig(configKey)).pipe(
			take(1),
			tap(configAndIndex => {
				if (configAndIndex) {
					this.modalService.show(CreateEditConfigModalComponent, {
						ignoreBackdropClick: true,
						class: 'modal-dialog-centered',
						initialState: {
							configIndexInConfigsList: configAndIndex.indexInList,
							configToUpdate: configAndIndex.config,
						},
					});
				}
			}),
			mapTo(void 0)
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
			action: new FormControl(null, Validators.required),
			security: new FormControl(null, Validators.required),
		});
		this.valueChanges$ = this.componentForm.valueChanges.pipe(
			tap(() => {
				this.onChange(this.getFormattedFormData());
			})
		);
	}

	fetchActions(componentName: string, accessToken: string) {
		const component = apps.find(app => app.name === componentName);
		if (!component) throw new Error(`Activepieces- component with name ${componentName} is not found`);
		this.actions$ = of(component).pipe(
			map(component => {
				const actionsKeys = Object.keys(component.actions);

				return actionsKeys.map(actionName => {
					const action = component.actions[actionName];
					return {
						value: {
							actionName: action.name,
							configs: action.configs.map(c =>
								ComponnentConfigsForActionsOrTriggers.convertToFrontEndConfig(c, accessToken)
							),
						},
						label: { requestType: action.httpMethod, url: action.url, description: action.description },
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
					this.componentForm
						.get(CUSTOM_REQUEST_FORM_CONTROL_NAME)!
						.setValue(this.intialComponentInputFormValue.input.action, { emitEvent: false });
				} else if (this.intialComponentInputFormValue) {
					this.componentForm
						.get(ACTION_FORM_CONTROL_NAME)!
						.setValue(items.find(i => i.value.actionName === this.intialComponentInputFormValue?.action_name)?.value, {
							emitEvent: false,
						});

					this.selectedAction$ = of(
						items.find(it => it.value.actionName === this.intialComponentInputFormValue?.action_name)
					);
				}
			}),
			tap(items => {
				const optionalConfigsControl = this.componentForm.get(OPTIONAL_CONFIGS_FORM_CONTROL_NAME);
				const requiredConfigs = this.componentForm.get(REQUIRED_CONFIGS_FORM_CONTROL_NAME);
				if (requiredConfigs && optionalConfigsControl && this.intialComponentInputFormValue?.action_name) {
					const selectedAction = items.find(
						i => i.value?.actionName === this.intialComponentInputFormValue?.action_name
					)!;
					const optionalConfigsKeys = Object.keys(
						this.intialComponentInputFormValue.input.action[OPTIONAL_CONFIGS_FORM_CONTROL_NAME]
					);
					this.optionalConfigsSelected = {
						configs: selectedAction.value.configs
							.filter(c => optionalConfigsKeys.includes(c.key))
							.map(c => {
								return {
									...c,
									value: this.intialComponentInputFormValue?.input.action[OPTIONAL_CONFIGS_FORM_CONTROL_NAME][c.key],
								};
							}),

						triggerChangeDetection: false,
					};
					this.allOptionalConfigs = [...selectedAction.value.configs.filter(c => !c.required)];
					this.requiredConfigs = {
						configs: [...selectedAction.value.configs.filter(c => c.required)],
						triggerChangeDetection: false,
					};
					//security + optionalConfigs + requiredConfigs
					this.componentForm.patchValue(this.intialComponentInputFormValue.input.action, { emitEvent: false });
				}
				this.setInitiallySelectedAuthConfig$ = this.store
					.select(BuilderSelectors.selectAuthConfigsDropdownOptions)
					.pipe(
						take(1),
						tap(res => {
							debugger;
							const selectedAuthConfig = res.find(
								c =>
									c.value.configInterpolation ===
									this.intialComponentInputFormValue?.input.action[SECURITY_FORM_CONTROL_NAME]
							);
							this.componentForm.get(SECURITY_FORM_CONTROL_NAME)!.setValue(selectedAuthConfig?.value);
						}),
						mapTo(void 0)
					);
				this.cd.detectChanges();
			})
		);
	}
	writeValue(obj: ComponentInputFormSchema): void {
		this.intialComponentInputFormValue = obj;
		if (obj.input && obj.action_name) {
			this.componentForm.get(ACTION_FORM_CONTROL_NAME)!.setValue(undefined, { emitEvent: false });
			this.initialActionDropdownSetup(obj);
			this.fetchActions(obj.component_name, obj.input.action[SECURITY_FORM_CONTROL_NAME]);
		} else if (obj.component_name) {
			this.componentForm.get(ACTION_FORM_CONTROL_NAME)!.setValue(undefined, { emitEvent: false });
			this.removeDataControls();
			this.fetchActions(obj.component_name, '');
		}
		this.selectedAction$ = of(null);
	}

	removeDataControls() {
		const dataControlsNames = [
			OPTIONAL_CONFIGS_FORM_CONTROL_NAME,
			REQUIRED_CONFIGS_FORM_CONTROL_NAME,
			CUSTOM_REQUEST_FORM_CONTROL_NAME,
		];
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
		this.allOptionalConfigs = [...selectedActionValue.configs.filter(c => !c.required)];
		this.requiredConfigs = {
			configs: [...selectedActionValue.configs.filter(c => c.required)],
			triggerChangeDetection: false,
		};
		this.optionalConfigsSelected = {
			configs: [],
			triggerChangeDetection: false,
		};
		if (
			!this.componentForm.get(OPTIONAL_CONFIGS_FORM_CONTROL_NAME) &&
			!this.componentForm.get(REQUIRED_CONFIGS_FORM_CONTROL_NAME)
		) {
			this.componentForm.addControl(OPTIONAL_CONFIGS_FORM_CONTROL_NAME, new FormControl({}));
			this.componentForm.addControl(REQUIRED_CONFIGS_FORM_CONTROL_NAME, new FormControl({}));
			if (this.componentForm.get(CUSTOM_REQUEST_FORM_CONTROL_NAME)) {
				this.componentForm.removeControl(CUSTOM_REQUEST_FORM_CONTROL_NAME);
			}
		} else {
			this.componentForm.get(OPTIONAL_CONFIGS_FORM_CONTROL_NAME)?.setValue({});
			const requiredConfigsInitialValue = {};
			this.requiredConfigs.configs.forEach(c => {
				requiredConfigsInitialValue[c.key] = c.value;
			});
			this.componentForm.get(REQUIRED_CONFIGS_FORM_CONTROL_NAME)?.setValue(requiredConfigsInitialValue);
		}
	}

	private customRequestSelected() {
		if (this.componentForm.get(OPTIONAL_CONFIGS_FORM_CONTROL_NAME)) {
			this.componentForm.removeControl(OPTIONAL_CONFIGS_FORM_CONTROL_NAME);
		}
		if (this.componentForm.get(REQUIRED_CONFIGS_FORM_CONTROL_NAME)) {
			this.componentForm.removeControl(REQUIRED_CONFIGS_FORM_CONTROL_NAME);
		}
		if (!this.componentForm.get(CUSTOM_REQUEST_FORM_CONTROL_NAME)) {
			this.componentForm.addControl(CUSTOM_REQUEST_FORM_CONTROL_NAME, new FormControl({}));
		}
	}

	initialActionDropdownSetup(selectedAction: ComponentInputFormSchema) {
		const silentControlUpdatesSettings = { emitEvent: false };
		if (selectedAction.action_name === this.customRequestItem.value.actionName) {
			const customRequestControl = this.componentForm.get(CUSTOM_REQUEST_FORM_CONTROL_NAME);
			if (!customRequestControl) {
				this.componentForm.addControl(
					CUSTOM_REQUEST_FORM_CONTROL_NAME,
					new FormControl(selectedAction.input.action),
					silentControlUpdatesSettings
				);
				this.componentForm.removeControl(OPTIONAL_CONFIGS_FORM_CONTROL_NAME, silentControlUpdatesSettings);
				this.componentForm.removeControl(REQUIRED_CONFIGS_FORM_CONTROL_NAME, silentControlUpdatesSettings);
			}
			this.componentForm
				.get(ACTION_FORM_CONTROL_NAME)!
				.setValue(this.customRequestItem.value, silentControlUpdatesSettings);
			this.componentForm
				.get(SECURITY_FORM_CONTROL_NAME)!
				.setValue(selectedAction.input.action[SECURITY_FORM_CONTROL_NAME], silentControlUpdatesSettings);
		} else {
			const optionalConfigsControl = this.componentForm.get(OPTIONAL_CONFIGS_FORM_CONTROL_NAME);
			const requiredConfigsControl = this.componentForm.get(REQUIRED_CONFIGS_FORM_CONTROL_NAME);
			if (!optionalConfigsControl && !requiredConfigsControl) {
				this.componentForm.addControl(
					OPTIONAL_CONFIGS_FORM_CONTROL_NAME,
					new FormControl(),
					silentControlUpdatesSettings
				);
				this.componentForm.addControl(
					REQUIRED_CONFIGS_FORM_CONTROL_NAME,
					new FormControl(),
					silentControlUpdatesSettings
				);
				this.componentForm.removeControl(CUSTOM_REQUEST_FORM_CONTROL_NAME, silentControlUpdatesSettings);
			} else {
				optionalConfigsControl!.setValue({}, silentControlUpdatesSettings);
				requiredConfigsControl!.setValue({}, silentControlUpdatesSettings);
			}
			this.intialComponentInputFormValue = selectedAction;
		}
	}

	addOptionalConfig(config: FrontEndConnectorConfig) {
		this.optionalConfigsSelected = {
			configs: [...this.optionalConfigsSelected.configs, config],
			triggerChangeDetection: true,
		};
	}

	configRemoved(config: FrontEndConnectorConfig) {
		const configIndex = this.optionalConfigsSelected.configs.indexOf(config);
		this.optionalConfigsSelected.configs.splice(configIndex, 1);
		this.optionalConfigsSelected = {
			configs: [...this.optionalConfigsSelected.configs],
			triggerChangeDetection: false,
		};
	}

	getFormattedFormData(): { action_name: string; input: { action: ComponentFormOutput } } {
		const action = this.componentForm.get(ACTION_FORM_CONTROL_NAME)!.value;
		const security: AuthConfigDropdownValue | undefined = this.componentForm.get(SECURITY_FORM_CONTROL_NAME)!.value;
		debugger;
		if (action === this.customRequestItem.value) {
			const customRequestData = this.componentForm.get(CUSTOM_REQUEST_FORM_CONTROL_NAME)?.value || {
				body: {},
				parameters: {},
				headers: {},
				endpoint: '',
			};

			return {
				action_name: this.customRequestItem.value.actionName,
				input: {
					action: { ...customRequestData, security: security?.configInterpolation },
				},
			};
		} else {
			const optionalConfigs = this.componentForm.get(OPTIONAL_CONFIGS_FORM_CONTROL_NAME)?.value || {};
			const requiredConfigs = this.componentForm.get(REQUIRED_CONFIGS_FORM_CONTROL_NAME)?.value || {};
			return {
				action_name: action?.actionName,
				input: {
					action: {
						requiredConfigs: requiredConfigs,
						optionalConfigs: optionalConfigs,
						security: security?.configInterpolation || '',
					},
				},
			};
		}
	}
	compareFn(item, selected) {
		return item.value.actionName === selected.value?.actionName;
	}
	setDisabledState?(isDisabled: boolean): void {
		if (isDisabled) {
			this.componentForm.disable();
		} else {
			this.componentForm.enable();
		}
	}

	openNewAuthenticationModal() {
		const modalRef = this.modalService.show(CreateEditConfigModalComponent, {
			ignoreBackdropClick: true,
			class: 'modal-dialog-centered',
			initialState: {},
		});
		modalRef.content?.configForm.get('type')?.setValue(ConfigType.OAUTH2);
		this.newAuthConfigAdded$ = modalRef.onHidden.pipe(
			tap((newAuthConfig: Config) => {
				debugger;
				if (newAuthConfig && newAuthConfig.type === ConfigType.OAUTH2) {
					const authConfigOptionValue: AuthConfigDropdownValue = {
						configInterpolation: `\${configs.${newAuthConfig.key}}`,
						accessToken: newAuthConfig.value,
					};
					this.componentForm.get(SECURITY_FORM_CONTROL_NAME)!.setValue(authConfigOptionValue);
				}
			})
		);
	}
}
