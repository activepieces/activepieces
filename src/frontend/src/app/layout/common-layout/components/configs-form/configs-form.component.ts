import { InputUiType } from '@activepieces/components';
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
import { catchError, map, Observable, of, shareReplay, tap } from 'rxjs';
import { fadeInUp400ms } from '../../animation/fade-in-up.animation';
import { DropdownItemOption } from '../../model/fields/variable/subfields/dropdown-item-option';
import { ThemeService } from '../../service/theme.service';
import { FrontEndConnectorConfig } from './configs-form-for-connectors/connector-action-or-config';
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
	@Input() set configs(
		value: FrontEndConnectorConfig[] | { configs: FrontEndConnectorConfig[]; triggerChangeDetection: boolean }
	) {
		if (Array.isArray(value)) {
			this._configs = value;
		}
	}
	_configs: FrontEndConnectorConfig[] = [];
	@Input() submitted = false;
	@Input() showSlider = false;
	@Input() allowRemoveConfig = false;
	@Input() accessToken: string = '';
	@Output() configRemoved: EventEmitter<FrontEndConnectorConfig> = new EventEmitter();

	form!: FormGroup;
	OnChange = value => {};
	OnTouched = () => {};
	updateValueOnChange$: Observable<void> = new Observable<void>();
	refreshReferencesList$: Observable<void>[] = [];
	configType = InputUiType;
	optionsObservables$: { [key: ConfigKey]: Observable<DropdownItemOption[]> } = {};
	dropdownsLoadingFlags$: { [key: ConfigKey]: Observable<boolean> } = {};
	constructor(private fb: FormBuilder, public themeService: ThemeService) {}

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
			if (c.required) {
				validators.push(Validators.required);
			}
			controls[c.key] = new FormControl(c.value, validators);

			this.contructDropdownObservables(c);
		});
		this.form = this.fb.group(controls);
		this.updateValueOnChange$ = this.form.valueChanges.pipe(
			tap(value => {
				this.OnChange(value);
			}),
			map(() => void 0)
		);
	}

	private contructDropdownObservables(c: FrontEndConnectorConfig) {
		if (c.options) {
			this.optionsObservables$[c.key] = c.options.pipe(
				shareReplay(1),
				catchError(err => {
					console.error(err);
					return of([]);
				})
			);
			this.dropdownsLoadingFlags$[c.key] = this.optionsObservables$[c.key].pipe(
				map(val => {
					if (Array.isArray(val)) {
						console.error(`Activepieces- Config ${c.label} options are not returned in array form--> ${val}`);
					}
					return true;
				})
			);
		}
	}

	getControl(configKey: string) {
		return this.form.get(configKey);
	}

	removeConfig(config: FrontEndConnectorConfig) {
		this.form.removeControl(config.key);
		this.configRemoved.emit(config);
	}
}
