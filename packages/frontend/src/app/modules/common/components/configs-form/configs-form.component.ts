import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import {
	ControlValueAccessor,
	UntypedFormBuilder,
	UntypedFormControl,
	UntypedFormGroup,
	NG_VALIDATORS,
	NG_VALUE_ACCESSOR,
	ValidatorFn,
	Validators,
} from '@angular/forms';
import { Store } from '@ngrx/store';
import {
	catchError,
	distinctUntilChanged,
	EMPTY,
	map,
	Observable,
	of,
	shareReplay,
	startWith,
	switchMap,
	take,
	tap,
} from 'rxjs';
import { ActionMetaService } from 'src/app/modules/flow-builder/service/action-meta.service';
import { BuilderSelectors } from 'src/app/modules/flow-builder/store/selector/flow-builder.selector';
import { fadeInUp400ms } from '../../animation/fade-in-up.animation';
import { ThemeService } from '../../service/theme.service';
import { PieceConfig, InputType } from './connector-action-or-config';
import { NewAuthenticationModalComponent } from 'src/app/modules/flow-builder/page/flow-builder/flow-right-sidebar/edit-step-sidebar/edit-step-accordion/input-forms/component-input-forms/new-authentication-modal/new-authentication-modal.component';
import { MatDialog } from '@angular/material/dialog';
import { Config, ConfigType } from 'shared';
import { DropdownItem } from '../../model/dropdown-item.interface';
import { NewCloudAuthenticationModalComponent } from 'src/app/modules/flow-builder/page/flow-builder/flow-right-sidebar/edit-step-sidebar/edit-step-accordion/input-forms/component-input-forms/new-cloud-authentication-modal/new-cloud-authentication-modal.component';
import { CloudAuthConfigsService } from '../../service/cloud-auth-configs.service';
import { ConfirmCloudAuthConfigUseDialog } from './confirm-cloud-auth-config-use-dialog/confirm-cloud-auth-config-use-dialog.component';
type ConfigKey = string;

@Component({
	selector: 'app-configs-form',
	templateUrl: './configs-form.component.html',
	styleUrls: ['./configs-form.component.scss'],
	providers: [
		{
			provide: NG_VALUE_ACCESSOR,
			multi: true,
			useExisting: ConfigsFormComponent,
		},
		{
			provide: NG_VALIDATORS,
			multi: true,
			useExisting: ConfigsFormComponent,
		},
	],
	animations: [fadeInUp400ms],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfigsFormComponent implements ControlValueAccessor {
	configs: PieceConfig[] = [];
	requiredConfigs: PieceConfig[] = [];
	allOptionalConfigs: PieceConfig[] = [];
	selectedOptionalConfigs: PieceConfig[] = [];
	optionalConfigsMenuOpened = false;
	@Input() stepName: string;
	@Input() pieceName: string;
	@Input() pieceDisplayName: string;
	form!: UntypedFormGroup;
	OnChange = value => {};
	OnTouched = () => {};
	updateValueOnChange$: Observable<void> = new Observable<void>();
	updateAuthConfig$: Observable<void>;
	configType = InputType;
	optionsObservables$: { [key: ConfigKey]: Observable<DropdownItem[]> } = {};
	dropdownsLoadingFlags$: { [key: ConfigKey]: Observable<boolean> } = {};
	allAuthConfigs$: Observable<DropdownItem[]>;
	updateOrAddConfigModalClosed$: Observable<void>;
	configDropdownChanged$: Observable<any>;
	updatedAuthLabel = '';
	cloudAuthCheck$: Observable<void>;
	constructor(
		private fb: UntypedFormBuilder,
		public themeService: ThemeService,
		private actionMetaDataService: ActionMetaService,
		private dialogService: MatDialog,
		private store: Store,
		private cloudAuthConfigsService: CloudAuthConfigsService
	) {
		this.allAuthConfigs$ = this.store.select(BuilderSelectors.selectAuthConfigsDropdownOptions);
	}

	writeValue(obj: PieceConfig[]): void {
		this.configs = obj;
		this.createForm();
	}
	registerOnChange(fn: any): void {
		this.OnChange = fn;
	}
	registerOnTouched(fn: any): void {
		this.OnTouched = fn;
	}
	setDisabledState(disabled: boolean) {
		if (disabled) {
			this.form.disable();
		} else {
			this.form.enable();
		}
	}
	validate() {
		if (this.form.invalid) {
			return { invalid: true };
		}
		return null;
	}
	createForm() {
		this.requiredConfigs = this.configs.filter(c => c.required);
		this.allOptionalConfigs = this.configs.filter(c => !c.required);
		this.selectedOptionalConfigs = this.allOptionalConfigs.filter(c => c.value !== undefined);
		const requiredConfigsControls = this.createConfigsFormControls(this.requiredConfigs);
		const optionalConfigsControls = this.createConfigsFormControls(this.selectedOptionalConfigs);
		this.form = this.fb.group({ ...requiredConfigsControls, ...optionalConfigsControls });

		let configValue = this.configs.reduce((map, obj) => {
			map[obj.key] = obj.value;
			return map;
		}, {});

		this.configDropdownChanged$ = this.form.valueChanges.pipe(
			startWith(configValue),
			distinctUntilChanged((prev, curr) => JSON.stringify(prev) === JSON.stringify(curr)),
			tap(val => {
				this.refreshDropdowns(val);
			})
		);

		this.updateValueOnChange$ = this.form.valueChanges.pipe(
			tap(value => {
				this.OnChange(value);
			}),
			map(() => void 0)
		);

		this.form.markAllAsTouched();
	}

	private createConfigsFormControls(configs: PieceConfig[]) {
		const controls: { [key: string]: UntypedFormControl } = {};
		configs.forEach(c => {
			const validators: ValidatorFn[] = [];
			if (c.required) {
				validators.push(Validators.required);
			}
			controls[c.key] = new UntypedFormControl(c.value, validators);
		});
		return controls;
	}
	getControl(configKey: string) {
		return this.form.get(configKey);
	}

	removeConfig(config: PieceConfig) {
		this.form.removeControl(config.key);
		const configIndex = this.allOptionalConfigs.findIndex(c => c === config);
		this.selectedOptionalConfigs.splice(configIndex, 1);
	}
	contructDropdownObservable(dropdownConfig: PieceConfig, authConfig: any, stepName: string, componentName: string) {
		const options$ = this.actionMetaDataService.getConnectorActionConfigOptions(
			{ configName: dropdownConfig.key, stepName: stepName, configs: authConfig },
			componentName
		);
		this.optionsObservables$[dropdownConfig.key] = options$.pipe(
			tap(opts => {
				const currentConfigValue = this.form.get(dropdownConfig.key)!.value;
				if (!opts.options.find(opt => opt.value == currentConfigValue)) {
					this.form.get(dropdownConfig.key)!.setValue(null);
				}
			}),
			map(state => {
				return state.options;
			}),
			shareReplay(1),
			catchError(err => {
				console.error(err);
				return of([]);
			})
		);

		this.dropdownsLoadingFlags$[dropdownConfig.key] = this.optionsObservables$[dropdownConfig.key].pipe(
			startWith(null),
			map(val => {
				if (val === null) return true;
				if (!Array.isArray(val)) {
					console.error(
						`Activepieces- Config ${dropdownConfig.label} options are not returned in array form--> ${val}`
					);
				}
				return false;
			})
		);
	}
	addOptionalConfig(config: PieceConfig) {
		this.form.addControl(config.key, new UntypedFormControl());
		this.selectedOptionalConfigs.push(config);
	}

	newAuthenticationDialogProcess(authConfigName: string) {
		this.cloudAuthCheck$ = this.cloudAuthConfigsService.getAppsAndTheirClientIds().pipe(
			map(res => {
				return res[this.pieceName];
			}),
			switchMap(cloudAuth2Config => {
				if (cloudAuth2Config) {
					return this.dialogService
						.open(ConfirmCloudAuthConfigUseDialog)
						.afterClosed()
						.pipe(
							tap(confirmationResult => {
								if (confirmationResult) {
									this.openNewCloudAuthenticationModal(authConfigName, cloudAuth2Config.clientId);
								} else {
									this.openNewAuthenticationModal(authConfigName);
								}
							})
						);
				} else {
					this.openNewAuthenticationModal(authConfigName);
					return EMPTY;
				}
			})
		);
	}
	openNewAuthenticationModal(authConfigName: string) {
		this.updateOrAddConfigModalClosed$ = this.dialogService
			.open(NewAuthenticationModalComponent, {
				data: { pieceAuthConfig: this.configs.find(c => c.type === InputType.OAUTH2), pieceName: this.pieceName },
			})
			.afterClosed()
			.pipe(
				tap((newAuthConfig: Config) => {
					if (newAuthConfig && newAuthConfig.type === ConfigType.OAUTH2) {
						const authConfigOptionValue = newAuthConfig.value;
						this.form.get(authConfigName)!.setValue(authConfigOptionValue);
						this.updatedAuthLabel = newAuthConfig.key;
					}
				}),
				map(() => void 0)
			);
	}

	openNewCloudAuthenticationModal(authConfigName: string, clientId: string) {
		this.updateOrAddConfigModalClosed$ = this.dialogService
			.open(NewCloudAuthenticationModalComponent, {
				data: {
					pieceAuthConfig: this.configs.find(c => c.type === InputType.OAUTH2),
					pieceName: this.pieceName,
					clientId: clientId,
				},
			})
			.afterClosed()
			.pipe(
				tap((newAuthConfig: Config) => {
					if (newAuthConfig && newAuthConfig.type === ConfigType.CLOUD_OAUTH2) {
						const authConfigOptionValue = newAuthConfig.value;
						this.form.get(authConfigName)!.setValue(authConfigOptionValue);
						this.updatedAuthLabel = newAuthConfig.key;
					}
				}),
				map(() => void 0)
			);
	}
	editSelectedAuthConfig(authConfigKey: string) {
		const selectedValue: any = this.form.get(authConfigKey)!.value;
		const allAuthConfigs$ = this.store.select(BuilderSelectors.selectAuth2Configs);
		this.updateAuthConfig$ = allAuthConfigs$.pipe(
			take(1),
			map(configs => {
				const updatedConfigIndex = configs.findIndex(
					c => selectedValue && selectedValue['access_token'] === c.value['access_token']
				);
				return { config: configs[updatedConfigIndex], indexInList: updatedConfigIndex };
			}),
			tap(configAndIndex => {
				if (configAndIndex) {
					debugger;
					if (configAndIndex.config.type === ConfigType.OAUTH2) {
						this.updateOrAddConfigModalClosed$ = this.dialogService
							.open(NewAuthenticationModalComponent, {
								data: {
									configToUpdateWithIndex: configAndIndex,
									pieceAuthConfig: this.configs.find(c => c.type === InputType.OAUTH2),
									pieceName: this.pieceName,
								},
							})
							.afterClosed()
							.pipe(
								tap((newAuthConfig: Config) => {
									if (newAuthConfig && newAuthConfig.type === ConfigType.OAUTH2) {
										const authConfigOptionValue = newAuthConfig.value;
										this.form.get(authConfigKey)!.setValue(authConfigOptionValue);
										this.updatedAuthLabel = newAuthConfig.key;
									}
								}),
								map(() => void 0)
							);
					} else {
						this.updateOrAddConfigModalClosed$ = this.cloudAuthConfigsService.getAppsAndTheirClientIds().pipe(
							switchMap(res => {
								const clientId = res[this.pieceName].clientId;
								return this.dialogService
									.open(NewCloudAuthenticationModalComponent, {
										data: {
											configToUpdateWithIndex: configAndIndex,
											pieceAuthConfig: this.configs.find(c => c.type === InputType.OAUTH2),
											pieceName: this.pieceName,
											clientId: clientId,
										},
									})
									.afterClosed()
									.pipe(
										tap((newAuthConfig: Config) => {
											if (newAuthConfig && newAuthConfig.type === ConfigType.CLOUD_OAUTH2) {
												const authConfigOptionValue = newAuthConfig.value;
												this.form.get(authConfigKey)!.setValue(authConfigOptionValue);
												this.updatedAuthLabel = newAuthConfig.key;
											}
										}),
										map(() => void 0)
									);
							})
						);
					}
				}
			}),
			map(() => void 0)
		);
	}
	refreshDropdowns(configsValue: Record<string, any>) {
		this.configs.forEach(c => {
			if (c.type === InputType.DROPDOWN) {
				this.contructDropdownObservable(c, configsValue, this.stepName, this.pieceName);
			}
		});
	}
	authenticationDropdownCompareWithFunction = (opt: any, formControlValue: any) => {
		return formControlValue && formControlValue['access_token'] === opt['access_token'];
	};
}
