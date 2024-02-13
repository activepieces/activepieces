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
    if (event.target) {
      const scrollingWithinDataInsertionPopup = document
        .getElementById('mentionsDropdownContainer')
        ?.contains(event.target as Node);
      const mentionsList = document.getElementById('mentionsList');
      if (scrollingWithinDataInsertionPopup && mentionsList !== null) {
        return;
      }
    }

    if (
      (event.button === 0 || event.button === 1) &&
      !this.flowRendererService.isDraggingStateSnapshot
    ) {
      this.pannerService.panningState.currentOffset.x = event.clientX;
      this.pannerService.panningState.currentOffset.y = event.clientY;
      this.pannerService.panningState.isDragging = true;
      this.pannerService.isPanning$.next(true);
    }
  }

  @HostListener('mouseup', ['$event'])
  mouseUp(ignoredEvent: unknown) {
    this.pannerService.panningState.isDragging = false;
    this.pannerService.isPanning$.next(false);
  }
  @HostListener('mouseleave', ['$event'])
  mouseleave(ignoredEvent: unknown) {
    this.pannerService.panningState.isDragging = false;
    this.pannerService.isPanning$.next(false);
  }

  @HostListener('mousemove', ['$event'])
  mouseMover(event: MouseEvent) {
    if (this.pannerService.panningState.isDragging) {
      const delta = {
        x: event.pageX - this.pannerService.panningState.currentOffset.x,
        y: event.pageY - this.pannerService.panningState.currentOffset.y,
      };
      this.pannerService.lastPanningOffset = {
        x: this.pannerService.lastPanningOffset.x + delta.x,
        y: this.pannerService.lastPanningOffset.y + delta.y,
      };
      this.pannerService.panningState.currentOffset.x = event.clientX;
      this.pannerService.panningState.currentOffset.y = event.clientY;
      this.pannerService.panningOffset$.next(
        this.pannerService.lastPanningOffset
      );
    }
    event.preventDefault();
  }
  @HostListener('wheel', ['$event'])
  macPanning(event: WheelEvent) {
    if (event.target) {
      const scrollingWithinDataInsertionPopup = document
        .getElementById('mentionsDropdownContainer')
        ?.contains(event.target as Node);
      const mentionsList = document.getElementById('mentionsList');
      if (scrollingWithinDataInsertionPopup && mentionsList !== null) {
        return;
      }
    }

    if (!this.flowRendererService.isDraggingStateSnapshot) {
      this.pannerService.lastPanningOffset.x -= event.deltaX;
      this.pannerService.lastPanningOffset.y -= event.deltaY;
      this.pannerService.panningState.currentOffset.x = event.clientX;
      this.pannerService.panningState.currentOffset.y = event.clientY;
      this.pannerService.panningOffset$.next({
        ...this.pannerService.lastPanningOffset,
      });
    }
    event.preventDefault();
  }
  @HostListener('touchmove', ['$event'])
  onTouchMove(event: TouchEvent): void {
    console.log('touchmove');
    event.preventDefault();
  }

  @HostListener('touchstart', ['$event'])
  onTouchStart(event: TouchEvent): void {
    console.log('touchstart');
    event.preventDefault();
  }
  @HostListener('contextmenu', ['$event'])
  onContextMenu(event: MouseEvent): void {
    event.preventDefault();
  }
}
