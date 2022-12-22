import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
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
import { BsModalService } from 'ngx-bootstrap/modal';
import { catchError, map, mapTo, Observable, of, shareReplay, startWith, take, tap } from 'rxjs';
import { ActionMetaService } from 'src/app/modules/flow-builder/service/action-meta.service';
import { BuilderSelectors } from 'src/app/modules/flow-builder/store/selector/flow-builder.selector';
import { fadeInUp400ms } from '../../animation/fade-in-up.animation';
import { ConfigType } from '../../model/enum/config-type';
import { Config } from '../../model/fields/variable/config';
import { ThemeService } from '../../service/theme.service';
import { FrontEndConnectorConfig, InputType } from './connector-action-or-config';
import { DropdownItemOption } from '../../model/dropdown-item-option';
import { NewAuthenticationModalComponent } from 'src/app/modules/flow-builder/page/flow-builder/flow-right-sidebar/new-edit-piece-sidebar/edit-step-accordion/input-forms/component-input-forms/new-authentication-modal/new-authentication-modal.component';
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
	configs: FrontEndConnectorConfig[] = [];
	requiredConfigs: FrontEndConnectorConfig[] = [];
	allOptionalConfigs: FrontEndConnectorConfig[] = [];
	selectedOptionalConfigs: FrontEndConnectorConfig[] = [];
	optionalConfigsMenuOpened = false;
	@Input() actionName: string;
	@Input() componentName: string;
	form!: FormGroup;
	OnChange = value => {};
	OnTouched = () => {};
	updateValueOnChange$: Observable<void> = new Observable<void>();
	updateAuthConfig$: Observable<void>;
	configType = InputType;
	optionsObservables$: { [key: ConfigKey]: Observable<DropdownItemOption[]> } = {};
	dropdownsLoadingFlags$: { [key: ConfigKey]: Observable<boolean> } = {};
	allAuthConfigs$: Observable<DropdownItemOption[]>;
	authConfigs: DropdownItemOption[] = [];
	updateOrAddConfigModalClosed$: Observable<void>;
	authConfigDropdownChanged$: Observable<any>;
	updatedAuthLabel = '';
	constructor(
		private fb: FormBuilder,
		public themeService: ThemeService,
		private actionMetaDataService: ActionMetaService,
		private modalService: BsModalService,
		private store: Store
	) {
		this.allAuthConfigs$ = this.store.select(BuilderSelectors.selectAuthConfigsDropdownOptions);
	}

	writeValue(obj: FrontEndConnectorConfig[]): void {
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
		const authConfigs = this.configs.filter(c => c.type === InputType.OAUTH2);
		if (authConfigs.length > 1) {
			console.error(
				'You have set more than one auth config in your connector, this case is not supported only your first auth config will be used'
			);
		}
		if (authConfigs[0]) {
			this.authConfigDropdownChanged$ = this.form.get(authConfigs[0].key)!.valueChanges.pipe(
				startWith(authConfigs[0].value),
				tap(val => {
					this.refreshDropdowns(val);
				})
			);
		}
		this.updateValueOnChange$ = this.form.valueChanges.pipe(
			tap(value => {
				this.OnChange(value);
			}),
			map(() => void 0)
		);
	}

	private createConfigsFormControls(configs: FrontEndConnectorConfig[]) {
		const controls: { [key: string]: FormControl } = {};
		configs.forEach(c => {
			const validators: ValidatorFn[] = [];
			if (c.required) {
				validators.push(Validators.required);
			}
			controls[c.key] = new FormControl(c.value, validators);
		});
		return controls;
	}
	getControl(configKey: string) {
		return this.form.get(configKey);
	}

	removeConfig(config: FrontEndConnectorConfig) {
		this.form.removeControl(config.key);
		const configIndex = this.allOptionalConfigs.findIndex(c => c === config);
		this.selectedOptionalConfigs.splice(configIndex, 1);
	}
	contructDropdownObservable(
		dropdownConfig: FrontEndConnectorConfig,
		authConfig: any,
		actionName: string,
		componentName: string
	) {
		const options$ = this.actionMetaDataService.getConnectorActionConfigOptions(
			{ config_name: dropdownConfig.key, action_name: actionName, config: authConfig },
			componentName
		);

		this.optionsObservables$[dropdownConfig.key] = options$.pipe(
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
	addOptionalConfig(config: FrontEndConnectorConfig) {
		this.form.addControl(config.key, new FormControl());
		this.selectedOptionalConfigs.push(config);
	}
	openNewAuthenticationModal(authConfigName: string) {
		const modalRef = this.modalService.show(NewAuthenticationModalComponent, {
			ignoreBackdropClick: true,
			class: 'modal-dialog-centered',
			initialState: {
				connectorAuthConfig: this.configs.find(c => c.type === InputType.OAUTH2),
				appName: this.componentName,
			},
		});

		this.updateOrAddConfigModalClosed$ = modalRef.onHidden.pipe(
			tap((newAuthConfig: Config) => {
				if (newAuthConfig && newAuthConfig.type === ConfigType.OAUTH2) {
					const authConfigOptionValue = newAuthConfig.value;
					this.form.get(authConfigName)!.setValue(authConfigOptionValue);
					this.updatedAuthLabel = newAuthConfig.label;
				}
			}),
			mapTo(void 0)
		);
	}
	editSelectedAuthConfig(authConfigKey: string) {
		const selectedValue: any = this.form.get(authConfigKey)!.value;
		const allAuthConfigs$ = this.store.select(BuilderSelectors.selectAuth2Configs);
		this.updateAuthConfig$ = allAuthConfigs$.pipe(
			take(1),
			map(configs => {
				console.log(configs);
				const updatedConfigIndex = configs.findIndex(
					c => selectedValue && selectedValue['access_token'] === c.value['access_token']
				);
				return { config: configs[updatedConfigIndex], indexInList: updatedConfigIndex };
			}),
			tap(configAndIndex => {
				if (configAndIndex) {
					const modalRef = this.modalService.show(NewAuthenticationModalComponent, {
						ignoreBackdropClick: true,
						class: 'modal-dialog-centered',
						initialState: {
							configToUpdateWithIndex: configAndIndex,
							connectorAuthConfig: this.configs.find(c => c.type === InputType.OAUTH2),
							appName: this.componentName,
						},
					});
					this.updateOrAddConfigModalClosed$ = modalRef.onHidden.pipe(
						tap((newAuthConfig: Config) => {
							if (newAuthConfig && newAuthConfig.type === ConfigType.OAUTH2) {
								const authConfigOptionValue = newAuthConfig.value;
								this.form.get(authConfigKey)!.setValue(authConfigOptionValue);
								this.updatedAuthLabel = newAuthConfig.label;
							}
						}),
						mapTo(void 0)
					);
				}
			}),
			mapTo(void 0)
		);
	}
	refreshDropdowns(authConfigValue: any) {
		this.configs.forEach(c => {
			if (c.type === InputType.SELECT) {
				this.contructDropdownObservable(c, authConfigValue, this.actionName, this.componentName);
			}
		});
	}
	authenticationDropdownCompareWithFunction = (a: { label: string; value: any }, formControlValue: any) => {
		return formControlValue && formControlValue['access_token'] === a.value['access_token'];
	};
}
