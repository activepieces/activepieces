import { UUID } from 'angular2-uuid';
import { ConfigSource as ConfigSource } from '../../enum/config-source';
import {
	BaseConfigSettings,
	DropdownSettings,
	DynamicDropdownSettings,
	OAuth2ConfigSettings,
	ShortTextSettings,
	StaticDropdownSettings,
} from './config-settings';
import { ConfigType } from '../../enum/config-type';

export class Config {
	key: string;
	type: ConfigType;
	label: string;
	hintText?: string;
	settings:
		| DropdownSettings
		| DynamicDropdownSettings
		| OAuth2ConfigSettings
		| BaseConfigSettings
		| ShortTextSettings
		| StaticDropdownSettings;
	source: ConfigSource;
	value: any;
	collectionVersionId?: UUID;
	flowVersionId?: UUID;
	placeholder?: string;
}
