import { Component } from '@angular/core';
import {
	ControlValueAccessor,
	FormBuilder,
	FormControl,
	FormGroup,
	NG_VALIDATORS,
	NG_VALUE_ACCESSOR,
	ValidatorFn,
	Validators,
} from '@angular/forms';
import { Store } from '@ngrx/store';
import { UUID } from 'angular2-uuid';
import { BsModalService } from 'ngx-bootstrap/modal';
import { combineLatest, map, Observable, of, shareReplay, startWith, switchMap, take, tap } from 'rxjs';
import { fadeInUp400ms } from 'src/app/layout/common-layout/animation/fade-in-up.animation';
import { DropdownOption } from 'src/app/layout/common-layout/model/dynamic-controls/dropdown-options';
import { DynamicDropdownResult } from 'src/app/layout/common-layout/model/dynamic-controls/dynamic-dropdown-result';
import { ActionType } from 'src/app/layout/common-layout/model/enum/action-type.enum';
import { ConfigSource } from 'src/app/layout/common-layout/model/enum/config-source';
import { ConfigType, DropdownType } from 'src/app/layout/common-layout/model/enum/config.enum';
import { Config } from 'src/app/layout/common-layout/model/fields/variable/config';
import {
	DropdownSettings,
	DynamicDropdownSettings,
	OAuth2ConfigSettings,
	StaticDropdownSettings,
} from 'src/app/layout/common-layout/model/fields/variable/config-settings';
import { Oauth2UserInputType } from 'src/app/layout/common-layout/model/fields/variable/subfields/oauth2-user-input.type';
import { DynamicDropdownService } from 'src/app/layout/common-layout/service/dynamic-dropdown.service';
import { RemoteFlowCacheService } from 'src/app/layout/flow-builder/service/remote-flow-cache.service';
import { BuilderSelectors } from 'src/app/layout/flow-builder/store/selector/flow-builder.selector';
import { NewAuthenticationModalComponent } from '../../../../new-authentication-modal/new-authentication-modal.component';
import { FlowItemDetails } from '../../../../step-type-sidebar/step-type-item/flow-item-details';
import { InputFormsSchema, RemoteFlowInputFormSchema } from '../input-forms-schema';
declare type ConfigKey = string;
declare type ConfigsAndTheirValues = { [key: string]: any };
@Component({
	selector: 'app-remote-flow-input-form',
	templateUrl: './remote-flow-input-form.component.html',
	styleUrls: ['./remote-flow-input-form.component.scss'],
	providers: [
		{
			provide: NG_VALUE_ACCESSOR,
			multi: true,
			useExisting: RemoteFlowInputFormComponent,
		},
		{
			provide: NG_VALIDATORS,
			multi: true,
			useExisting: RemoteFlowInputFormComponent,
		},
	],
	animations: [fadeInUp400ms],
})
export class RemoteFlowInputFormComponent implements ControlValueAccessor {
	configsForm: FormGroup;
	flowsDropdownControl: FormControl;
	flowsDropdownOptions: DropdownOption[] = [];
	collectionConfigsAndRemoteFlowConfigs: Config[] = [];
	descriptionLimit = 35;
	hintTextFullyShown: boolean[] = [];
	dynamicDropdownsObservablesMap: Map<ConfigKey, Observable<DynamicDropdownResult>> = new Map();
	refreshersList$: Observable<void>[] = [];
	_flowItemDetails: FlowItemDetails;
	valueChanged$: Observable<void>;
	allAuthConfigs$: Observable<Config[]>;
	flowVersionDropdownValueChanged$: Observable<void>;
	flowItemDetails$: Observable<FlowItemDetails | undefined>;
	newAuthConfigAdded$: Observable<Config>;
	updateAuthConfig$: Observable<{ indexInList: number; config: Config } | undefined>;
	isDisabled = false;
	onChange = (value: InputFormsSchema) => {};
	onTouch = () => {};
	constructor(
		private formBuilder: FormBuilder,
		private dynamicDropdownService: DynamicDropdownService,
		private store: Store,
		private modalService: BsModalService,
		private remoteFlowCache: RemoteFlowCacheService
	) {
		this.getAuthChildConfigs();
	}

	getAuthChildConfigs() {
		this.allAuthConfigs$ = combineLatest({
			flowConfigs: this.store.select(BuilderSelectors.selectCurrentFlowConfigs),
			collectionConfigs: this.store.select(BuilderSelectors.selectCurrentCollectionConfigs),
		}).pipe(
			map(res => {
				const allConfigs = [...res.collectionConfigs, ...res.flowConfigs];
				return allConfigs.filter(c => c.type === ConfigType.OAUTH2);
			})
		);
	}
	writeValue(remoteFlowSettings: RemoteFlowInputFormSchema): void {
		if (remoteFlowSettings.type === ActionType.REMOTE_FLOW) {
			this.flowItemDetails$ = this.store
				.select(BuilderSelectors.selectRemoteFlowItemDetails(remoteFlowSettings.pieceVersionId))
				.pipe(
					switchMap(flowItemDetails => {
						console.log(flowItemDetails);
						if (flowItemDetails) {
							return this.remoteFlowCache
								.getCollectionFlowsVersions(
									flowItemDetails.extra!.pieceVersionId,
									flowItemDetails.extra!.flowsVersionIds
								)
								.pipe(
									map(flowsVersions => {
										const flowVersiondIdToConfig = flowsVersions.map(flowVer => {
											return {
												id: flowVer.id,
												configs: flowVer.configs.filter(c => c.source !== ConfigSource.PREDEFINED),
												displayName: flowVer.displayName,
											};
										});
										const clonedFlowItemDetails: FlowItemDetails = JSON.parse(JSON.stringify(flowItemDetails));
										clonedFlowItemDetails.extra!.flowVersionIdToConfig = flowVersiondIdToConfig;
										return clonedFlowItemDetails;
									})
								);
						}
						return of(flowItemDetails);
					}),
					tap(flowItemDetails => {
						if (flowItemDetails) {
							this._flowItemDetails = flowItemDetails;
							this.flowsDropdownOptions =
								flowItemDetails.extra?.flowVersionIdToConfig.map(flowVer => {
									return { label: flowVer.displayName, value: flowVer.id };
								}) || [];
							if (remoteFlowSettings.flowVersionId) {
								this.buildFormBecauseStepChanged(remoteFlowSettings.flowVersionId);
							} else if (this.flowsDropdownOptions.length > 0) {
								this.flowsDropdownControl.setValue(this.flowsDropdownOptions[0].value);
								this.buildFormBecauseStepChanged(this.flowsDropdownOptions[0].value);
							} else {
								this.configsForm = this.formBuilder.group({});
							}
							this.prepareDynamicDropdowns();
							if (remoteFlowSettings.input) {
								this.configsForm.patchValue(remoteFlowSettings.input);
							}
						}
					})
				);
		} else {
			this.flowItemDetails$ = of(undefined);
		}
	}
	registerOnChange(fn: any): void {
		this.onChange = fn;
	}
	registerOnTouched(fn: any): void {
		this.onTouch = fn;
	}
	setDisabledState(isDisabled: boolean): void {
		this.isDisabled = isDisabled;
	}
	validate() {
		if (this.configsForm?.invalid) {
			return { invalid: true };
		}
		return null;
	}
	setConfigsFormValueChangedListener() {
		this.valueChanged$ = this.configsForm.valueChanges.pipe(
			tap(() => {
				this.onChange({
					input: this.configsForm.value,
					flowVersionId: this.flowsDropdownControl.value,
					pieceVersionId: this._flowItemDetails.extra?.pieceVersionId,
				});
			}),
			map(() => void 0)
		);
	}
	setFlowVersionDropdownListener() {
		this.flowVersionDropdownValueChanged$ = this.flowsDropdownControl.valueChanges.pipe(
			tap(() => {
				this.buildFormBecauseFlowVersionChanged(this.flowsDropdownControl.value);
				this.prepareDynamicDropdowns();
			})
		);
	}

	buildFormBecauseStepChanged(flowVersionId: UUID) {
		const controls: { [key: string]: FormControl } = {};
		const flowVersionConfigs =
			this._flowItemDetails.extra!.flowVersionIdToConfig.find(res => res.id === flowVersionId)?.configs || [];
		this.collectionConfigsAndRemoteFlowConfigs = [
			...flowVersionConfigs,
			...this._flowItemDetails.extra!.collectionConfigs,
		];
		this.collectionConfigsAndRemoteFlowConfigs.forEach(config => {
			const validators: ValidatorFn[] = [];
			if (config.settings?.required || config.settings?.required === undefined) {
				validators.push(Validators.required);
			}
			controls[config.key] = new FormControl(config.value, validators);
		});
		this.hintTextFullyShown = new Array(this.collectionConfigsAndRemoteFlowConfigs.length);
		this.hintTextFullyShown = this.hintTextFullyShown.fill(false);
		this.configsForm = this.formBuilder.group(controls);
		this.setConfigsFormValueChangedListener();
		this.flowsDropdownControl = new FormControl(flowVersionId);
		this.setFlowVersionDropdownListener();
		if (this.isDisabled) {
			this.configsForm.disable();
			this.flowsDropdownControl.disable();
		}
	}
	buildFormBecauseFlowVersionChanged(flowVersionId: UUID) {
		const controls: { [key: string]: FormControl } = {};
		const flowVersionConfigs =
			this._flowItemDetails.extra!.flowVersionIdToConfig.find(res => res.id === flowVersionId)?.configs || []!;
		this.collectionConfigsAndRemoteFlowConfigs = [
			...flowVersionConfigs,
			...this._flowItemDetails.extra!.collectionConfigs,
		];
		this.collectionConfigsAndRemoteFlowConfigs.forEach(config => {
			const validators: ValidatorFn[] = [];
			if (config.settings?.required || config.settings?.required === undefined) {
				validators.push(Validators.required);
			}
			controls[config.key] = new FormControl(config.value, validators);
		});
		this.hintTextFullyShown = new Array(this.collectionConfigsAndRemoteFlowConfigs.length);
		this.hintTextFullyShown = this.hintTextFullyShown.fill(false);
		this.configsForm = this.formBuilder.group(controls);
		if (this.isDisabled) {
			this.configsForm.disable();
			this.flowsDropdownControl.disable();
		}
		this.setConfigsFormValueChangedListener();
		this.onChange({
			input: this.configsForm.value,
			flowVersionId: this.flowsDropdownControl.value,
			pieceVersionId: this._flowItemDetails.extra?.pieceVersionId,
		});
	}
	prepareDynamicDropdowns() {
		this.dynamicDropdownsObservablesMap.clear();
		this.collectionConfigsAndRemoteFlowConfigs.forEach(c => {
			const configSettings = c.settings as DynamicDropdownSettings;
			if (c.type == ConfigType.DROPDOWN && configSettings.dropdownType === DropdownType.DYNAMIC) {
				if (!configSettings.refreshReferences || configSettings.refreshReferences.length == 0) {
					this.dynamicDropdownsObservablesMap.set(c.key, this.createDynamicDropdownResultObservable(c, {}));
				} else {
					configSettings.refreshReferences.forEach(refresherConfigKey => {
						this.listenToRefreshReferecneValueChanges(refresherConfigKey, c);
					});
				}
			}
		});
	}

	createDynamicDropdownResultObservable(config: Config, refreshEndPointBody: any) {
		let dropdownResult$: Observable<DynamicDropdownResult> = this.createDynamicDropdownObservableBasedOnConfigScope(
			config,
			refreshEndPointBody
		);

		dropdownResult$ = dropdownResult$.pipe(
			map(res => {
				if (!res) {
					console.warn(`Activepieces-response for config:${config.label} was null`);
					res = new DynamicDropdownResult();
					res.options = [];
					res.placeholder = 'No options';
				}
				if (!res.options) {
					res.options = [];
				}
				res.loaded = true;
				return res;
			}),
			tap(res => {
				const configControl = this.configsForm.get(config.key);

				const currentOption = res.options.find(o => JSON.stringify(o.value) === JSON.stringify(configControl?.value));
				if (!currentOption) {
					configControl?.setValue(null);
				}
				if (res?.disabled) {
					configControl?.disable();
				}
			}),
			shareReplay()
		);

		return dropdownResult$;
	}

	createDynamicDropdownObservableBasedOnConfigScope(config: Config, refreshEndPointBody: any) {
		const isConfigCollectionScoped = this._flowItemDetails.extra!.collectionConfigs.find(c => c.key == config.key);

		if (isConfigCollectionScoped) {
			return this.dynamicDropdownService.refreshCollectionDynamicDropdownConfig(
				this._flowItemDetails.extra!.pieceVersionId,
				config.key,
				refreshEndPointBody
			);
		} else {
			return this.dynamicDropdownService.refreshFlowDynamicDropdownConfig(
				this.flowsDropdownControl.value,
				config.key,
				refreshEndPointBody
			);
		}
	}
	listenToRefreshReferecneValueChanges(refresherConfigKey: string, configToRefresh: Config) {
		const refresherConfigControl = this.getControl(refresherConfigKey);
		this.refreshersList$.push(
			refresherConfigControl.valueChanges
				.pipe(
					startWith(refresherConfigControl.value),
					tap(() => {
						const requestBody = this.createDynamicDropdownOptionsRequest(configToRefresh);
						this.dynamicDropdownsObservablesMap.set(
							configToRefresh.key,
							this.createDynamicDropdownResultObservable(configToRefresh, requestBody)
						);
					})
				)
				.pipe(map(() => void 0))
		);
	}
	createDynamicDropdownOptionsRequest(configToRefresh: Config) {
		const refreshersConfigs = this.collectionConfigsAndRemoteFlowConfigs.filter(c =>
			(configToRefresh.settings as DynamicDropdownSettings).refreshReferences?.find(key => key == c.key)
		);
		const requestBody = {};
		refreshersConfigs.forEach(c => {
			requestBody[c.key] = this.getControl(c.key).value;
		});
		return requestBody;
	}

	getControl(configKey: string) {
		return this.configsForm.get(configKey)!;
	}
	getDynamicDropdownObservable(configKey: string) {
		return this.dynamicDropdownsObservablesMap.get(configKey) as Observable<DynamicDropdownResult>;
	}

	getDropdownSettings(config: Config) {
		return config.settings as DropdownSettings;
	}
	getStaticDropdownSettings(config: Config) {
		return config.settings as StaticDropdownSettings;
	}
	getAuthConfigSettings(config: Config) {
		return config.settings as OAuth2ConfigSettings;
	}
	get configType() {
		return ConfigType;
	}
	get dropdownType() {
		return DropdownType;
	}
	get userInputType() {
		return Oauth2UserInputType;
	}

	openNewAuthenticationModal(connectorAuthConfig: Config) {
		const modalRef = this.modalService.show(NewAuthenticationModalComponent, {
			ignoreBackdropClick: true,
			class: 'modal-dialog-centered',
			initialState: {
				connectorAuthConfig: connectorAuthConfig,
				appName: this._flowItemDetails.name,
			},
		});
		this.newAuthConfigAdded$ = modalRef.content!.saveClicked.pipe(
			tap(newAuthConfig => {
				this.configsForm.get(connectorAuthConfig.key)?.setValue(`\${configs.${newAuthConfig.key}}`);
			})
		);
	}

	editSelectedAuthConfig(remoteFlowAuthConfigKey: string) {
		const selectedValue: string = this.configsForm.get(remoteFlowAuthConfigKey)!.value;
		const configKey = selectedValue.split('.')[1].replace('}', '');
		this.updateAuthConfig$ = this.store.select(BuilderSelectors.selectConfig(configKey)).pipe(
			take(1),
			tap(configAndIndex => {
				if (configAndIndex) {
					this.modalService.show(NewAuthenticationModalComponent, {
						ignoreBackdropClick: true,
						class: 'modal-dialog-centered',
						initialState: {
							configToUpdateWithIndex: configAndIndex,
							appName: this._flowItemDetails.name,
						},
					});
				}
			})
		);
	}
}
