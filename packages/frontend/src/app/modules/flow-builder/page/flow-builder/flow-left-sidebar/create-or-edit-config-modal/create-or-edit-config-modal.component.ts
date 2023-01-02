import { AfterViewChecked, Component, Inject, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { BuilderSelectors } from '../../../../store/selector/flow-builder.selector';
import { Observable, of, pairwise, skipWhile, take, tap } from 'rxjs';
import { LeftSideBarType } from '../../../../../common/model/enum/left-side-bar-type.enum';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { configTypesDropdownOptions } from '../../../../../common/model/enum/config-type';
import { FlowsActions } from '../../../../store/action/flows.action';
import { fadeInUp400ms } from '../../../../../common/animation/fade-in-up.animation';
import { CollectionActions } from 'src/app/modules/flow-builder/store/action/collection.action';
import { ConfigKeyValidator } from '../../validators/configKeyValidator';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Config, ConfigType } from 'shared';
interface ConfigForm {
	key: FormControl<string>;
	value: FormControl<any>;
	settings: FormControl<any>;
	type: FormControl<ConfigType>;
}
@Component({
	selector: 'app-create-or-edit-config-modal',
	templateUrl: './create-or-edit-config-modal.component.html',
	styleUrls: ['./create-or-edit-config-modal.component.scss'],
	animations: [fadeInUp400ms],
})
export class CreateEditConfigModalComponent implements OnInit, AfterViewChecked {
	viewMode$: Observable<boolean> = of(false);
	configForm: FormGroup<ConfigForm>;
	submitted = false;
	newConfigLabel$: Observable<string | undefined> = of(undefined);
	configTypeChanged$: Observable<[ConfigType, ConfigType]>;
	hasViewModeListenerBeenSet = false;
	ConfigType = ConfigType;
	configTypesDropdownOptions = configTypesDropdownOptions;

	constructor(
		private store: Store,
		private formBuilder: FormBuilder,
		@Inject(MAT_DIALOG_DATA) public dialogData: undefined | { config: Config; index: number },
		private dialogRef: MatDialogRef<CreateEditConfigModalComponent>
	) {}

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
		this.configForm = this.formBuilder.group({
			key: new FormControl('', {
				nonNullable: true,
				validators: [Validators.required, Validators.pattern('[A-Za-z0-9_]*')],
				asyncValidators: [
					ConfigKeyValidator.createValidator(
						this.store.select(BuilderSelectors.selectAllConfigs).pipe(take(1)),
						undefined
					),
				],
			}),
			type: new FormControl(ConfigType.SHORT_TEXT, { nonNullable: true, validators: [Validators.required] }),
			settings: new FormControl(undefined),
			value: new FormControl(undefined, Validators.required),
		});

		if (this.dialogData) {
			this.configForm.patchValue(this.dialogData.config);
			this.configForm.controls.key.disable();
			this.configForm.controls.type.disable();
		}
	}
	private setupConfigTypeListener() {
		this.configTypeChanged$ = this.configForm.controls.type.valueChanges.pipe(
			skipWhile(() => this.configForm.disabled),
			pairwise(),
			tap(([oldType, newType]) => {
				if (!this.isConfigOfTypeText(oldType) || !this.isConfigOfTypeText(newType)) {
					const defaultValue = this.getDefaultValueForConfigType(newType);
					const valueControl = this.configForm.controls.value;
					valueControl.setValue(defaultValue);
					const settingsControl = this.configForm.controls.settings;
					if (newType !== ConfigType.OAUTH2) {
						settingsControl.setValue(undefined);
						settingsControl.setErrors(null);
					} else {
						settingsControl.setValue({
							
						});
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
		if (this.dialogData == undefined) {
			this.store.dispatch(CollectionActions.addConfig({ config: config }));
		} else {
			this.store.dispatch(
				CollectionActions.updateConfig({
					configIndex: this.dialogData.index,
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
		this.dialogRef.close();
	}

	submit() {
		this.configForm.markAllAsTouched();
		console.log(this.configForm.errors);
		if (this.configForm.valid) {
			const config: Config = this.configForm.getRawValue();
			this.saveConfig(config);
		}
		this.submitted = true;
	}
	isConfigOfTypeText(configType: ConfigType) {
		return configType === ConfigType.SHORT_TEXT || configType === ConfigType.LONG_TEXT;
	}
}
