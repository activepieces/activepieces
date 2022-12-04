import { AddButtonAndFlowItemNameContainer } from '../../common-layout/model/flow-builder/flow-add-button';
import { Point } from '../../common-layout/model/helper/point';
import { FlowItem } from '../../common-layout/model/flow-builder/flow-item';
import {
	ARC_LENGTH,
	EMPTY_LOOP_ADD_BUTTON_HEIGHT,
	FLOW_ITEM_HEIGHT,
	FLOW_ITEM_WIDTH,
	SPACE_BETWEEN_ITEM_CONTENT_AND_LINE,
	VERTICAL_LINE_LENGTH,
} from '../page/flow-builder/flow-item-tree/flow-item/flow-item-connection/draw-utils';
import { ActionType } from '../../common-layout/model/enum/action-type.enum';
import { LoopOnItemActionInterface } from '../../common-layout/model/flow-builder/actions/loop-action.interface';

export class FlowRenderUtil {
	constructor() {}

	public static isButtonWithinCandidateDistance(addButton: AddButtonAndFlowItemNameContainer, dropPoint: Point) {
		if (dropPoint === null) return false;
		const buttonRect = addButton.htmlElementForButton.getBoundingClientRect();
		const distance = FlowRenderUtil.dist(buttonRect, dropPoint);
		return distance <= ACCEPTED_DISTANCE_BETWEEN_DROP_POINT_AND_ADD_BUTTON;
	}

	public static dist(p1: { x: number; y: number }, p2: { x: number; y: number }) {
		const dx = p1.x - p2.x;
		const dy = p1.y - p2.y;
		return Math.sqrt(dx * dx + dy * dy);
	}

	public static buildBoxes(flowItem: FlowItem | undefined): void {
		if (!flowItem) {
			return;
		}
		flowItem.boundingBox = {
			width: FLOW_ITEM_WIDTH,
			height: FLOW_ITEM_HEIGHT,
		};
		if (flowItem.type == ActionType.LOOP_ON_ITEMS) {
			const loopItem = flowItem as LoopOnItemActionInterface;
			if (loopItem.firstLoopAction !== undefined && loopItem.firstLoopAction !== null) {
				this.buildBoxes(loopItem.firstLoopAction);
			}
			const subGraph = loopItem.firstLoopAction
				? loopItem.firstLoopAction.boundingBox!.height
				: EMPTY_LOOP_ADD_BUTTON_HEIGHT + VERTICAL_LINE_LENGTH;
			const svgBoxHeight =
				SPACE_BETWEEN_ITEM_CONTENT_AND_LINE +
				VERTICAL_LINE_LENGTH +
				ARC_LENGTH +
				ARC_LENGTH +
				VERTICAL_LINE_LENGTH +
				SPACE_BETWEEN_ITEM_CONTENT_AND_LINE +
				subGraph +
				SPACE_BETWEEN_ITEM_CONTENT_AND_LINE +
				ARC_LENGTH +
				VERTICAL_LINE_LENGTH;
			flowItem.connectionsBox = {
				width: FLOW_ITEM_WIDTH,
				height: svgBoxHeight,
			};
		} else {
			flowItem.connectionsBox = {
				width: FLOW_ITEM_WIDTH,
				height: SPACE_BETWEEN_ITEM_CONTENT_AND_LINE + VERTICAL_LINE_LENGTH,
			};
		}
		flowItem.boundingBox.height += flowItem.connectionsBox.height;
		this.buildBoxes(flowItem.nextAction);
		if (flowItem.nextAction !== undefined && flowItem.nextAction !== null) {
			flowItem.connectionsBox.height += SPACE_BETWEEN_ITEM_CONTENT_AND_LINE;
			flowItem.boundingBox.height += SPACE_BETWEEN_ITEM_CONTENT_AND_LINE + flowItem.nextAction?.boundingBox!.height;
		}
	}

	public static buildCoordinates(piece: FlowItem): void {
		if (!piece) {
			return;
		}

		const simpleAction = piece;
		if (simpleAction.nextAction) {
			simpleAction.nextAction.xOffset = 0;
			/*      simpleAction.nextAction.yOffset = FlowRendererService.SPACING_VERTICAL;*/
			this.buildCoordinates(simpleAction.nextAction);
		}
	}
}

//check scss in simple-line-connection
export const ACCEPTED_DISTANCE_BETWEEN_DROP_POINT_AND_ADD_BUTTON = 250;
