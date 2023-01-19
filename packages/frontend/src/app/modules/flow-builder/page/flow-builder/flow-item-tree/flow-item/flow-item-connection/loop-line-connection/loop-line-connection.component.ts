import {
	ChangeDetectionStrategy,
	Component,
	ElementRef,
	Input,
	OnChanges,
	OnInit,
	SimpleChanges,
	ViewChild,
} from '@angular/core';
import { Store } from '@ngrx/store';
import { RightSideBarType } from 'packages/frontend/src/app/modules/common/model/enum/right-side-bar-type.enum';
import { AddButtonAndFlowItemNameContainer } from 'packages/frontend/src/app/modules/common/model/flow-builder/flow-add-button';
import { FlowRendererService } from 'packages/frontend/src/app/modules/flow-builder/service/flow-renderer.service';
import {
	ADD_BUTTON_SIZE,
	ARC_LENGTH,
	ARROW_HEAD_SIZE,
	Drawer,
	EMPTY_LOOP_ADD_BUTTON_HEIGHT,
	FLOW_ITEM_HEIGHT,
	FLOW_ITEM_WIDTH,
	HORZIONTAL_LINE_LENGTH,
	SPACE_BETWEEN_ITEM_CONTENT_AND_LINE,
	VERTICAL_LINE_LENGTH,
	AFTER_NESTED_LOOP_LINE_LENGTH,
} from '../draw-utils';
import { AddButtonType } from '../../../../../../../common/model/enum/add-button-type';
import { FlowsActions } from '../../../../../../store/flow/flows.action';
import { Observable } from 'rxjs';
import { LoopOnItemsAction } from '@activepieces/shared';
import { FlowItem, FlowItemRenderInfo } from 'packages/frontend/src/app/modules/common/model/flow-builder/flow-item';

@Component({
	selector: 'app-loop-line-connection',
	templateUrl: './loop-line-connection.component.html',
	styleUrls: ['./loop-line-connection.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoopLineConnectionComponent implements OnChanges, OnInit {
	@ViewChild('addButton') addButtonView: ElementRef;
	@ViewChild('emptyLoopAddButton') emptyLoopAddButtonView: ElementRef;
	@ViewChild('afterLoopAddButton') afterLoopAddButton: ElementRef;
	@Input() insideLoop = false;
	afterLoopArrowCommand = '';
	startingLoopLineDrawCommand = '';
	arrowHeadLeft: number = 0;
	arrowHeadTop: number = 0;
	drawer: Drawer = new Drawer();
	addButtonAndFlowItemNameContainer: AddButtonAndFlowItemNameContainer;
	addButtonTop = '0px';
	addButtonLeft = '0px';
	emptyLoopAddButtonTopOffset = '0px';
	emptyLoopAddButtonLeftOffset = '0px';
	afterLoopAddButtonTop = '0px';
	afterLoopAddButtonLeft = '0px';
	afterLoopArrowHeadLeft: number = 0;
	afterLoopArrowHeadTop: number = 0;
	showEmptyLoopAddButtonBoxShadow = false;
	svgHeight: number = 0;
	addButtonSize = { width: `${ADD_BUTTON_SIZE.width}px`, height: `${ADD_BUTTON_SIZE.height}px` };
	_flowItem: LoopOnItemsAction & FlowItemRenderInfo;

	showDropArea$: Observable<boolean> = new Observable<boolean>();

	@Input() viewMode: boolean;

	@Input() set flowItem(value: LoopOnItemsAction & FlowItemRenderInfo) {
		this._flowItem = value;
		this.svgHeight = this.flowItem.connectionsBox!.height;
		this.writeLines();
		this.calculateOffsetBeforeFirstAction();
		this.calculateOffsetAfterLoop();
		this.calculateEmptyLoopAddButton();
	}

	get flowItem() {
		return this._flowItem;
	}

	constructor(private store: Store, private flowRendererService: FlowRendererService) {
		this.showDropArea$ = this.flowRendererService.draggingSubject;
	}
	ngOnInit(): void {
		this.writeLines();
		this.calculateOffsetBeforeFirstAction();
		this.calculateOffsetAfterLoop();
		this.calculateEmptyLoopAddButton();
	}

	writeLines() {
		const commands: string[] = [];
		let childFlowsGraphHeight: number;
		if (this.flowItem.firstLoopAction === undefined || this.flowItem.firstLoopAction === null) {
			childFlowsGraphHeight = EMPTY_LOOP_ADD_BUTTON_HEIGHT + SPACE_BETWEEN_ITEM_CONTENT_AND_LINE + VERTICAL_LINE_LENGTH;
		} else {
			childFlowsGraphHeight = (this.flowItem.firstLoopAction as FlowItem).boundingBox!.height;
		}
		commands.push(...this.writeStartingLine());
		commands.push(...this.writeLoopClosing(childFlowsGraphHeight));
		commands.push(...this.writeAfterArrow(childFlowsGraphHeight));
		this.startingLoopLineDrawCommand = commands.join(' ');
	}

	writeStartingLine() {
		const commands: string[] = [];
		commands.push(this.drawer.move(FLOW_ITEM_WIDTH / 2, SPACE_BETWEEN_ITEM_CONTENT_AND_LINE));
		commands.push(this.drawer.drawVerticalLine(VERTICAL_LINE_LENGTH));
		commands.push(this.drawer.drawArc(false, true, true));
		commands.push(this.drawer.drawHorizontalLine(HORZIONTAL_LINE_LENGTH));
		commands.push(this.drawer.drawArc(false, true, false));
		commands.push(this.drawer.drawVerticalLine(VERTICAL_LINE_LENGTH));
		return commands;
	}

	writeLoopClosing(childFlowsGraphHeight: number) {
		const commands: string[] = [];
		commands.push(this.drawer.move(0, SPACE_BETWEEN_ITEM_CONTENT_AND_LINE));
		if (!this.flowItem.firstLoopAction) {
			commands.push(this.drawer.move(0, EMPTY_LOOP_ADD_BUTTON_HEIGHT));
			commands.push(this.drawer.move(0, SPACE_BETWEEN_ITEM_CONTENT_AND_LINE));
			commands.push(this.drawer.drawVerticalLine(VERTICAL_LINE_LENGTH));
		} else {
			commands.push(this.drawer.move(0, childFlowsGraphHeight));
		}
		commands.push(this.drawer.drawArc(true, true, false));
		commands.push(this.drawer.drawHorizontalLine(-2.5 * HORZIONTAL_LINE_LENGTH));
		commands.push(this.drawer.drawArc(true, false, false));
		const returningVerticalLineToBeginingLength = this.findReturningVerticalLineLength(childFlowsGraphHeight);
		commands.push(this.drawer.drawVerticalLine(-returningVerticalLineToBeginingLength));
		commands.push(this.drawer.drawArc(false, false, false));
		commands.push(this.drawer.drawHorizontalLine(HORZIONTAL_LINE_LENGTH));
		return commands;
	}

	writeAfterArrow(childFlowsGraphHeight: number) {
		const commands: string[] = [];
		commands.push(
			this.drawer.move(
				0.5 * HORZIONTAL_LINE_LENGTH - ARC_LENGTH,
				ARC_LENGTH + VERTICAL_LINE_LENGTH + SPACE_BETWEEN_ITEM_CONTENT_AND_LINE + childFlowsGraphHeight + ARC_LENGTH
			)
		);

		if (!this.insideLoop) {
			commands.push(this.drawer.drawVerticalLine(VERTICAL_LINE_LENGTH));
		} else {
			commands.push(this.drawer.drawVerticalLine(AFTER_NESTED_LOOP_LINE_LENGTH));
		}
		return commands;
	}

	insertAddButtonToRendererServiceListOfContainers() {
		if (this.flowItem.firstLoopAction) {
			this.addButtonAndFlowItemNameContainer = new AddButtonAndFlowItemNameContainer(
				this.addButtonView.nativeElement,
				this.flowItem.name
			);
			this.flowRendererService.addButtonsWithStepNamesContainers.push(this.addButtonAndFlowItemNameContainer);
		} else {
			this.addButtonAndFlowItemNameContainer = new AddButtonAndFlowItemNameContainer(
				this.emptyLoopAddButtonView.nativeElement,
				this.flowItem.name
			);
			this.flowRendererService.addButtonsWithStepNamesContainers.push(this.addButtonAndFlowItemNameContainer);
		}
	}

	calculateEmptyLoopAddButton() {
		const leftOffset = HORZIONTAL_LINE_LENGTH + 11;
		const topOffset = VERTICAL_LINE_LENGTH * 2 + ARC_LENGTH * 2 + 2 * SPACE_BETWEEN_ITEM_CONTENT_AND_LINE;
		this.emptyLoopAddButtonTopOffset = `${topOffset}px`;
		this.emptyLoopAddButtonLeftOffset = `calc(50% + ${leftOffset}px`;
	}

	calculateOffsetBeforeFirstAction() {
		const lineStrokeOffset = 1.5;
		const leftOffset = FLOW_ITEM_WIDTH / 2 + ARC_LENGTH + HORZIONTAL_LINE_LENGTH + ARC_LENGTH;
		const topOffset =
			VERTICAL_LINE_LENGTH + ARC_LENGTH + ARC_LENGTH + VERTICAL_LINE_LENGTH - SPACE_BETWEEN_ITEM_CONTENT_AND_LINE;
		this.arrowHeadLeft = leftOffset - (ARROW_HEAD_SIZE.width / 2.0 + lineStrokeOffset);
		this.arrowHeadTop = topOffset + ARROW_HEAD_SIZE.height;

		this.addButtonLeft = leftOffset - ADD_BUTTON_SIZE.width / 2.0 + 'px';
		this.addButtonTop = topOffset - VERTICAL_LINE_LENGTH / 2.0 + 'px';
	}

	calculateOffsetAfterLoop() {
		const topOffset =
			this.flowItem.connectionsBox!.height -
			SPACE_BETWEEN_ITEM_CONTENT_AND_LINE -
			(this.flowItem.nextAction ? ARROW_HEAD_SIZE.height : 0);
		this.afterLoopAddButtonTop = `${
			topOffset -
			VERTICAL_LINE_LENGTH / 2.0 -
			ADD_BUTTON_SIZE.height / 2.0 +
			(this.insideLoop ? ARROW_HEAD_SIZE.height : 0)
		}px`;
		this.afterLoopAddButtonLeft = `calc(50% - ${ADD_BUTTON_SIZE.width / 2}px`;
		const lineStrokeOffset = 1;
		this.afterLoopArrowHeadTop = topOffset - ARROW_HEAD_SIZE.height - lineStrokeOffset + 5;
		this.afterLoopArrowHeadLeft =
			this.flowItem.connectionsBox!.width / 2.0 - ARROW_HEAD_SIZE.width / 2 - lineStrokeOffset;
	}

	addLoopItem() {
		this.store.dispatch(
			FlowsActions.setRightSidebar({
				sidebarType: RightSideBarType.STEP_TYPE,
				props: {
					buttonType: AddButtonType.FIRST_LOOP_ACTION,
					stepName: this.flowItem.name,
				},
			})
		);
	}

	add() {
		this.store.dispatch(
			FlowsActions.setRightSidebar({
				sidebarType: RightSideBarType.STEP_TYPE,
				props: {
					buttonType: AddButtonType.NEXT_ACTION,
					stepName: this.flowItem.name,
				},
			})
		);
	}

	findReturningVerticalLineLength(subGraph: number) {
		return subGraph + VERTICAL_LINE_LENGTH + SPACE_BETWEEN_ITEM_CONTENT_AND_LINE;
	}

	ngOnChanges(changes: SimpleChanges): void {
		if (
			this.addButtonAndFlowItemNameContainer &&
			this.flowItem.name != this.addButtonAndFlowItemNameContainer.stepName
		) {
			const containerInArray = this.flowRendererService.addButtonsWithStepNamesContainers.find(
				item => item == this.addButtonAndFlowItemNameContainer
			);
			if (!containerInArray) {
				console.error('addButtonsWithStepNamesContainer not found');
			} else {
				this.addButtonAndFlowItemNameContainer.stepName = this.flowItem.name;
				containerInArray.stepName = this.flowItem.name;
			}
		}
	}

	loopItemStyle() {
		return {
			width: FLOW_ITEM_WIDTH + 'px',
			height: FLOW_ITEM_HEIGHT + 'px',
			top:
				SPACE_BETWEEN_ITEM_CONTENT_AND_LINE +
				VERTICAL_LINE_LENGTH +
				ARC_LENGTH +
				ARC_LENGTH +
				VERTICAL_LINE_LENGTH +
				SPACE_BETWEEN_ITEM_CONTENT_AND_LINE +
				'px',
			left: FLOW_ITEM_WIDTH / 2 + ARC_LENGTH * 2 + HORZIONTAL_LINE_LENGTH - FLOW_ITEM_WIDTH / 2 + 'px',
			position: 'relative',
		};
	}
}
