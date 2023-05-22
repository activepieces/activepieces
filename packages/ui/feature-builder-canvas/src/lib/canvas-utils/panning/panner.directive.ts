import { Directive, HostListener } from '@angular/core';
import { PannerService } from './panner.service';
import { FlowRendererService } from '@activepieces/ui/feature-builder-store';

@Directive({
  selector: '[appCanvasPanner]',
})
export class CanvasPannerDirective {
  constructor(
    private pannerService: PannerService,
    private flowRendererService: FlowRendererService
  ) {}

  @HostListener('mousedown', ['$event'])
  mouseDown(event: MouseEvent) {
    if (event.which === 2 && !this.flowRendererService.draggingSubject.value) {
      this.pannerService.dragState.currentOffset.x = event.clientX;
      this.pannerService.dragState.currentOffset.y = event.clientY;
      this.pannerService.dragState.isDragging = true;
      this.pannerService.isPanning$.next(true);
    }
  }

  @HostListener('mouseup', ['$event'])
  mouseUp(ignoredEvent: unknown) {
    this.pannerService.dragState.isDragging = false;
    this.pannerService.isPanning$.next(false);
  }
  @HostListener('mouseleave', ['$event'])
  mouseleave(ignoredEvent: unknown) {
    this.pannerService.dragState.isDragging = false;
    this.pannerService.isPanning$.next(false);
  }

  @HostListener('mousemove', ['$event'])
  mouseMover(event: MouseEvent) {
    if (this.pannerService.dragState.isDragging) {
      const delta = {
        x: event.pageX - this.pannerService.dragState.currentOffset.x,
        y: event.pageY - this.pannerService.dragState.currentOffset.y,
      };
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
    if (!this.flowRendererService.draggingSubject.value) {
      this.pannerService.lastPanningOffset.x -= event.deltaX;
      this.pannerService.lastPanningOffset.y -= event.deltaY;
      this.pannerService.dragState.currentOffset.x = event.clientX;
      this.pannerService.dragState.currentOffset.y = event.clientY;
      this.pannerService.panningOffset$.next({
        ...this.pannerService.lastPanningOffset,
      });
    }
  }
}
