import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import {
	AbstractControl,
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
import { map, mapTo, Observable, of, Subject, take, tap } from 'rxjs';
import { BuilderSelectors } from 'src/app/layout/flow-builder/store/selector/flow-builder.selector';
import { Store } from '@ngrx/store';
import { BsModalService } from 'ngx-bootstrap/modal';
import { DropdownOption } from 'src/app/layout/common-layout/model/dynamic-controls/dropdown-options';
import { environment } from 'src/environments/environment';
import { CreateEditConfigModalComponent } from '../../../../../flow-left-sidebar/create-or-edit-config-modal/create-or-edit-config-modal.component';
import { Config } from 'src/app/layout/common-layout/model/fields/variable/config';
import { ConfigType } from 'src/app/layout/common-layout/model/enum/config-type';
import { ActionMetaService } from 'src/app/layout/flow-builder/service/action-meta.service';
import {
	ComponnentConfigsForActionsOrTriggers,
	FrontEndConnectorConfig,
	HttpMethod,
} from 'src/app/layout/common-layout/components/configs-form/connector-action-or-config';
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

const CUSTOM_REQUEST_FORM_CONTROL_NAME = 'customRequest';
const OPTIONAL_CONFIGS_FORM_CONTROL_NAME = 'optionalConfigs';
const REQUIRED_CONFIGS_FORM_CONTROL_NAME = 'requiredConfigs';
const ACTION_FORM_CONTROL_NAME = 'action';
const SECURITY_FORM_CONTROL_NAME = 'authentication';
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
export class ComponentInputFormComponent implements ControlValueAccessor, AfterViewInit {
	readonly ACTION_FORM_CONTROL_NAME = ACTION_FORM_CONTROL_NAME;
	readonly SECURITY_FORM_CONTROL_NAME = SECURITY_FORM_CONTROL_NAME;
	readonly CUSTOM_REQUEST_FORM_CONTROL_NAME = CUSTOM_REQUEST_FORM_CONTROL_NAME;
	readonly OPTIONAL_CONFIGS_FORM_CONTROL_NAME = OPTIONAL_CONFIGS_FORM_CONTROL_NAME;
	readonly REQUIRED_CONFIGS_FORM_CONTROL_NAME = REQUIRED_CONFIGS_FORM_CONTROL_NAME;
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
	intialComponentInputFormValue: { action_name: string; input: { [key: string]: any } } | null;
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
	authDropdownValueChanged$: Observable<any>;
	updateAuthConfig$: Observable<{ indexInList: number; config: FrontEndConnectorConfig } | undefined>;
	newAuthConfigValue$: Subject<{
		authConfig: any;
		actionName: string;
		componentName: string;
	}> = new Subject();
	setInitiallySelectedAuthConfig$: Observable<void>;
	onChange = (value: any) => {};
	onTouch = () => {};
	authenticationDropdownCompareWithFunction = (a: { label: string; value: any }, formControlValue: any) => {
		return JSON.stringify(formControlValue) === JSON.stringify(a.value);
	};
	updateOrAddConfigModalClosed$: Observable<Config>;
	allAuthConfigs$: Observable<DropdownOption[]>;
	constructor(
		private fb: FormBuilder,
		private store: Store,
		private modalService: BsModalService,
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
		this.authDropdownValueChanged$ = this.componentForm.get(SECURITY_FORM_CONTROL_NAME)!.valueChanges.pipe(
			tap(val => {
				this.newAuthConfigValue$.next({
					authConfig: val.configValue,
					actionName: this.componentForm.get(ACTION_FORM_CONTROL_NAME)!.value.actionName,
					componentName: this.componentName,
				});
			})
		);
		this.allAuthConfigs$ = this.store.select(BuilderSelectors.selectAuthConfigsDropdownOptions).pipe(tap(console.log));
	}
	ngAfterViewInit(): void {
		if (this.intialComponentInputFormValue && this.intialComponentInputFormValue.input) {
			const authConfigValue = this.intialComponentInputFormValue.input
				? this.intialComponentInputFormValue?.input[SECURITY_FORM_CONTROL_NAME]
				: null;
			this.componentForm.get(SECURITY_FORM_CONTROL_NAME)!.setValue(authConfigValue, { emitEvent: false });
			if (authConfigValue) {
				this.newAuthConfigValue$.next({
					authConfig: authConfigValue,
					actionName: this.componentForm.get(ACTION_FORM_CONTROL_NAME)!.value.actionName,
					componentName: this.componentName,
				});
			}
		}
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
			[SECURITY_FORM_CONTROL_NAME]: new FormControl(null, Validators.required),
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
						.setValue(this.intialComponentInputFormValue.input, { emitEvent: false });
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
				const requiredConfigsControl = this.componentForm.get(REQUIRED_CONFIGS_FORM_CONTROL_NAME);
				if (
					requiredConfigsControl &&
					optionalConfigsControl &&
					this.intialComponentInputFormValue &&
					this.intialComponentInputFormValue.action_name
				) {
					const selectedAction = items.find(
						i => i.value?.actionName === this.intialComponentInputFormValue?.action_name
					)!;
					const optionalConfigsKeys = selectedAction.value.configs.filter(c => !c.required).map(c => c.key);
					const requiredConfigsKeys = selectedAction.value.configs.filter(c => c.required).map(c => c.key);
					this.optionalConfigsSelected = {
						configs: selectedAction.value.configs
							.filter(
								c =>
									optionalConfigsKeys.includes(c.key) && this.intialComponentInputFormValue!.input[c.key] !== undefined
							)
							.map(c => {
								return {
									...c,
									value: this.intialComponentInputFormValue?.input[c.key],
								};
							}),

						triggerChangeDetection: false,
					};
					this.allOptionalConfigs = [...selectedAction.value.configs.filter(c => !c.required)];
					this.requiredConfigs = {
						configs: [...selectedAction.value.configs.filter(c => c.required)],
						triggerChangeDetection: false,
					};

					this.cd.detectChanges();
					//security + optionalConfigs + requiredConfigs

					const requiredConfigsValues = {};
					const optionalConfigsValues = {};
					const authenticationConfigValue = this.intialComponentInputFormValue.input['authentication'];
					requiredConfigsKeys.forEach(key => {
						const configValue = this.intialComponentInputFormValue!.input[key];
						if (configValue) {
							requiredConfigsValues[key] = configValue;
						}
					});

					optionalConfigsKeys.forEach(key => {
						const configValue = this.intialComponentInputFormValue!.input[key];
						if (configValue) {
							optionalConfigsValues[key] = configValue;
						}
					});

					this.componentForm.patchValue(
						{
							[REQUIRED_CONFIGS_FORM_CONTROL_NAME]: { ...requiredConfigsValues },
							[OPTIONAL_CONFIGS_FORM_CONTROL_NAME]: { ...optionalConfigsValues },
							[SECURITY_FORM_CONTROL_NAME]: authenticationConfigValue,
						},
						{ emitEvent: false }
					);
				}
				if (this.intialComponentInputFormValue && this.intialComponentInputFormValue.input) {
					const authConfigValue = this.intialComponentInputFormValue.input
						? this.intialComponentInputFormValue?.input[SECURITY_FORM_CONTROL_NAME]
						: null;
					this.componentForm.get(SECURITY_FORM_CONTROL_NAME)!.setValue(authConfigValue, { emitEvent: false });

					if (authConfigValue) {
						this.newAuthConfigValue$.next({
							authConfig: authConfigValue,
							actionName: this.componentForm.get(ACTION_FORM_CONTROL_NAME)!.value.actionName,
							componentName: this.componentName,
						});
					}
				}
				this.cd.detectChanges();
			})
		);
	}
	writeValue(obj: ComponentInputFormSchema): void {
		this.intialComponentInputFormValue = obj;

		this.componentForm.get(ACTION_FORM_CONTROL_NAME)?.setValue(undefined, { emitEvent: false });
		this.componentForm.get(SECURITY_FORM_CONTROL_NAME)?.setValue(undefined, { emitEvent: false });
		if (obj.input && obj.action_name) {
			this.initialActionDropdownSetup(obj);
		} else if (obj.component_name) {
			this.removeDataControls();
		}
		this.fetchActions(obj.component_name);
		this.componentName = obj.component_name;
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
				this.clearConfigsControl(optionalConfigsControl!);
				this.clearConfigsControl(requiredConfigsControl!);
			}
			this.intialComponentInputFormValue = selectedAction;
		}
	}
	clearConfigsControl(configsControl: AbstractControl) {
		const values = configsControl.value;
		if (values) {
			const valuesKeys = Object.keys(values);
			const clearedValues = {};
			valuesKeys.forEach(k => {
				clearedValues[k] = '';
			});
			configsControl.setValue(clearedValues);
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

	getFormattedFormData(): { action_name: string; input: { [configKey: string]: any } } {
		const action = this.componentForm.get(ACTION_FORM_CONTROL_NAME)!.value;
		const authentication: any = this.componentForm.get(SECURITY_FORM_CONTROL_NAME)!.value;

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
				authentication: authentication,
			};
		} else {
			const optionalConfigs = this.componentForm.get(OPTIONAL_CONFIGS_FORM_CONTROL_NAME)?.value || {};
			const requiredConfigs = this.componentForm.get(REQUIRED_CONFIGS_FORM_CONTROL_NAME)?.value || {};
			const res = {
				action_name: action?.actionName,
				input: {
					[SECURITY_FORM_CONTROL_NAME]: authentication,
					...optionalConfigs,
					...requiredConfigs,
				},
			};
			console.log(res);
			return res;
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
		this.updateOrAddConfigModalClosed$ = modalRef.onHidden.pipe(
			tap((newAuthConfig: Config) => {
				if (newAuthConfig && newAuthConfig.type === ConfigType.OAUTH2) {
					const authConfigOptionValue = newAuthConfig.value;
					this.componentForm.get(SECURITY_FORM_CONTROL_NAME)!.setValue(authConfigOptionValue);
					this.newAuthConfigValue$.next({
						authConfig: newAuthConfig.value,
						actionName: this.componentForm.get(ACTION_FORM_CONTROL_NAME)!.value.actionName,
						componentName: this.componentName,
					});
				}
			})
		);
	}
	editSelectedAuthConfig() {
		const selectedValue: any = this.componentForm.get(SECURITY_FORM_CONTROL_NAME)!.value;
		const allAuthConfigs$ = this.store.select(BuilderSelectors.selectAuth2Configs);
		this.updateAuthConfig$ = allAuthConfigs$.pipe(
			take(1),
			map(configs => {
				const updatedConfigIndex = configs.findIndex(c => JSON.stringify(selectedValue) === JSON.stringify(c.value));
				return { config: configs[updatedConfigIndex], indexInList: updatedConfigIndex };
			}),
			tap(configAndIndex => {
				if (configAndIndex) {
					const modalRef = this.modalService.show(CreateEditConfigModalComponent, {
						ignoreBackdropClick: true,
						class: 'modal-dialog-centered',
						initialState: {
							configIndexInConfigsList: configAndIndex.indexInList,
							configToUpdate: configAndIndex.config,
						},
					});
					this.updateOrAddConfigModalClosed$ = modalRef.onHidden.pipe(
						tap((newAuthConfig: Config) => {
							if (newAuthConfig && newAuthConfig.type === ConfigType.OAUTH2) {
								const authConfigOptionValue = newAuthConfig.value;
								this.componentForm.get(SECURITY_FORM_CONTROL_NAME)!.setValue(authConfigOptionValue);
								this.newAuthConfigValue$.next({
									authConfig: newAuthConfig.value,
									actionName: this.componentForm.get(ACTION_FORM_CONTROL_NAME)!.value.actionName,
									componentName: this.componentName,
								});
							}
						})
					);
				}
			}),
			mapTo(void 0)
		);
	}
}
