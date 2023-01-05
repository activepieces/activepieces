import { Component, Input, OnInit } from '@angular/core';
import { Point } from '../../../../../common/model/helper/point';
import { FlowItem } from '../../../../../common/model/flow-builder/flow-item';
import { map, Observable, of } from 'rxjs';
import { BuilderSelectors } from '../../../../store/selector/flow-builder.selector';
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

	constructor(private store: Store) {}

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
