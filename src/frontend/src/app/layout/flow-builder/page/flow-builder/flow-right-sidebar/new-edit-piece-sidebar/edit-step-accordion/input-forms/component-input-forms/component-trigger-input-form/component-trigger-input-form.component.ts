import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, NG_VALIDATORS, NG_VALUE_ACCESSOR, Validators } from '@angular/forms';
import { Config } from '@fortawesome/fontawesome-svg-core';
import { map, Observable, of, tap } from 'rxjs';
import { fadeInUp400ms } from 'src/app/layout/common-layout/animation/fade-in-up.animation';
import {
	ComponnentConfigsForActionsOrTriggers,
	FrontEndConnectorConfig,
} from 'src/app/layout/common-layout/components/configs-form/connector-action-or-config';
import { DropdownOption } from 'src/app/layout/common-layout/model/dropdown-options';
import { ActionMetaService } from 'src/app/layout/flow-builder/service/action-meta.service';
import { ComponentTriggerInputFormSchema } from '../../input-forms-schema';

declare type TriggerDropdownOption = {
	label: {
		name: string;
		description: string;
	};
	value: { triggerName: string; configs: FrontEndConnectorConfig[]; separator?: boolean };
	disabled?: boolean;
};

const TRIGGER_FORM_CONTROL_NAME = 'triggers';
const CONFIGS_FORM_CONTROL_NAME = 'configs';

@Component({
	selector: 'app-component-trigger-input-form',
	templateUrl: './component-trigger-input-form.component.html',
	styleUrls: ['./component-trigger-input-form.component.css'],
	providers: [
		{
			provide: NG_VALUE_ACCESSOR,
			multi: true,
			useExisting: ComponentTriggerInputFormComponent,
		},
		{
			provide: NG_VALIDATORS,
			multi: true,
			useExisting: ComponentTriggerInputFormComponent,
		},
	],
	animations: [fadeInUp400ms],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ComponentTriggerInputFormComponent {
	readonly TRIGGER_FORM_CONTROL_NAME = TRIGGER_FORM_CONTROL_NAME;
	readonly CONFIGS_FORM_CONTROL_NAME = CONFIGS_FORM_CONTROL_NAME;
	componentForm: FormGroup;
	initialSetup$: Observable<TriggerDropdownOption[]>;
	componentName: string;
	intialComponentTriggerInputFormValue: { trigger_name: string; input: { [key: string]: any } } | null;
	selectedTrigger$: Observable<any>;
	triggers$: Observable<TriggerDropdownOption[]>;
	valueChanges$: Observable<void>;
	triggerDropdownValueChanged$: Observable<{ triggerName: string; configs: FrontEndConnectorConfig[] }>;
	onChange = (value: any) => {};
	onTouch = () => {};
	updateOrAddConfigModalClosed$: Observable<Config>;
	allAuthConfigs$: Observable<DropdownOption[]>;
	constructor(
		private fb: FormBuilder,
		private actionMetaDataService: ActionMetaService,
		private cd: ChangeDetectorRef
	) {
		this.buildForm();
		this.triggerDropdownValueChanged$ = this.componentForm.get(TRIGGER_FORM_CONTROL_NAME)!.valueChanges.pipe(
			tap(val => {
				this.triggerSelectValueChanged(val);
			})
		);
	}

	customSearchFn(term: string, item: any) {
		const termLowerCase = term.toLowerCase();
		const result =
			item.label.url.toLowerCase().indexOf(termLowerCase) > -1 ||
			item.label.summary.toLowerCase().indexOf(termLowerCase) > -1 ||
			item.label.description.toLowerCase().indexOf(termLowerCase) > -1 ||
			item.label.requestType.toLowerCase().indexOf(termLowerCase) > -1;
		return result;
	}

	private buildForm() {
		this.componentForm = this.fb.group({
			[TRIGGER_FORM_CONTROL_NAME]: new FormControl(null, Validators.required),
		});
		this.valueChanges$ = this.componentForm.valueChanges.pipe(
			tap(() => {
				this.onChange(this.getFormattedFormData());
			})
		);
	}

	fetchTriggers(componentName: string) {
		const component$ = this.actionMetaDataService.connectorComponents().pipe(
			map(comps => {
				const component = comps.find(c => c.name === componentName);
				if (!component) {
					throw new Error(`Activepieces- component not found: ${componentName}`);
				}
				return component;
			})
		);
		this.triggers$ = component$.pipe(
			map(component => {
				const triggersKeys = Object.keys(component.triggers);
				return triggersKeys.map(triggerName => {
					const trigger = component.triggers[triggerName];
					return {
						value: {
							triggerName: trigger.name,
							configs: trigger.configs.map(c => ComponnentConfigsForActionsOrTriggers.convertToFrontEndConfig(c)),
						},
						label: { name: trigger.name, description: trigger.description },
					};
				});
			})
		);
		this.initialSetup$ = this.triggers$.pipe(
			tap(items => {
				if (this.intialComponentTriggerInputFormValue && this.intialComponentTriggerInputFormValue.trigger_name) {
					this.componentForm
						.get(TRIGGER_FORM_CONTROL_NAME)!
						.setValue(
							items.find(i => i.value.triggerName === this.intialComponentTriggerInputFormValue?.trigger_name)?.value,
							{
								emitEvent: false,
							}
						);
					this.selectedTrigger$ = of(
						items.find(it => it.value.triggerName === this.intialComponentTriggerInputFormValue?.trigger_name)
					).pipe(
						tap(selectedTrigger => {
							if (selectedTrigger) {
								const configs = [...selectedTrigger.value.configs];
								const configsValues = this.intialComponentTriggerInputFormValue?.input;
								if (configsValues) {
									Object.keys(configsValues).forEach(key => {
										const config = configs.find(c => c.key === key);
										if (config) {
											config.value = configsValues[key];
										}
									});
								}
								this.componentForm.addControl(CONFIGS_FORM_CONTROL_NAME, new FormControl([...configs]), {
									emitEvent: false,
								});
								this.cd.detectChanges();
							}
						})
					);
				}
			})
		);
	}
	writeValue(obj: ComponentTriggerInputFormSchema): void {
		this.intialComponentTriggerInputFormValue = obj;
		this.componentName = obj.component_name;
		this.componentForm.get(TRIGGER_FORM_CONTROL_NAME)?.setValue(undefined, { emitEvent: false });
		this.componentForm.removeControl(CONFIGS_FORM_CONTROL_NAME, { emitEvent: false });
		this.fetchTriggers(obj.component_name);
	}

	registerOnChange(fn: any): void {
		this.onChange = fn;
	}

	registerOnTouched(fn: any): void {
		this.onTouch = fn;
	}

	validate() {

		if (this.componentForm.valid) return null;
		return { invalid: true };
	}

	triggerSelectValueChanged(selectedActionValue: { triggerName: string; configs: FrontEndConnectorConfig[] } | null) {
		if (selectedActionValue) {
			this.triggerSelected(selectedActionValue);

			this.selectedTrigger$ = this.triggers$.pipe(
				map(items => {
					console.log(items.find(it => it.value.triggerName === selectedActionValue.triggerName));
					return items.find(it => it.value.triggerName === selectedActionValue.triggerName);
				})
			);
		}
	}

	private triggerSelected(selectedActionValue: { triggerName: string; configs: FrontEndConnectorConfig[] }) {
		const configsForm = this.componentForm.get(CONFIGS_FORM_CONTROL_NAME);
		if (!configsForm) {
			this.componentForm.addControl(CONFIGS_FORM_CONTROL_NAME, new FormControl([...selectedActionValue.configs]));
		} else {
			configsForm.setValue([...selectedActionValue.configs]);
		}
	}

	getFormattedFormData(): { trigger_name: string; input: { [configKey: string]: any } } {
		const trigger = this.componentForm.get(TRIGGER_FORM_CONTROL_NAME)!.value;
		const configs = this.componentForm.get(CONFIGS_FORM_CONTROL_NAME)?.value || {};
		const res = {
			trigger_name: trigger?.triggerName,
			input: {
				...configs,
			},
		};
		console.log(res);
		return res;
	}
	triggerDropdownCompareFn(item, selected) {
		return item.value.triggerName === selected.triggerName;
	}
	setDisabledState?(isDisabled: boolean): void {
		if (isDisabled) {
			this.componentForm.disable();
		} else {
			this.componentForm.enable();
		}
	}
}
