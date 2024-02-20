import { AfterViewInit, Component, Input } from '@angular/core';
import { PannerService } from './panning/panner.service';
import { ZoomingService } from './zooming/zooming.service';
import { FlowVersion } from '@activepieces/shared';

@Component({
  selector: 'app-canvas-utils',
  templateUrl: './canvas-utils.component.html',
})
export class CanvasUtilsComponent implements AfterViewInit {
  @Input({ required: true }) flowVersion!: FlowVersion;
  constructor(
    private zoomingService: ZoomingService,
    private pannerService: PannerService
  ) {}
  ngAfterViewInit(): void {
    this.resetZoom();
  }
  zoomIn() {
    this.zoomingService.setZoomingScale(
      Math.min(
        this.zoomingService.zoomingScale + this.zoomingService.zoomingStep,
        this.zoomingService.maxZoom
      )
    );
  }
  zoomOut() {
    this.zoomingService.setZoomingScale(
      Math.max(
        this.zoomingService.zoomingScale - this.zoomingService.zoomingStep,
        this.zoomingService.minZoom
      )
    );
  }
  recenter() {
    if (this.flowVersion) {
      this.pannerService.fitToScreen(this.flowVersion);
    }
  }
  resetZoom() {
    if (this.flowVersion) {
      this.pannerService.resetZoom(this.flowVersion);
    }
  }
}
