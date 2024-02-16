import { Injectable } from '@angular/core';
import { BehaviorSubject, map } from 'rxjs';
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
export type PanningState = {
  currentOffset: {
    x: number;
    y: number;
  };
  isPanning: boolean;
};
@Injectable({
  providedIn: 'root',
})
export class PannerService {
  constructor(private zoomService: ZoomingService) {}
  private _panningState$: BehaviorSubject<PanningState> =
    new BehaviorSubject<PanningState>({
      currentOffset: {
        x: 0,
        y: 0,
      },
      isPanning: false,
    });

  private _lastPanningOffset$: BehaviorSubject<{ x: number; y: number }> =
    new BehaviorSubject({
      x: 0,
      y: 0,
    });
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
    const fullFlowHeightWithWidgets =
      END_WIDGET_HEIGHT +
      ABOVE_FLOW_WIDGET_HEIGHT +
      flowHeight +
      DEFAULT_TOP_MARGIN * 2;
    let zoomScale = 1.0;
    const maxPossibleViewedFlowHeight = Math.min(
      fullFlowHeightWithWidgets,
      resetZoom ? canvasHeight : Number.MAX_SAFE_INTEGER
    );
    zoomScale = canvasHeight / maxPossibleViewedFlowHeight;
    zoomScale = Math.min(zoomScale, MAX_ZOOM);
    this.zoomService.minZoom = canvasHeight / fullFlowHeightWithWidgets;
    const scaledFlowHeight = maxPossibleViewedFlowHeight * zoomScale;
    const newState: PanningState = {
      currentOffset: {
        x: 0,
        y:
          (scaledFlowHeight - maxPossibleViewedFlowHeight) / 2 +
          DEFAULT_TOP_MARGIN,
      },
      isPanning: false,
    };
    this._panningState$.next(newState);
    this.setLastPanningOffset({
      ...newState.currentOffset,
    });
    this.zoomService.setZoomingScale(zoomScale);
  }
  get panningState$() {
    return this._panningState$.asObservable();
  }
  get panningState() {
    return this._panningState$.value;
  }

  setPanningState(newState: PanningState) {
    this._panningState$.next(newState);
  }
  setLastPanningOffset(offset: { x: number; y: number }) {
    this._lastPanningOffset$.next(offset);
  }
  get lastPanningOffset() {
    return this._lastPanningOffset$.value;
  }
  get isPanning$() {
    return this._panningState$.pipe(map((state) => state.isPanning));
  }
  get panningOffset$() {
    return this._lastPanningOffset$.asObservable();
  }
}
