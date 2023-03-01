import { Directive, HostListener } from '@angular/core';
import { PannerService } from './panner.service';

@Directive({
  selector: '[appCanvasPanner]',
})
export class CanvasPannerDirective {
  constructor(private pannerService: PannerService) {}
  dragState = {
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

  @HostListener('mousedown', ['$event'])
  mouseDown(event: MouseEvent) {
    if (event.which === 2) {
      this.dragState.currentOffset.x = event.pageX;
      this.dragState.currentOffset.y = event.pageY;
      this.dragState.isDragging = true;
    }
  }

  @HostListener('mouseup', ['$event'])
  mouseUp(ignoredEvent) {
    this.dragState.isDragging = false;
  }
  @HostListener('mousemove', ['$event'])
  mouseMover(event: MouseEvent) {
    if (this.dragState.isDragging) {
      const delta = {
        x: event.pageX - this.dragState.currentOffset.x,
        y: event.pageY - this.dragState.currentOffset.y,
      };
      this.lastPanningOffset = {
        x: this.lastPanningOffset.x + delta.x,
        y: this.lastPanningOffset.y + delta.y,
      };
      this.dragState.currentOffset.x = event.pageX;
      this.dragState.currentOffset.y = event.pageY;
      this.pannerService.panningOffset$.next(this.lastPanningOffset);
    }
  }
}
