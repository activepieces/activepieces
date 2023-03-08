import { Directive, HostListener } from '@angular/core';
import { PannerService } from './panner.service';

@Directive({
  selector: '[appCanvasPanner]',
})
export class CanvasPannerDirective {
  constructor(private pannerService: PannerService) {}

  @HostListener('mousedown', ['$event'])
  mouseDown(event: MouseEvent) {
    if (event.which === 2) {
      this.pannerService.dragState.currentOffset.x = event.clientX;
      this.pannerService.dragState.currentOffset.y = event.clientY;
      this.pannerService.dragState.isDragging = true;
      this.pannerService.isGrabbing$.next(true);
    }
  }

  @HostListener('mouseup', ['$event'])
  mouseUp(ignoredEvent) {
    this.pannerService.dragState.isDragging = false;
    this.pannerService.isGrabbing$.next(false);
  }
  @HostListener('mouseleave', ['$event'])
  mouseleave(ignoredEvent) {
    this.pannerService.dragState.isDragging = false;
    this.pannerService.isGrabbing$.next(false);
  }

  @HostListener('mousemove', ['$event'])
  mouseMover(event: MouseEvent) {
    if (this.pannerService.dragState.isDragging) {
      const delta = {
        x: event.pageX - this.pannerService.dragState.currentOffset.x,
        y: event.pageY - this.pannerService.dragState.currentOffset.y,
      };
      console.log(delta);
      this.pannerService.lastPanningOffset = {
        x: this.pannerService.lastPanningOffset.x + delta.x,
        y: this.pannerService.lastPanningOffset.y + delta.y,
      };
      this.pannerService.dragState.currentOffset.x = event.clientX;
      this.pannerService.dragState.currentOffset.y = event.clientY;
      this.pannerService.panningOffset$.next(
        this.pannerService.lastPanningOffset
      );
    }
  }
  @HostListener('wheel', ['$event'])
  macPanning(event: WheelEvent) {
    event.preventDefault();
    this.pannerService.lastPanningOffset.x -= event.deltaX;
    this.pannerService.lastPanningOffset.y -= event.deltaY;
    this.pannerService.dragState.currentOffset.x = event.clientX;
    this.pannerService.dragState.currentOffset.y = event.clientY;
    this.pannerService.panningOffset$.next({
      ...this.pannerService.lastPanningOffset,
    });
  }
}
