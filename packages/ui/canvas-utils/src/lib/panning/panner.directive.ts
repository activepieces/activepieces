import { Directive, HostListener } from '@angular/core';
import { PannerService } from './panner.service';
import { FlowRendererService } from '@activepieces/ui/common';

@Directive({
  selector: '[appCanvasPanner]',
})
export class CanvasPannerDirective {
  lasWheelPanTimeStamp = new Date().getTime();
  constructor(
    private pannerService: PannerService,
    private flowRendererService: FlowRendererService
  ) {
    this.createWheelPannerChecker();
  }

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
      !this.flowRendererService.isDraggingStep
    ) {
      this.pannerService.setPanningState({
        isPanning: true,
        currentOffset: {
          x: event.clientX,
          y: event.clientY,
        },
        isTouchpadPanning: false,
      });
    }
  }

  @HostListener('mouseup', ['$event'])
  mouseUp(ignoredEvent: unknown) {
    this.pannerService.setPanningState({
      ...this.pannerService.panningState,
      isPanning: false,
    });
  }
  @HostListener('mouseleave', ['$event'])
  mouseleave(ignoredEvent: unknown) {
    this.pannerService.setPanningState({
      ...this.pannerService.panningState,
      isPanning: false,
    });
  }

  @HostListener('mousemove', ['$event'])
  mouseMover(event: MouseEvent) {
    if (this.pannerService.panningState.isPanning) {
      const delta = {
        x: event.pageX - this.pannerService.panningState.currentOffset.x,
        y: event.pageY - this.pannerService.panningState.currentOffset.y,
      };
      const lastPanningOffset = {
        x: this.pannerService.lastPanningOffset.x + delta.x,
        y: this.pannerService.lastPanningOffset.y + delta.y,
      };
      this.pannerService.setLastPanningOffset(lastPanningOffset);
      this.pannerService.setPanningState({
        currentOffset: {
          x: event.clientX,
          y: event.clientY,
        },
        isPanning: true,
        isTouchpadPanning: false,
      });
    }
    event.preventDefault();
  }

  @HostListener('wheel', ['$event'])
  /** Handles locked panning by the normal mouse wheel horizontally and vertically and also touchpad panning on laptops */
  wheelPanning(event: WheelEvent) {
    if (this.skipWheelEventIfZooming(event)) {
      return;
    }
    if (event.target) {
      const scrollingWithinDataInsertionPopup = document
        .getElementById('mentionsDropdownContainer')
        ?.contains(event.target as Node);
      const mentionsList = document.getElementById('mentionsList');
      if (scrollingWithinDataInsertionPopup && mentionsList !== null) {
        return;
      }
    }

    if (!this.flowRendererService.isDraggingStep) {
      this.lasWheelPanTimeStamp = new Date().getTime();
      const lastPanningOffset = {
        x: this.pannerService.lastPanningOffset.x - event.deltaX,
        y: this.pannerService.lastPanningOffset.y - event.deltaY,
      };
      this.pannerService.setLastPanningOffset(lastPanningOffset);
      this.pannerService.setPanningState({
        currentOffset: lastPanningOffset,
        isPanning: false,
        isTouchpadPanning: true,
      });
    }
    event.preventDefault();
  }

  createWheelPannerChecker() {
    setInterval(() => {
      const now = new Date().getTime();
      if (now - this.lasWheelPanTimeStamp > 100) {
        this.pannerService.setPanningState({
          ...this.pannerService.panningState,
          isTouchpadPanning: false,
        });
      }
    });
  }
  private skipWheelEventIfZooming(event: WheelEvent) {
    return event.ctrlKey || event.metaKey;
  }
}
