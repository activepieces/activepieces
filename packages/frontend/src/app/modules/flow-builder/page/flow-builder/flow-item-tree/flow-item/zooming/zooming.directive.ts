import { Directive, HostListener } from '@angular/core';
import { ZoomingService } from './zooming.service';

@Directive({
  selector: '[appCanvasZoomer]',
})
export class CanvasZoomingDirective {
  constructor(private zoomingService: ZoomingService) {}
  currentScale = 1;

  @HostListener('wheel', ['$event'])
  mouseWheel(event: WheelEvent) {
  this.zoomingService;
  }
}
