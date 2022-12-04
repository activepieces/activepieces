import { Pipe, PipeTransform } from '@angular/core';
import { DropdownOption } from 'src/app/layout/common-layout/model/dynamic-controls/dropdown-options';
import { Config } from 'src/app/layout/common-layout/model/fields/variable/config';
import { OAuth2ConfigSettings } from 'src/app/layout/common-layout/model/fields/variable/config-settings';

@Pipe({
	name: 'connectorAuthConfigsFinder',
	pure: true,
})
export class ConnectorAuthConfigsFinder implements PipeTransform {
	transform(config: Config, allAuthConfigs: Config[] | null): DropdownOption[] {
		if (!allAuthConfigs) return [];
		return allAuthConfigs
			.filter(c => (c.settings as OAuth2ConfigSettings).authUrl === (config.settings as OAuth2ConfigSettings).authUrl)
			.map(c => {
				return { label: c.label, value: `\${configs.${c.key}}` };
			});
	}
}
