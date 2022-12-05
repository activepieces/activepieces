import { Config } from './config';
import { ShortTextSettings } from './config-settings';

export class ShortTextVariable extends Config {
	override settings: ShortTextSettings;
	override value: string;
}
