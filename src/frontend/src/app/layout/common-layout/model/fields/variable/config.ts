import { UUID } from 'angular2-uuid';
import { OAuth2ConfigSettings } from './config-settings';
import { ConfigType } from '../../enum/config-type';

export class Config {
	key: string;
	type: ConfigType;
	label: string;
	settings?: OAuth2ConfigSettings;
	value: any;
	collectionVersionId?: UUID;
	flowVersionId?: UUID;
	placeholder?: string;
	description?: string;
}
