import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
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
import { catchError, map, mapTo, Observable, of, shareReplay, startWith, Subject, tap } from 'rxjs';
import { AuthConfigDropdownValue } from 'src/app/layout/flow-builder/page/flow-builder/flow-right-sidebar/new-edit-piece-sidebar/edit-step-accordion/input-forms/component-input-form/component-input-form.component';
import { ActionMetaService } from 'src/app/layout/flow-builder/service/action-meta.service';

import { fadeInUp400ms } from '../../animation/fade-in-up.animation';
import { DropdownItemOption } from '../../model/fields/variable/subfields/dropdown-item-option';
import { ThemeService } from '../../service/theme.service';
import { FrontEndConnectorConfig, InputType } from './connector-action-or-config';
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
export class ConfigsFormComponent implements OnInit, ControlValueAccessor {
	@Input() set configs(value: { configs: FrontEndConnectorConfig[]; triggerChangeDetection: boolean }) {
		this._configs = value.configs;
		const controlUpdateSettings = !value.triggerChangeDetection ? { emitEvent: false } : {};
		if (this.form) {
			const configKeys = this._configs.map(c => c.key);
			const currentControlsNames = Object.keys(this.form.controls);
			const newConfigs = this._configs.filter(c => !currentControlsNames.find(cn => cn === c.key));
			const namesOfControlsToRemove = currentControlsNames.filter(cn => !configKeys.includes(cn));
			newConfigs.forEach(c => {
				this.form.addControl(c.key, new FormControl(c.value), controlUpdateSettings);
			});
			namesOfControlsToRemove.forEach(cn => {
				this.form.removeControl(cn, controlUpdateSettings);
			});
			if (value.triggerChangeDetection) {
				this.OnChange(this.form.value);
			}
		}
	}
	_configs: FrontEndConnectorConfig[] = [];
	@Input() submitted = false;
	@Input() showSlider = false;
	@Input() allowRemoveConfig = false;
	@Input() accessToken: string = '';
	@Output() configRemoved: EventEmitter<FrontEndConnectorConfig> = new EventEmitter();
	@Input() newAuthConfigValue$: Subject<{
		authConfig: AuthConfigDropdownValue;
		actionName: string;
		componentName: string;
	}> = new Subject();
	form!: FormGroup;
	OnChange = value => {};
	OnTouched = () => {};
	refreshDropwdowns$: Observable<void>;
	updateValueOnChange$: Observable<void> = new Observable<void>();
	configType = InputType;
	optionsObservables$: { [key: ConfigKey]: Observable<DropdownItemOption[]> } = {};
	dropdownsLoadingFlags$: { [key: ConfigKey]: Observable<boolean> } = {};
	constructor(
		private fb: FormBuilder,
		public themeService: ThemeService,
		private actionMetaDataService: ActionMetaService
	) {}

	ngOnInit(): void {
		this.createForm();
		this.refreshDropwdowns$ = this.newAuthConfigValue$?.pipe(
			tap(req => {
				this._configs.forEach(c => {
					if (c.type === InputType.SELECT) {
						this.contructDropdownObservable(c, req.authConfig, req.actionName, req.componentName);
					}
				});
			}),
			mapTo(void 0)
		);
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
			if (c.required) {
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

	getControl(configKey: string) {
		return this.form.get(configKey);
	}

	removeConfig(config: FrontEndConnectorConfig) {
		this.form.removeControl(config.key);
		this.configRemoved.emit(config);
	}
	contructDropdownObservable(
		dropdownConfig: FrontEndConnectorConfig,
		authConfig: AuthConfigDropdownValue,
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
}
