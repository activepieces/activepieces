import { Component } from '@angular/core';
import { PannerService } from './panning/panner.service';
import { ZoomingService } from './zooming/zooming.service';


@Component({
  selector: 'app-canvas-utils',
  templateUrl: './canvas-utils.component.html',

})
export class CanvasUtilsComponent {
  zoomValue:string="100%";
  constructor(private zoomingService:ZoomingService,private pannerService:PannerService)
  {
  }
  zoomIn()
  {
    this.zoomingService.zoomingScale$.next(Math.min(this.zoomingService.zoomingScale$.value + this.zoomingService.zoomingStep,this.zoomingService.zoomingMax));
    this.zoomValue = `${this.zoomingService.zoomingScale$.value * 100}%`
  }
  zoomOut()
  {
    this.zoomingService.zoomingScale$.next(Math.max(this.zoomingService.zoomingScale$.value - this.zoomingService.zoomingStep,this.zoomingService.zoomingMin));
    this.zoomValue = `${this.zoomingService.zoomingScale$.value * 100}%`
  }
  recenter()
  {
    this.pannerService.recenter();
  }
  resetZoom()
  {
    this.zoomingService.zoomingScale$.next(1);
    this.zoomValue= "100%"

  }
}
