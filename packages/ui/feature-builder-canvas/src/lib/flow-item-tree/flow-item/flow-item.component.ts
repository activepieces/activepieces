import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnInit,
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
import { DragEndEvent } from 'angular-draggable-droppable';

@Component({
  selector: 'app-flow-item',
  templateUrl: './flow-item.component.html',
  styleUrls: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FlowItemComponent implements OnInit {
  flowGraphContainer = {};
  transformObs$: Observable<string>;
  @Input() insideLoopOrBranch = false;
  @Input() hoverState = false;
  @Input() trigger = false;
  _flowItemData: FlowItem;
  hideDraggableSource$: Subject<boolean> = new Subject();
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
  constructor(
    private store: Store,
    private pannerService: PannerService,
    private zoomingService: ZoomingService,
    private flowRendererService: FlowRendererService
  ) {}

  ngOnInit(): void {
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

  flowContentContainer() {
    return {
      left: `calc(50% - ${FLOW_ITEM_WIDTH / 2}px )`,
      position: 'relative',
      width: FLOW_ITEM_WIDTH + 'px',
    };
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
  draggingEnded(event$: DragEndEvent) {
    console.log(event$);
    this.flowRendererService.draggingSubject.next(false);
    this.isDragging = false;
    this.hideDraggableSource$.next(false);
  }
  getDocument() {
    return document.body;
  }
}
