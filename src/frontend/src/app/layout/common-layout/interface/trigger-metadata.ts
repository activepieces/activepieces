import { TriggerType } from '../model/enum/trigger-type.enum';

export interface TriggerMetadata {
	type: TriggerType;
	title: string;
	description: string;
	iconPath: string;
}
