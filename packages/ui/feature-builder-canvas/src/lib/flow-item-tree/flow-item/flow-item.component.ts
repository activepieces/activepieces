import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnInit,
  Renderer2,
} from '@angular/core';
import { combineLatest, map, Observable, of, startWith, Subject } from 'rxjs';
import { Store } from '@ngrx/store';
import {
  FLOW_ITEM_HEIGHT,
  FLOW_ITEM_WIDTH,
  SPACE_BETWEEN_ITEM_CONTENT_AND_LINE,
  VERTICAL_LINE_LENGTH,
} from './flow-item-connection/draw-utils';
import {
  BuilderSelectors,
  FlowItem,
  Point,
  FlowStructureUtil,
  FlowRendererService,
} from '@activepieces/ui/feature-builder-store';
import { PannerService } from '../../canvas-utils/panning/panner.service';
import { ZoomingService } from '../../canvas-utils/zooming/zooming.service';

@Component({
  selector: 'app-flow-item',
  templateUrl: './flow-item.component.html',
  styleUrls: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FlowItemComponent implements OnInit {
  flowGraphContainer = {};
  transformObs$: Observable<string>;
  draggingContainer: HTMLElement;
  @Input() insideLoopOrBranch = false;
  @Input() hoverState = false;
  @Input() trigger = false;
  _flowItemData: FlowItem;
  snappedDraggedShadowToCursor = false;
  hideDraggableSource$: Subject<boolean> = new Subject();
  c = 0;
  @Input() set flowItemData(value: FlowItem) {
    this._flowItemData = value;
    this.selected$ = this.store
      .select(BuilderSelectors.selectCurrentStepName)
      .pipe(
        map((stepName) => {
          if (this._flowItemData == undefined) {
            return false;
          }
          return this._flowItemData.name == stepName;
        })
      );
    this.flowGraphContainer = this.flowGraphContainerCalculator();
  }
  selected$: Observable<boolean> = of(false);
  viewMode$: Observable<boolean> = of(false);
  dragDelta: Point | undefined;
  scale$: Observable<string>;
  isDragging = false;
  anyStepIsDragged$: Observable<boolean>;
  readonly flowItemContentContainer = {
    left: `calc(50% - ${FLOW_ITEM_WIDTH / 2}px )`,
    position: 'relative',
    width: FLOW_ITEM_WIDTH + 'px',
  };
  readonly draggedContainer = {
    left: `calc(50% - ${(FLOW_ITEM_WIDTH - 1) / 2}px )`,
    width: FLOW_ITEM_WIDTH - 1 + 'px',
    height: FLOW_ITEM_HEIGHT - 1 + 'px',
    top: '0px',
  };
  constructor(
    private store: Store,
    private pannerService: PannerService,
    private zoomingService: ZoomingService,
    private flowRendererService: FlowRendererService,
    private renderer2: Renderer2
  ) {}

  ngOnInit(): void {
    this.findDraggingContainer();
    this.anyStepIsDragged$ =
      this.flowRendererService.draggingSubject.asObservable();
    this.scale$ = this.zoomingService.zoomingScale$.asObservable().pipe(
      startWith(1),
      map((val) => {
        return `scale(${val})`;
      })
    );
    this.viewMode$ = this.store.select(BuilderSelectors.selectReadOnly);
    if (FlowStructureUtil.isTrigger(this._flowItemData)) {
      const translate$ = this.pannerService.panningOffset$.asObservable().pipe(
        startWith({ x: 0, y: 0 }),
        map((val) => {
          return `translate(${val.x}px,${val.y}px)`;
        })
      );
      this.transformObs$ = combineLatest({
        scale: this.scale$,
        translate: translate$,
      }).pipe(
        map((value) => {
          return `${value.scale} ${value.translate}`;
        })
      );
    }
  }

  private findDraggingContainer() {
    this.draggingContainer =
      document.getElementById('draggingContainer') || document.body;
    if (!document.getElementById('draggingContainer')) {
      console.warn('Dragging container not found, attaching it to body');
    }
  }

  flowGraphContainerCalculator() {
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
      top:
        SPACE_BETWEEN_ITEM_CONTENT_AND_LINE +
        VERTICAL_LINE_LENGTH +
        SPACE_BETWEEN_ITEM_CONTENT_AND_LINE +
        'px',
      left: '0px',
      position: 'absolute',
    };
  }
  draggingStarted() {
    this.flowRendererService.draggingSubject.next(true);
    this.isDragging = true;
    setTimeout(() => {
      this.hideDraggableSource$.next(true);
    });
  }

  snapElementToCursor() {
    if (!this.snappedDraggedShadowToCursor) {
      const shadowEl = document.getElementById('stepShadow');
      if (shadowEl) {
        const shadowElRect = shadowEl.getBoundingClientRect();
        const x = this.flowRendererService.clientX - shadowElRect.left; //x position within the element.
        const y = this.flowRendererService.clientY - shadowElRect.top; //y position within the element.
        console.log(x, y);
        shadowEl.style.transform = `translate(${
          x - shadowElRect.width / 2
        }px , ${y - shadowElRect.height / 2}px)`;
        console.log(
          `translate(${x - shadowElRect.width / 2}px , ${
            y - shadowElRect.height / 2
          }px)`
        );
      } else {
        console.error('shadowEl not found!!!');
      }
      this.snappedDraggedShadowToCursor = true;
    }
  }

  draggingEnded() {
    this.flowRendererService.draggingSubject.next(false);
    this.isDragging = false;
    setTimeout(() => {
      this.hideDraggableSource$.next(false);
    });
    this.snappedDraggedShadowToCursor = false;
    this.renderer2.setStyle(document.body, 'cursor', 'auto');
  }
}
