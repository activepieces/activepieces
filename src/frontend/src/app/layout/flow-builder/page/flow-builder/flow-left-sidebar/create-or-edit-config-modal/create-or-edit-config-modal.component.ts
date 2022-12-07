import { AfterViewChecked, Component, Input, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { BuilderSelectors } from '../../../../store/selector/flow-builder.selector';
import { Observable, of, skipWhile, take, tap } from 'rxjs';
import { LeftSideBarType } from '../../../../../common-layout/model/enum/left-side-bar-type.enum';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { Config } from '../../../../../common-layout/model/fields/variable/config';
import { ConfigType, configTypesDropdownOptions } from '../../../../../common-layout/model/enum/config-type';
import { FlowsActions } from '../../../../store/action/flows.action';
import { BsModalRef } from 'ngx-bootstrap/modal';
import { fadeInUp400ms } from '../../../../../common-layout/animation/fade-in-up.animation';
import { DropdownItemOption } from 'src/app/layout/common-layout/model/fields/variable/subfields/dropdown-item-option';
import { OAuth2ConfigSettings } from 'src/app/layout/common-layout/model/fields/variable/config-settings';
import { CollectionActions } from 'src/app/layout/flow-builder/store/action/collection.action';

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
	viewMode$: Observable<boolean> = of(false);
	configForm: FormGroup;
	submitted = false;
	savingLoading = false;
	staticDropdownOptions$: Observable<DropdownItemOption[]>;
	newConfigLabel$: Observable<string | undefined> = of(undefined);
	configTypeChanged$: Observable<ConfigType>;
	hasViewModeListenerBeenSet = false;
	configType = ConfigType;
	configTypesDropdownOptions = configTypesDropdownOptions;
	ConfigType = ConfigType;
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
		this.setupConfigTypeListener();
	}
	ngAfterViewChecked(): void {
		if (!this.hasViewModeListenerBeenSet) {
			this.hasViewModeListenerBeenSet = true;
		}
	}

	private buildConfigForm() {
		if (!this.configToUpdate) {
			this.configForm = this.formBuilder.group({
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
				type: new FormControl(ConfigType.SHORT_TEXT, [Validators.required]),
				settings: new FormControl(undefined),
				value: new FormControl(undefined, Validators.required),
			});
		} else {
			this.configForm = this.formBuilder.group({
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
				type: new FormControl(this.configToUpdate.type, [Validators.required]),
				settings: new FormControl(this.configToUpdate.settings),
				value: new FormControl(this.configToUpdate.value, Validators.required),
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
					if (newType !== ConfigType.OAUTH2) {
						settingsControl.setValue(undefined);
					} else {
						settingsControl.setValue({ ...new OAuth2ConfigSettings() });
					}
				}
			})
		);
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

	saveConfig(config: Config): void {
		if (this.configIndexInConfigsList == undefined) {
			this.store.dispatch(CollectionActions.addConfig({ config: config }));
		} else {
			this.store.dispatch(
				CollectionActions.updateConfig({
					configIndex: this.configIndexInConfigsList,
					config: config,
				})
			);
		}
		this.closeModal();
	}

	closeModal() {
		this.store.dispatch(
			FlowsActions.setLeftSidebar({
				sidebarType: LeftSideBarType.CONFIGS,
			})
		);

		this.bsModalRef.hide();
	}

	getControlValue(name: string) {
		return this.configForm.get(name)!.value;
	}

	submit() {
		if (!this.savingLoading && this.configForm.valid) {
			const config: Config = this.configForm.getRawValue();
			this.saveConfig(config);
		}
		this.submitted = true;
	}
	isConfigOfTypeText(configType: ConfigType) {
		return configType === ConfigType.SHORT_TEXT || configType === ConfigType.LONG_TEXT;
	}
}
