import { Component, OnInit } from '@angular/core';
import {
  Observable,
  combineLatest,
  filter,
  from,
  map,
  mergeMap,
  switchMap,
  toArray,
} from 'rxjs';
import { BuilderSelectors } from '@activepieces/ui/feature-builder-store';
import { Store } from '@ngrx/store';
import {
  FLOW_ITEM_HEIGHT_WITH_BOTTOM_PADDING,
  FLOW_ITEM_WIDTH,
  FlowDrawer,
  PannerService,
  PositionButton,
  ZoomingService,
  PositionedStep,
  DEFAULT_TOP_MARGIN,
} from '@activepieces/ui-canvas-utils';
import { PieceMetadataService } from '@activepieces/ui/feature-pieces';
import { ActionType, flowHelper } from '@activepieces/shared';
import { PieceMetadataModel } from '@activepieces/pieces-framework';

type UiFlowDrawer = {
  centeringGraphTransform: string;
  svg: string;
  boundingBox: { width: number; height: number };
} & Pick<FlowDrawer, 'buttons' | 'steps' | 'labels'>;

@Component({
  selector: 'app-flow-item-tree',
  templateUrl: './flow-item-tree.component.html',
})
export class FlowItemTreeComponent implements OnInit {
  navbarOpen = false;
  flowDrawer$: Observable<UiFlowDrawer>;
  transform$: Observable<string>;
  readOnly$: Observable<boolean>;
  isPanning$: Observable<boolean>;
  constructor(
    private store: Store,
    private pannerService: PannerService,
    private zoomingService: ZoomingService,
    private piecesMetadataService: PieceMetadataService
  ) {
    this.transform$ = this.getTransform$();
    this.isPanning$ = this.pannerService.isPanning$;
    this.readOnly$ = this.store.select(BuilderSelectors.selectReadOnly);
  }

  ngOnInit(): void {
    const flowVersion$ = this.store.select(
      BuilderSelectors.selectViewedVersion
    );

    this.flowDrawer$ = flowVersion$.pipe(
      switchMap((version) =>
        from(flowHelper.getAllSteps(version.trigger)).pipe(
          filter((s) => s.type === ActionType.PIECE),
          mergeMap((s) =>
            this.piecesMetadataService.getPieceMetadata(
              s.settings.pieceName,
              s.settings.pieceVersion
            )
          ),
          toArray(),
          map((allPieces: PieceMetadataModel[]) => {
            FlowDrawer.trigger = version.trigger;
            const drawer = FlowDrawer.construct(
              version.trigger,
              allPieces
            ).offset(0, DEFAULT_TOP_MARGIN);
            return {
              svg: drawer.svg.toSvg().content,
              boundingBox: drawer.boundingBox(),
              buttons: drawer.buttons,
              steps: drawer.steps,
              labels: drawer.labels,
              centeringGraphTransform: `translate(${
                drawer.boundingBox().width / 2 - FLOW_ITEM_WIDTH / 2
              }px,-${
                FLOW_ITEM_HEIGHT_WITH_BOTTOM_PADDING - DEFAULT_TOP_MARGIN
              }px)`,
            };
          })
        )
      )
    );
  }

  flowItemsTrackBy(_: number, item: PositionedStep) {
    return item.content?.name;
  }
  buttonsTrackBy(_: number, item: PositionButton) {
    return `${item.x}+${item.y}`;
  }

  getTransform$() {
    const scale$ = this.zoomingService.zoomingScale$.pipe(
      map((val) => {
        return `scale(${val})`;
      })
    );
    const translate$ = this.pannerService.panningOffset$.pipe(
      map((val) => {
        return `translate(${val.x}px, ${val.y}px)`;
      })
    );
    const transformObs$ = combineLatest({
      scale: scale$,
      translate: translate$,
    });

    // Combine the scale and translate values into transform to apply animation
    return transformObs$.pipe(
      map(({ scale, translate }) => `${translate} ${scale}`)
    );
  }
}
