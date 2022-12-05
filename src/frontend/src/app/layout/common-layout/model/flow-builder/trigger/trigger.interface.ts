import { TriggerType } from '../../enum/trigger-type.enum';
import { FlowItem } from '../flow-item';

export interface Trigger extends FlowItem {
	type?: TriggerType;
	displayName: string;
	name: string;
	nextAction?: FlowItem;
	epochCreationTime?: number;
	epochUpdateTime?: number;
}
