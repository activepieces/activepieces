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
    this.recenter();
  }
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
    if (this.flowVersion) {
      this.pannerService.recenter(this.flowVersion);
    }
  }
}
