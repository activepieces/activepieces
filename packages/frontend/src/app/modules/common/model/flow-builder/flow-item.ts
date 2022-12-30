import { ActionType } from '../enum/action-type.enum';
import { TriggerType } from '../enum/trigger-type.enum';

export interface FlowItem {
	name: string;
	type?: ActionType | TriggerType;
	display_name: string;
	settings: any;
	valid?: boolean;

	// Render
	boundingBox?: BoundingBox;
	connectionsBox?: BoundingBox;
	xOffset?: number;
	yOffset?: number;
	yOffsetFromLastNode: number;
	width?: number;
	height?: number;
	next_action?: FlowItem;
}

export interface BoundingBox {
	width: number;
	height: number;
}
