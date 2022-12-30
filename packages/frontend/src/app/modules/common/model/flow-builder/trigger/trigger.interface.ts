import { TriggerType } from '../../enum/trigger-type.enum';
import { FlowItem } from '../flow-item';

export interface Trigger extends FlowItem {
	type?: TriggerType;
	display_name: string;
	name: string;
	next_action?: FlowItem;
	epochCreationTime?: number;
	epochUpdateTime?: number;
}
