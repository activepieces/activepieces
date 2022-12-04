import { AfterViewChecked, Component, Input, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { BuilderSelectors } from '../../../../store/selector/flow-builder.selector';
import { map, Observable, of, skipWhile, startWith, take, tap } from 'rxjs';
import { LeftSideBarType } from '../../../../../common-layout/model/enum/left-side-bar-type.enum';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';

import { Config } from '../../../../../common-layout/model/fields/variable/config';
import { ConfigType, configTypesDropdownOptions } from '../../../../../common-layout/model/enum/config-type';

import { ConfigSource } from '../../../../../common-layout/model/enum/config-source';

import { FlowsActions } from '../../../../store/action/flows.action';

import { BsModalRef } from 'ngx-bootstrap/modal';
import { fadeInUp400ms } from '../../../../../common-layout/animation/fade-in-up.animation';

import { ConfigScope } from '../../../../../common-layout/model/enum/config-scope-type.enum';
import { DropdownItemOption } from 'src/app/layout/common-layout/model/fields/variable/subfields/dropdown-item-option';
import { DropdownType } from 'src/app/layout/common-layout/model/enum/config.enum';
import {
	OAuth2ConfigSettings,
	StaticDropdownSettings,
} from 'src/app/layout/common-layout/model/fields/variable/config-settings';
import { PieceAction } from 'src/app/layout/flow-builder/store/action/piece.action';
import { ConfigLabelValidator } from '../../validators/configLabelValidator';
import { ConfigKeyValidator } from '../../validators/configKeyValidator';

@Component({
	selector: 'app-create-or-edit-config-modal',
	templateUrl: './create-or-edit-config-modal.component.html',
	styleUrls: ['./create-or-edit-config-modal.component.scss'],
	animations: [fadeInUp400ms],
})
export class CreateEditConfigModalComponent implements OnInit, AfterViewChecked {
	@Input()
	configIndexInConfigsList: number | undefined;
	@Input()
	configToUpdate: Config | undefined;

	//used in case of creating a config for a connector.
	@Input()
	configParent: Config;

	viewMode$: Observable<boolean> = of(false);
	configForm: FormGroup;
	submitted = false;
	savingLoading = false;
	staticDropdownOptions$: Observable<DropdownItemOption[]>;
	newConfigLabel$: Observable<string | undefined> = of(undefined);
	configTypeChanged$: Observable<ConfigType>;
	configSourceChanged$: Observable<ConfigSource>;
	hasViewModeListenerBeenSet = false;

	constructor(private bsModalRef: BsModalRef, private store: Store, private formBuilder: FormBuilder) {}

	ngOnInit(): void {
		this.viewMode$ = this.store.select(BuilderSelectors.selectReadOnly).pipe(
			tap(readOnly => {
				if (readOnly) {
					this.configForm.disable();
				}
			})
		);
		this.buildConfigForm();
		this.setConfigLabelListener();
		this.checkIfWeAreCreatingChildConfig();
		this.setupStaticDropdownOptionsListener();
		this.setupConfigTypeListener();
		this.setupConfigSourceListener();
	}
	ngAfterViewChecked(): void {
		if (!this.hasViewModeListenerBeenSet) {
			this.hasViewModeListenerBeenSet = true;
		}
	}
	private checkIfWeAreCreatingChildConfig() {
		if (this.configParent) {
			this.configForm.get('type')!.setValue(ConfigType.OAUTH2);
			this.configForm.get('type')!.disable();
			this.configForm.get('settings')!.setValue(this.configParent.settings);
		}
	}

	private setConfigLabelListener() {
		if (this.configToUpdate) {
			this.newConfigLabel$ = of(this.configToUpdate.label);
		} else {
			this.newConfigLabel$ = this.configForm.get('label')!.valueChanges;
		}
	}

	private buildConfigForm() {
		if (!this.configToUpdate) {
			this.configForm = this.formBuilder.group({
				source: new FormControl(ConfigSource.USER),
				scope: ConfigScope.COLLECTION,
				label: new FormControl(
					'',
					[Validators.required],
					[
						ConfigLabelValidator.createValidator(
							this.store.select(BuilderSelectors.selectAllConfigs).pipe(take(1)),
							undefined
						),
					]
				),
				key: new FormControl(
					'',
					[Validators.required, Validators.pattern('[A-Za-z0-9_]*')],
					[
						ConfigKeyValidator.createValidator(
							this.store.select(BuilderSelectors.selectAllConfigs).pipe(take(1)),
							undefined
						),
					]
				),
				hintText: new FormControl(),
				type: new FormControl(ConfigType.SHORT_TEXT, [Validators.required]),
				settings: new FormControl({ optional: false }),
				value: new FormControl(),
			});
		} else {
			this.configForm = this.formBuilder.group({
				source: new FormControl(this.configToUpdate.source),
				scope: new FormControl({
					value: ConfigScope.COLLECTION,
					disabled: true,
				}),
				label: new FormControl(
					this.configToUpdate.label,
					[Validators.required],
					[
						ConfigLabelValidator.createValidator(
							this.store.select(BuilderSelectors.selectAllConfigs).pipe(take(1)),
							this.configToUpdate.label
						),
					]
				),
				key: new FormControl(
					{ value: this.configToUpdate.key, disabled: true },
					[],
					[
						ConfigKeyValidator.createValidator(
							this.store.select(BuilderSelectors.selectAllConfigs).pipe(take(1)),
							this.configToUpdate.key
						),
					]
				),
				hintText: new FormControl(this.configToUpdate.hintText),
				type: new FormControl(this.configToUpdate.type, [Validators.required]),
				settings: new FormControl(this.configToUpdate.settings),
				value: new FormControl(this.configToUpdate.value),
			});
		}
	}
	private setupConfigTypeListener() {
		this.configTypeChanged$ = this.configForm.get('type')!.valueChanges.pipe(
			skipWhile(() => this.configForm.disabled),
			tap(newType => {
				const currentType = this.configForm.get('type')!.value;
				if (!this.isConfigOfTypeText(currentType) || !this.isConfigOfTypeText(newType)) {
					const defaultValue = this.getDefaultValueForConfigType(newType);
					const valueControl = this.configForm.get('value')!;
					valueControl.setValue(defaultValue);
					const settingsControl = this.configForm.get('settings')!;
					if (settingsControl.value?.optional && newType !== ConfigType.OAUTH2) {
						settingsControl.setValue({ optional: true });
					} else {
						if (newType === ConfigType.OAUTH2) {
							settingsControl.setValue({ ...new OAuth2ConfigSettings(), optional: false });
						} else {
							settingsControl.setValue({ optional: false });
						}
					}
				}
			})
		);
	}

	private setupConfigSourceListener() {
		this.configSourceChanged$ = this.configForm.get('source')!.valueChanges.pipe(
			skipWhile(() => this.configForm.disabled),
			tap(source => {
				const valueControl = this.configForm.get('value')!;
				if (source === ConfigSource.PREDEFINED) {
					valueControl.setValidators(Validators.required);
					const settingsValue = this.getControlValue('settings');
					this.configForm.get('settings')!.patchValue({ ...settingsValue, required: true });
				} else if (source === ConfigSource.USER) {
					valueControl.clearValidators();
				}
				valueControl.updateValueAndValidity();
			})
		);
	}
	private setupStaticDropdownOptionsListener() {
		this.staticDropdownOptions$ = this.configForm.get('settings')!.valueChanges.pipe(
			skipWhile(() => this.configForm.disabled),
			tap((settings: StaticDropdownSettings) => {
				if (settings && settings.options) {
					const doesValueControlValueExistInAvailableOptions = settings.options.find(
						o => o.value === this.getControlValue('value')
					);
					if (!doesValueControlValueExistInAvailableOptions) {
						this.configForm.get('value')!.setValue(null);
					}
				} else {
					this.configForm.get('value')!.setValue(null);
				}
			}),
			map((settings: StaticDropdownSettings) => {
				if (settings?.options) {
					return settings.options;
				}
				return [];
			}),
			startWith(this.getStaticDropdownOptionsInitialObservableValue())
		);
	}

	getStaticDropdownOptionsInitialObservableValue() {
		const settingsValue = this.getControlValue('settings');
		if (settingsValue?.options) {
			return settingsValue.options;
		}
		return [];
	}
	private getDefaultValueForConfigType(configType: ConfigType) {
		if (configType === ConfigType.CHECKBOX) {
			return false;
		} else if (configType === ConfigType.DICTIONARY) {
			return {};
		} else {
			return null;
		}
	}

	saveConfigToCollection(config: Config): void {
		if (this.configIndexInConfigsList == undefined) {
			this.store.dispatch(PieceAction.addConfig({ config: config }));
		} else {
			this.store.dispatch(
				PieceAction.updateConfig({
					configIndex: this.configIndexInConfigsList,
					config: config,
				})
			);
		}
		this.closeModal(ConfigScope.COLLECTION);
	}

	closeModal(type: ConfigScope | undefined) {
		if (type != undefined) {
			this.store.dispatch(
				FlowsActions.setLeftSidebar({
					sidebarType: LeftSideBarType.CONFIGS,
					props: {
						selectedTab: type,
					},
				})
			);
		}

		this.bsModalRef.hide();
	}

	get ConfigType() {
		return ConfigType;
	}

	get ConfigSource() {
		return ConfigSource;
	}
	get ConfigScope() {
		return ConfigScope;
	}
	setConfigSource(source: ConfigSource) {
		if (this.configForm.enabled) {
			this.configForm.get('source')!.setValue(source);
		}
	}
	setConfigScope(scope: ConfigScope) {
		if (this.configForm.enabled) {
			this.configForm.get('scope')!.setValue(scope);
		}
	}
	get configTypesDropdownOptions() {
		return configTypesDropdownOptions;
	}
	getControlValue(name: string) {
		return this.configForm.get(name)!.value;
	}
	get shouldShowValueFormControl() {
		const whenNotToShowValueFormControl =
			(this.getControlValue('type') === ConfigType.OAUTH2 && this.getControlValue('source') === ConfigSource.USER) ||
			(this.getControlValue('type') === ConfigType.DROPDOWN &&
				this.getControlValue('settings')?.dropdownType === DropdownType.DYNAMIC);
		return !whenNotToShowValueFormControl;
	}
	submit() {
		if (!this.savingLoading && this.configForm.valid) {
			const config: Config = this.createConfigFromFormValue();
			this.saveConfigToCollection(config);
		}
		this.submitted = true;
	}
	get DropdownType() {
		return DropdownType;
	}
	isConfigOfTypeText(configType: ConfigType) {
		return configType === ConfigType.SHORT_TEXT || configType === ConfigType.LONG_TEXT;
	}
	createConfigFromFormValue() {
		const config = this.configForm.getRawValue();
		let required = true;
		if (config && config.settings) {
			required = !config.settings.optional;
			delete config.settings.optional;
			delete config.scope;
			config.settings.required = required;
			if (this.configParent) {
				config.settings.configParent = { configKey: this.configParent.key };
			}
		}
		return config;
	}
	shouldShowSettingsSection() {
		const type = this.getControlValue('type');
		const source = this.getControlValue('source');
		const isDropdownOrAuth = type === ConfigType.DROPDOWN || type == ConfigType.OAUTH2;
		return type !== ConfigType.DICTIONARY && (isDropdownOrAuth || (!isDropdownOrAuth && source === ConfigSource.USER));
	}
}
