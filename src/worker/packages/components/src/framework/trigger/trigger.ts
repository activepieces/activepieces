import type {TriggerType} from './trigger-type';
import {ConfigurationValue} from "../config/configuration-value.model";

export type Trigger = {
	name: string;
	description: string;
	type: TriggerType;
	onEnable: (config: ConfigurationValue) => Promise<Record<string, any>>;
	onDisable: (config: ConfigurationValue) => Promise<Record<string, any>>;
	run: (config: ConfigurationValue) => Promise<Record<string, any>>;
};
