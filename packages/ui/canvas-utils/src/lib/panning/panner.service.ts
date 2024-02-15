import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { ZoomingService } from '../zooming/zooming.service';
import { FlowVersion } from '@activepieces/shared';
import { FlowDrawer } from '../drawing/flow-drawer';
import {
  ABOVE_FLOW_WIDGET_HEIGHT,
  DEFAULT_TOP_MARGIN,
  END_WIDGET_HEIGHT,
  MAX_ZOOM,
  FLOW_BUILDER_HEADER_HEIGHT,
} from '../drawing/draw-common';

@Injectable({
  providedIn: 'root',
})
export class PannerService {
  constructor(private zoomService: ZoomingService) {}
  panningOffset$: Subject<{ x: number; y: number }> = new Subject();
  isPanning$: Subject<boolean> = new Subject();
  panningState = {
    currentOffset: {
      x: 0,
      y: 0,
    },
    isDragging: false,
  };
  lastPanningOffset = {
    x: 0,
    y: 0,
  };
  fitToScreen(flowVersion: FlowVersion) {
    this.setCanvasTransform({
      flowVersion,
      resetZoom: false,
    });
  }
  resetZoom(flowVersion: FlowVersion) {
    this.setCanvasTransform({
      flowVersion,
      resetZoom: true,
    });
  }
  setCanvasTransform({
    flowVersion,
    resetZoom,
  }: {
    flowVersion: FlowVersion;
    resetZoom: boolean;
  }) {
    const flowHeight = FlowDrawer.construct(flowVersion.trigger)
      .offset(0, DEFAULT_TOP_MARGIN)
      .boundingBox().height;
    const canvasHeight = window.innerHeight - FLOW_BUILDER_HEADER_HEIGHT;
    const fullFlowHeightWithWidgets = Math.min(
      END_WIDGET_HEIGHT +
        ABOVE_FLOW_WIDGET_HEIGHT +
        flowHeight +
        DEFAULT_TOP_MARGIN * 2,
      resetZoom ? canvasHeight * 2 : Number.MAX_VALUE
    );
    let zoomScale = 1.0;
    zoomScale = canvasHeight / fullFlowHeightWithWidgets;
    zoomScale = Math.min(zoomScale, MAX_ZOOM);
    const scaledFlowHeight = fullFlowHeightWithWidgets * zoomScale;
    this.panningState = {
      currentOffset: {
        x: 0,
        y:
          (-(fullFlowHeightWithWidgets - scaledFlowHeight) / 2 +
            DEFAULT_TOP_MARGIN) *
          zoomScale,
      },
      isDragging: false,
    };
    this.lastPanningOffset = {
      ...this.panningState.currentOffset,
    };
    this.panningOffset$.next({ ...this.panningState.currentOffset });
    this.zoomService.zoomingScale$.next(zoomScale);
  }
}
