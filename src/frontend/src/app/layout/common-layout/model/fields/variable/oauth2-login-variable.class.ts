import { OAuth2Variable } from './oauth2-variable.class';
import { OAuth2ConfigSettings } from './config-settings';

export class Oauth2LoginVariable extends OAuth2Variable {
	override settings: OAuth2ConfigSettings;
}
