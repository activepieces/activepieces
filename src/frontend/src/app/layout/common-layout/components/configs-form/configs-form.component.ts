import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import {
	ControlValueAccessor,
	FormBuilder,
	FormControl,
	FormGroup,
	NG_VALIDATORS,
	NG_VALUE_ACCESSOR,
	ValidatorFn,
} from '@angular/forms';
import { map, Observable, shareReplay, tap } from 'rxjs';

import { fadeInUp400ms } from '../../animation/fade-in-up.animation';
import { DynamicDropdownResult } from '../../model/dynamic-controls/dynamic-dropdown-result';
import { ConfigType } from '../../model/enum/config-type';
import { Config } from '../../model/fields/variable/config';
import { OAuth2ConfigSettings } from '../../model/fields/variable/config-settings';
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
	form!: FormGroup;
	OnChange = value => {};
	OnTouched = () => {};
	updateValueOnChange$: Observable<void> = new Observable<void>();
	refreshReferencesList$: Observable<void>[] = [];
	dynamicDropdownsObservablesMap: Map<ConfigKey, Observable<DynamicDropdownResult>> = new Map();
	configType = ConfigType;
	constructor(
		private dynamicDropdownService: DynamicDropdownService,
		private fb: FormBuilder,
		public themeService: ThemeService
	) {}

	ngOnInit(): void {
		this.createForm();
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
			// if (c.settings?.required || c.settings?.required === undefined) {
			// 	validators.push(Validators.required);
			// }
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

	getControl(configKey: string) {
		return this.form.get(configKey);
	}
	getDynamicDropdownObservable(configKey: string) {
		return this.dynamicDropdownsObservablesMap.get(configKey) as Observable<DynamicDropdownResult>;
	}

	getAuthConfigSettings(config: Config) {
		return config.settings as OAuth2ConfigSettings;
	}

	removeConfig(config: Config) {
		this.form.removeControl(config.key);
		this.configRemoved.emit(config);
	}
}
