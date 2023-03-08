import { Component } from '@angular/core';
import { PannerService } from './panning/panner.service';
import { ZoomingService } from './zooming/zooming.service';

@Component({
  selector: 'app-canvas-utils',
  templateUrl: './canvas-utils.component.html',
})
export class CanvasUtilsComponent {
  constructor(
    private zoomingService: ZoomingService,
    private pannerService: PannerService
  ) {}
  zoomIn() {
    this.zoomingService.zoomingScale$.next(
      Math.min(
        this.zoomingService.zoomingScale$.value +
          this.zoomingService.zoomingStep,
        this.zoomingService.zoomingMax
      )
    );
  }
  zoomOut() {
    this.zoomingService.zoomingScale$.next(
      Math.max(
        this.zoomingService.zoomingScale$.value -
          this.zoomingService.zoomingStep,
        this.zoomingService.zoomingMin
      )
    );
  }
  recenter() {
    this.pannerService.recenter();
    this.zoomingService.zoomingScale$.next(1);
  }
}
