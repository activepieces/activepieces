import { Artifact } from 'src/app/layout/flow-builder/model/artifact.interface';

import { DropdownType } from '../../enum/config.enum';
import { Oauth2UserInputType } from './subfields/oauth2-user-input.type';
import { DropdownItemOption } from './subfields/dropdown-item-option';

export class ConfigSettings {
	required: boolean;
}

export class BaseConfigSettings extends ConfigSettings {}

export class ShortTextSettings extends ConfigSettings {
	dropdown: boolean;
	dropdownOptions: DropdownItemOption[];
}
export class DropdownSettings extends ConfigSettings {
	dropdownType: DropdownType;
}

export class StaticDropdownSettings extends DropdownSettings {
	options: DropdownOption[];
}

export class DynamicDropdownSettings extends DropdownSettings {
	refreshReferences: string[]; //config key
	artifactContent?: Artifact;
	artifactUrl: string;
}

export class OAuth2ConfigSettings extends ConfigSettings {
	authUrl: string = '';
	tokenUrl: string = '';
	refreshUrl: string = '';
	clientId: string = '';
	scope: string = '';
	clientSecret: string = '';
	configParent?: {
		configKey: string;
	};
	userInputType: Oauth2UserInputType = Oauth2UserInputType.LOGIN;
	responseType: string = 'code';
}

export interface DropdownOption {
	value: any;
	label: string;
}
