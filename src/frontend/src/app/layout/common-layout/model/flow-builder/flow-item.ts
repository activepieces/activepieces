import { ActionType } from '../enum/action-type.enum';
import { TriggerType } from '../enum/trigger-type.enum';

export interface FlowItem {
	name: string;
	type?: ActionType | TriggerType;
	displayName: string;
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
	nextAction?: FlowItem;
}

export interface BoundingBox {
	width: number;
	height: number;
}
