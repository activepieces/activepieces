import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
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
import { map, Observable, shareReplay, startWith, tap } from 'rxjs';

import { fadeInUp400ms } from '../../animation/fade-in-up.animation';
import { DynamicDropdownResult } from '../../model/dynamic-controls/dynamic-dropdown-result';
import { ConfigType, DropdownType } from '../../model/enum/config.enum';
import { Config } from '../../model/fields/variable/config';
import {
	DropdownSettings,
	DynamicDropdownSettings,
	OAuth2ConfigSettings,
	StaticDropdownSettings,
} from '../../model/fields/variable/config-settings';
import { DynamicDropdownService } from '../../service/dynamic-dropdown.service';
import { ThemeService } from '../../service/theme.service';

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
})
export class ConfigsFormComponent implements OnInit, ControlValueAccessor {
	@Input() set configs(value: Config[] | { configs: Config[]; triggerChangeDetection: boolean }) {
		if (Array.isArray(value)) {
			this._configs = value;
		}
	}
	_configs: Config[] = [];
	@Input() submitted = false;
	@Input() showSlider = false;
	@Input() allowRemoveConfig = false;
	@Output() configRemoved: EventEmitter<Config> = new EventEmitter();
	@Input() showDescriptionAsTooltips = false;
	form!: FormGroup;
	descriptionLimit = 45;
	hintTextShown: boolean[] = [];
	OnChange = value => {};
	OnTouched = () => {};
	updateValueOnChange$: Observable<void> = new Observable<void>();
	refreshReferencesList$: Observable<void>[] = [];
	dynamicDropdownsObservablesMap: Map<ConfigKey, Observable<DynamicDropdownResult>> = new Map();
	constructor(
		private dynamicDropdownService: DynamicDropdownService,
		private fb: FormBuilder,
		public themeService: ThemeService
	) {}

	ngOnInit(): void {
		this.createForm();
		this.prepareDynamicDropdowns();
		this.hintTextShown = new Array(this._configs.length);
		this.hintTextShown = this.hintTextShown.fill(false);
	}

	writeValue(obj: any): void {
		if (obj) {
			this.form.patchValue(obj, { emitEvent: false });
		}
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
		const controls: { [key: string]: FormControl } = {};
		this._configs.forEach(c => {
			const validators: ValidatorFn[] = [];
			if (c.settings?.required || c.settings?.required === undefined) {
				validators.push(Validators.required);
			}
			controls[c.key] = new FormControl(c.value, validators);
		});
		this.form = this.fb.group(controls);
		this.updateValueOnChange$ = this.form.valueChanges.pipe(
			tap(value => {
				this.OnChange(value);
			}),
			map(() => void 0)
		);
	}

	prepareDynamicDropdowns() {
		this._configs.forEach(c => {
			const configSettings = c.settings as DynamicDropdownSettings;
			if (c.type == ConfigType.DROPDOWN && configSettings.dropdownType === DropdownType.DYNAMIC) {
				if (!configSettings.refreshReferences || configSettings.refreshReferences.length == 0) {
					this.dynamicDropdownsObservablesMap.set(c.key, this.createDynamicDropdownResultObservable(c, {}));
				} else {
					configSettings.refreshReferences.forEach(refresherConfigKey => {
						this.listenToRefreshReferenceValuChanges(refresherConfigKey, c);
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
					res.loaded = true;
					res.options = [];
					res.placeholder = 'No options';
				} else {
					res.loaded = true;
				}
				if (!res.options) {
					res.options = [];
				}
				return res;
			}),
			tap(res => {
				const configControl = this.form.get(config.key);

				if (!res.options.find(o => JSON.stringify(o.value) === JSON.stringify(configControl?.value))) {
					configControl?.setValue(null);
				}
				if (res?.disabled) {
					configControl?.disable();
				} else {
					configControl?.enable();
				}
			}),
			shareReplay()
		);

		return dropdownResult$;
	}

	createDynamicDropdownObservableBasedOnConfigScope(config: Config, refreshEndPointBody) {
		if (config.collectionVersionId) {
			return this.dynamicDropdownService.refreshCollectionDynamicDropdownConfig(
				config.collectionVersionId,
				config.key,
				refreshEndPointBody
			);
		} else if (config.flowVersionId) {
			return this.dynamicDropdownService.refreshFlowDynamicDropdownConfig(
				config.flowVersionId,
				config.key,
				refreshEndPointBody
			);
		} else {
			throw Error(`config ${config.label} does not have a collectionVersionId nor a flowVersionId`);
		}
	}
	listenToRefreshReferenceValuChanges(refresherConfigKey: string, configToRefresh: Config) {
		const refresherConfigControl = this.getControl(refresherConfigKey);
		this.refreshReferencesList$.push(
			refresherConfigControl!.valueChanges
				.pipe(
					startWith({}),
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
		const refreshersConfigs = this._configs.filter(c =>
			(configToRefresh.settings as DynamicDropdownSettings).refreshReferences?.find(key => key == c.key)
		);
		const requestBody = {};
		refreshersConfigs.forEach(c => {
			requestBody[c.key] = this.getControl(c.key)?.value;
		});
		return requestBody;
	}

	getControl(configKey: string) {
		return this.form.get(configKey);
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
	removeConfig(config: Config) {
		this.form.removeControl(config.key);
		this.configRemoved.emit(config);
	}
}
