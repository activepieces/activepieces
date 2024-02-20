import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnInit,
  Renderer2,
} from '@angular/core';
import { map, Observable, of, Subject } from 'rxjs';
import { Store } from '@ngrx/store';

import {
  PositionedStep,
  FLOW_ITEM_HEIGHT,
  FLOW_ITEM_HEIGHT_WITH_BOTTOM_PADDING,
  FLOW_ITEM_WIDTH,
} from '@activepieces/ui-canvas-utils';
import { BuilderSelectors } from '@activepieces/ui/feature-builder-store';
import { flowHelper } from '@activepieces/shared';
import { FlowRendererService } from '@activepieces/ui/common';
import {
  ACTION_BUTTON_DIMENSION,
  ACTIONS_CONTAINER_MARGIN,
} from './actions/common';

@Component({
  selector: 'app-flow-item',
  templateUrl: './flow-item.component.html',
  styleUrls: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FlowItemComponent implements OnInit {
  readonly FLOW_ITEM_HEIGHT = FLOW_ITEM_HEIGHT;
  flowGraphContainer = {};
  transformObs$: Observable<string>;
  draggingContainer: HTMLElement;
  isTrigger = false;
  _flowItemData: PositionedStep;
  delayTimer: ReturnType<typeof setTimeout>;
  delayTimerSet = false;
  touchStartLongPress = { delay: 750, delta: 10 };
  snappedDraggedShadowToCursor = false;
  readonly ACTION_BUTTON_DIMENSION = ACTION_BUTTON_DIMENSION;
  readonly ACTION_CONTAINER_OFFSET =
    ACTION_BUTTON_DIMENSION + ACTIONS_CONTAINER_MARGIN;
  readonly ACTIONS_CONTAINER_MARGIN = ACTIONS_CONTAINER_MARGIN;
  hideDraggableSource$: Subject<boolean> = new Subject();
  @Input() set flowItemData(value: PositionedStep) {
    this._flowItemData = value;
    if (this._flowItemData.content) {
      this.isTrigger = flowHelper.isTrigger(this._flowItemData.content.type);
    }
    this.selected$ = this.store
      .select(BuilderSelectors.selectCurrentStepName)
      .pipe(
        map((stepName) => {
          if (this._flowItemData == undefined) {
            return false;
          }
          return this._flowItemData.content?.name == stepName;
        })
      );
    this.flowGraphContainer = this.flowGraphContainerCalculator(value);
  }
  selected$: Observable<boolean> = of(false);
  readOnly$: Observable<boolean> = of(false);
  isDragging = false;
  anyStepIsDragged$: Observable<boolean>;

  readonly stepShadowStyling = {
    left: `calc(50% - ${(FLOW_ITEM_WIDTH - 1) / 2}px )`,
    width: FLOW_ITEM_WIDTH - 1 + 'px',
    height: FLOW_ITEM_HEIGHT + 'px',
    top: '0px',
  };
  constructor(
    private store: Store,
    private flowRendererService: FlowRendererService,
    private renderer2: Renderer2
  ) {}

  ngOnInit(): void {
    this.findDraggingContainer();
    this.anyStepIsDragged$ = this.flowRendererService.isDragginStep$;
    this.readOnly$ = this.store.select(BuilderSelectors.selectReadOnly);
  }

  private findDraggingContainer() {
    this.draggingContainer =
      document.getElementById('draggingContainer') || document.body;
    if (!document.getElementById('draggingContainer')) {
      console.warn('Dragging container not found, attaching it to body');
    }
  }

  flowGraphContainerCalculator(flowItemData: PositionedStep) {
    return {
      top: flowItemData.y + 'px',
      width: FLOW_ITEM_WIDTH + 'px',
      height: FLOW_ITEM_HEIGHT_WITH_BOTTOM_PADDING - 8 * 2 + 'px',
      left: flowItemData.x + 'px',
      'margin-top': '8px',
      position: 'absolute',
    };
  }

  draggingStarted() {
    this.flowRendererService.setIsDraggingStep(true);
    this.isDragging = true;
    setTimeout(() => {
      this.hideDraggableSource$.next(true);
    });
    setTimeout(() => {
      this.snapElementToCursor();
    }, 50);
  }

  snapElementToCursor() {
    if (!this.snappedDraggedShadowToCursor) {
      const shadowEl = document.getElementById('stepShadow');
      if (shadowEl) {
        const shadowElRect = shadowEl.getBoundingClientRect();
        const x = this.flowRendererService.clientMouseX - shadowElRect.left; //x position within the element.
        const y = this.flowRendererService.clientMouseY - shadowElRect.top; //y position within the element.
        shadowEl.style.transform = `translate(${
          x - shadowElRect.width / 2
        }px , ${y - shadowElRect.height / 2}px)`;
      } else {
        console.error('shadowEl not found!!!');
      }
      this.snappedDraggedShadowToCursor = true;
    }
  }

  draggingEnded() {
    this.flowRendererService.setIsDraggingStep(false);
    this.isDragging = false;
    setTimeout(() => {
      this.hideDraggableSource$.next(false);
    });
    this.snappedDraggedShadowToCursor = false;
    this.renderer2.setStyle(document.body, 'cursor', 'auto');
  }

  mouseDown($event: MouseEvent, el: HTMLElement) {
    if (!this.delayTimerSet) {
      $event.stopImmediatePropagation();
      this.delayTimerSet = true;
      this.delayTimer = setTimeout(() => {
        el.dispatchEvent(new MouseEvent('mousedown', $event));
        this.delayTimerSet = false;
      }, 100);
    }
  }
  mouseUp() {
    this.delayTimerSet = false;
    clearTimeout(this.delayTimer);
  }
}
