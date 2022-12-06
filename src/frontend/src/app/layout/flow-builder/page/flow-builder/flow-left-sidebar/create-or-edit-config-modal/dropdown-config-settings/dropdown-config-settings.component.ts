import { Component, Input, OnInit } from '@angular/core';
import {
	ControlValueAccessor,
	FormBuilder,
	FormControl,
	FormGroup,
	NG_VALIDATORS,
	NG_VALUE_ACCESSOR,
} from '@angular/forms';
import { Store } from '@ngrx/store';
import { combineLatest, map, Observable, of, take, tap } from 'rxjs';
import { fadeInUp400ms } from 'src/app/layout/common-layout/animation/fade-in-up.animation';
import { DropdownOption } from 'src/app/layout/common-layout/model/dynamic-controls/dropdown-options';
import { ConfigScope } from 'src/app/layout/common-layout/model/enum/config-scope-type.enum';
import { ConfigSource } from 'src/app/layout/common-layout/model/enum/config-source';
import { ConfigType } from 'src/app/layout/common-layout/model/enum/config-type';
import { DropdownType } from 'src/app/layout/common-layout/model/enum/config.enum';
import { Config } from 'src/app/layout/common-layout/model/fields/variable/config';
import { Artifact } from 'src/app/layout/flow-builder/model/artifact.interface';
import { CodeService } from 'src/app/layout/flow-builder/service/code.service';
import { BuilderSelectors } from 'src/app/layout/flow-builder/store/selector/flow-builder.selector';
import { RefreshReferencesValidator } from '../../../validators/refreshReferencesValidator';

interface DynamicDropdownSettingsFromValue {
	refreshReferences: string[];
	optional?: boolean;
	artifactContent: Artifact;
}

interface StaticDropdownSettingsFromValue {
	options: any[];
	optional?: boolean;
}
@Component({
	selector: 'app-dropdown-config-settings',
	templateUrl: './dropdown-config-settings.component.html',
	styleUrls: ['./dropdown-config-settings.component.css'],
	providers: [
		{
			provide: NG_VALUE_ACCESSOR,
			multi: true,
			useExisting: DropdownConfigSettingsComponent,
		},
		{
			provide: NG_VALIDATORS,
			multi: true,
			useExisting: DropdownConfigSettingsComponent,
		},
	],
	animations: [fadeInUp400ms],
})
export class DropdownConfigSettingsComponent implements ControlValueAccessor, OnInit {
	@Input() currentConfigSource: ConfigSource;
	@Input() configToUpdate: Config | undefined;
	@Input() submitted = false;
	_currentConfigScope: ConfigScope;
	@Input() set currentConfigScope(scope) {
		this._currentConfigScope = scope;
		this.getRefreshReferences();
	}
	staticDropdownSettingsForm: FormGroup;
	staticSettingsFormValueChanged$: Observable<void>;
	dynamicSettingsFormValueChanged$: Observable<void>;
	dropdownTypeControl: FormControl;
	dynamicDropdownSettingsForm: FormGroup;
	dropdownTypeChanged$: Observable<DropdownType>;
	artifact$: Observable<Artifact>;
	ConfigSource = ConfigSource;
	refreshReferences$: Observable<DropdownOption[]>;
	onChange = val => {};
	constructor(private formBuilder: FormBuilder, private codeService: CodeService, private store: Store) {}
	ngOnInit(): void {
		this.dropdownTypeControl = new FormControl(DropdownType.STATIC);
		this.staticDropdownSettingsForm = this.formBuilder.group({
			options: new FormControl([]),
			optional: new FormControl(false),
		});
		const refreshReferencesValidator = RefreshReferencesValidator.createValidator(
			this.store.select(BuilderSelectors.selectAllConfigs).pipe(take(1)),
			this.configToUpdate
		);
		this.dynamicDropdownSettingsForm = this.formBuilder.group({
			refreshReferences: new FormControl([], [], refreshReferencesValidator),
			optional: new FormControl(false),
			artifactContent: new FormControl(this.codeService.dynamicDropdownDefaultArtifact()),
		});
		this.artifact$ = of(this.codeService.dynamicDropdownDefaultArtifact());
		this.setUpStaticDropdownSettingsListener();
		this.setUpDynamicDropdownSettingsListener();
		this.setUpTypeChangedListener();
		this.getRefreshReferences();
	}
	getRefreshReferences() {
		this.refreshReferences$ = combineLatest({
			collectionConfigs: this.store.select(BuilderSelectors.selectCurrentCollectionConfigs),
		}).pipe(
			map(res => {
				const allConfigs: Config[] = [...res.collectionConfigs];
				return allConfigs
					.filter(
						c => c.type === ConfigType.OAUTH2 || (c.type === ConfigType.DROPDOWN && c.key !== this.configToUpdate?.key)
					)
					.map(c => {
						return { label: c.label, value: c.key };
					});
			}),
			tap(rfs => {
				if (this.dynamicDropdownSettingsForm) {
					const refreshReferencesControl = this.dynamicDropdownSettingsForm.get('refreshReferences')!;
					const currentRefreshReferencesValue: string[] = refreshReferencesControl.value;
					const refreshReferencesValueCorrected = currentRefreshReferencesValue.filter(
						cr => !!rfs.find(r => r.value === cr)
					);
					refreshReferencesControl.setValue(refreshReferencesValueCorrected);
				}
			})
		);
	}
	setUpStaticDropdownSettingsListener() {
		this.staticSettingsFormValueChanged$ = this.staticDropdownSettingsForm.valueChanges.pipe(
			tap(() => {
				const valueToEmit = this.prepareStaticDropdownSettingsValue();
				this.onChange(valueToEmit);
			})
		);
	}
	prepareStaticDropdownSettingsValue() {
		const settingsControlValue: StaticDropdownSettingsFromValue = this.staticDropdownSettingsForm.value;
		const valueToEmit = {
			...settingsControlValue,
			dropdownType: this.dropdownTypeControl.value,
		};
		return valueToEmit;
	}
	setUpDynamicDropdownSettingsListener() {
		this.dynamicSettingsFormValueChanged$ = this.dynamicDropdownSettingsForm.valueChanges.pipe(
			tap(() => {
				const valueToEmit = this.prepareDynamicDropdownSettingsValue();
				this.onChange(valueToEmit);
			})
		);
	}
	prepareDynamicDropdownSettingsValue() {
		const settingsControlValue: DynamicDropdownSettingsFromValue = this.dynamicDropdownSettingsForm.value;
		const valueToEmit = {
			...settingsControlValue,
			dropdownType: this.dropdownTypeControl.value,
		};
		return valueToEmit;
	}
	setUpTypeChangedListener() {
		this.dropdownTypeChanged$ = this.dropdownTypeControl.valueChanges.pipe(
			tap((type: DropdownType) => {
				if (type === DropdownType.DYNAMIC) {
					this.onChange(this.prepareDynamicDropdownSettingsValue());
				} else if (type === DropdownType.STATIC) {
					this.onChange(this.prepareStaticDropdownSettingsValue());
				}
			})
		);
	}
	writeValue(obj: any): void {
		if (obj && obj.dropdownType) {
			this.dropdownTypeControl.setValue(obj.dropdownType);
			if (obj.dropdownType === DropdownType.STATIC) {
				this.staticDropdownSettingsForm.patchValue({ ...obj, optional: !obj.required });
			} else if (obj.dropdownType === DropdownType.DYNAMIC) {
				if (obj.artifactUrl) {
					this.artifact$ = this.codeService.readFile(obj.artifactUrl).pipe(
						tap(artifact => {
							this.dynamicDropdownSettingsForm.patchValue({ artifactContent: artifact });
						})
					);
				} else {
					this.artifact$ = of(obj.artifactContent);
					this.dynamicDropdownSettingsForm.patchValue({ artifactContent: obj.artifactContent });
				}

				this.dynamicDropdownSettingsForm.patchValue({ ...obj, optional: !obj.required });
			}
		}
	}
	validate() {
		const currentDropdownForm =
			this.dropdownTypeControl.value === DropdownType.DYNAMIC
				? this.dynamicDropdownSettingsForm
				: this.staticDropdownSettingsForm;
		if (!currentDropdownForm.valid) {
			return { invalid: true };
		}
		return null;
	}
	registerOnChange(fn: any): void {
		this.onChange = fn;

		this.onChange({ ...this.staticDropdownSettingsForm.value, dropdownType: this.dropdownTypeControl.value });
	}
	registerOnTouched(fn: any): void {}
	setDisabledState?(isDisabled: boolean): void {
		if (isDisabled) {
			this.staticDropdownSettingsForm.disable();
			this.dropdownTypeControl.disable();
			this.dynamicDropdownSettingsForm.disable();
		}
	}

	get DropDownType() {
		return DropdownType;
	}

	setDropdownTypeFormControlValue(type: DropdownType) {
		if (this.dropdownTypeControl.enabled) {
			this.dropdownTypeControl.setValue(type);
		}
	}
	isReferenceSelected(configKey: string) {
		const refreshReferencesValue: string[] = this.dynamicDropdownSettingsForm.get('refreshReferences')!.value;
		return !!refreshReferencesValue.find(r => r === configKey);
	}
}
