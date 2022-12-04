import { Config } from './config';
import { OAuth2ConfigSettings } from './config-settings';

export class OAuth2Variable extends Config {
	override settings: OAuth2ConfigSettings;
}
