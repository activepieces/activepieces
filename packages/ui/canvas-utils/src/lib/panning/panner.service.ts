import { Injectable } from '@angular/core';
import { BehaviorSubject, map } from 'rxjs';
import { ZoomingService } from '../zooming/zooming.service';
import { FlowVersion } from '@activepieces/shared';
import { FlowDrawer } from '../drawing/flow-drawer';
import {
  DEFAULT_TOP_MARGIN,
  MAX_ZOOM,
  FLOW_BUILDER_HEADER_HEIGHT,
  END_WIDGET_HEIGHT_AND_SPACE,
} from '../drawing/draw-common';
export type PanningState = {
  currentOffset: {
    x: number;
    y: number;
  };
  isPanning: boolean;
  isTouchpadPanning: boolean;
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
      isTouchpadPanning: false,
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
      .offset(0, 0)
      .boundingBox().height;
    const canvasHeight = window.innerHeight - FLOW_BUILDER_HEADER_HEIGHT;
    const fullFlowHeightWithWidgets =
      END_WIDGET_HEIGHT_AND_SPACE + flowHeight + DEFAULT_TOP_MARGIN;
    let zoomScale = 1.0;
    const maxPossibleViewedFlowHeight = Math.min(
      fullFlowHeightWithWidgets,
      resetZoom ? canvasHeight : Number.MAX_SAFE_INTEGER
    );
    zoomScale = canvasHeight / maxPossibleViewedFlowHeight;
    zoomScale = Math.min(zoomScale, MAX_ZOOM);
    if (resetZoom) {
      zoomScale = Math.max(zoomScale, 0.5);
    }
    const newState: PanningState = {
      currentOffset: {
        x: 0,
        // The number of pixels are affected by the zoom scale, that is why we divide by the zoom scale
        y: (canvasHeight * zoomScale - canvasHeight) / 2.0 + DEFAULT_TOP_MARGIN,
      },
      isPanning: false,
      isTouchpadPanning: false,
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
    return this._panningState$.pipe(
      map((state) => state.isPanning || state.isTouchpadPanning)
    );
  }
  get isPanningWithoutTouchpad$() {
    return this._panningState$.pipe(map((state) => state.isPanning));
  }
  get panningOffset$() {
    return this._lastPanningOffset$.asObservable();
  }
}
