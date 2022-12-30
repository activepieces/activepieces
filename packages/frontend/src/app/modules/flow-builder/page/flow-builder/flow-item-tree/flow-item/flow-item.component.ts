import { Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import { FlowRendererService } from '../../../../service/flow-renderer.service';
import { CdkDragEnd, CdkDragMove, CdkDragStart } from '@angular/cdk/drag-drop';
import { Point } from '../../../../../common/model/helper/point';
import { FlowItem } from '../../../../../common/model/flow-builder/flow-item';
import { map, Observable, of } from 'rxjs';
import { BuilderSelectors } from '../../../../store/selector/flow-builder.selector';
import { FlowsActions } from '../../../../store/action/flows.action';
import { Store } from '@ngrx/store';
import { FlowStructureUtil } from '../../../../service/flowStructureUtil';
import {
	FLOW_ITEM_HEIGHT,
	FLOW_ITEM_WIDTH,
	SPACE_BETWEEN_ITEM_CONTENT_AND_LINE,
	VERTICAL_LINE_LENGTH,
} from './flow-item-connection/draw-utils';

@Component({
	selector: 'app-flow-item',
	templateUrl: './flow-item.component.html',
	styleUrls: [],
})
export class FlowItemComponent implements OnInit {
	@Input() insideLoop = false;
	@Input() hoverState: boolean = false;
	@Input() trigger = false;
	_flowItemData: FlowItem;
	@Input() set flowItemData(value: FlowItem) {
		this._flowItemData = value;
		this.selected$ = this.store.select(BuilderSelectors.selectCurrentStepName).pipe(
			map(stepName => {
				if (this._flowItemData == undefined) {
					return false;
				}
				return this._flowItemData.name == stepName;
			})
		);
	}

	dragging: boolean = false;
	selected$: Observable<boolean> = of(false);
	viewMode$: Observable<boolean> = of(false);
	dragDelta: Point | undefined;

	@ViewChild('flowItem') private flowItemElement: ElementRef;

	constructor(private flowRendererService: FlowRendererService, private store: Store) {}

	ngOnInit(): void {
		this.viewMode$ = this.store.select(BuilderSelectors.selectReadOnly);
	}

	flowContentContainer() {
		return {
			left: `calc(50% - ${FLOW_ITEM_WIDTH / 2}px )`,
			position: 'relative',
			width: FLOW_ITEM_WIDTH + 'px',
		};
	}

	flowGraphContainer() {
		return {
			top: FlowStructureUtil.isTrigger(this._flowItemData) ? '50px' : '0px',
			width: this._flowItemData.boundingBox!.width + 'px',
			height: this._flowItemData.boundingBox!.height + 'px',
			left: `calc(50% - ${this._flowItemData.boundingBox!.width / 2}px )`,
			position: 'relative',
		};
	}

	startDrag(event: CdkDragStart) {
		this.dragging = true;
		this.flowRendererService.setDragPiece(this._flowItemData);
		this.flowRendererService.draggingSubject.next(true);
	}

	drop(event: CdkDragEnd) {
		const rect = event.source.element.nativeElement.getBoundingClientRect();
		const centerOfDraggedObject = {
			x: rect.x + rect.width / 2,
			y: rect.y + rect.height / 2,
		};
		this.flowRendererService.setDropPoint(
			{
				x: centerOfDraggedObject.x,
				y: centerOfDraggedObject.y,
			},
			this._flowItemData
		);

		this.flowRendererService.draggingSubject.next(false);
		const droppedInformation = this.flowRendererService.getDraggedInformation();
		if (droppedInformation.draggedPiece && droppedInformation.candidateAddButton) {
			this.store.dispatch(
				FlowsActions.dropPiece({
					draggedPieceName: droppedInformation.draggedPiece.name,
					newParentName: droppedInformation.candidateAddButton.stepName,
				})
			);
		}
		this.dragDelta = undefined;
		event.source.reset();
	}

	move(event: CdkDragMove) {
		if (!this.dragDelta) {
			const pnt = this.getPosition();
			this.dragDelta = new Point(
				event.pointerPosition.x - (pnt.x + this._flowItemData.width! / 2.0),
				event.pointerPosition.y - pnt.y
			);
		}
	}

	getPosition(): Point {
		const x =
			this.flowItemElement.nativeElement.getBoundingClientRect().left +
			(window.scrollX || document.documentElement.scrollLeft);
		const y =
			this.flowItemElement.nativeElement.getBoundingClientRect().top +
			(window.scrollY || document.documentElement.scrollTop);
		return { x, y };
	}

	nextActionItem() {
		return {
			width: FLOW_ITEM_WIDTH + 'px',
			height: FLOW_ITEM_HEIGHT + 'px',
			top: SPACE_BETWEEN_ITEM_CONTENT_AND_LINE + VERTICAL_LINE_LENGTH + SPACE_BETWEEN_ITEM_CONTENT_AND_LINE + 'px',
			left: '0px',
			position: 'absolute',
		};
	}
}
