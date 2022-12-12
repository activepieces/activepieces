import { Component, ChangeDetectionStrategy, Input } from '@angular/core';
import { FormBuilder, FormControl, NG_VALIDATORS, NG_VALUE_ACCESSOR } from '@angular/forms';
import { fadeInUp400ms } from '../../../animation/fade-in-up.animation';
import { ThemeService } from '../../../service/theme.service';
import { ConfigsFormComponent } from '../configs-form.component';
import { FrontEndConnectorConfig } from './connector-action-or-config';

@Component({
	selector: 'app-configs-form-for-connectors',
	templateUrl: '../configs-form.component.html',
	styleUrls: ['../configs-form.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
	providers: [
		{
			provide: NG_VALUE_ACCESSOR,
			multi: true,
			useExisting: ConfigsFormForConnectorsComponent,
		},
		{
			provide: NG_VALIDATORS,
			multi: true,
			useExisting: ConfigsFormForConnectorsComponent,
		},
	],
	animations: [fadeInUp400ms],
})
export class ConfigsFormForConnectorsComponent extends ConfigsFormComponent {
	constructor(fb: FormBuilder, themeService: ThemeService) {
		super(fb, themeService);
	}
	@Input() override set configs(value: { configs: FrontEndConnectorConfig[]; triggerChangeDetection: boolean }) {
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
}
