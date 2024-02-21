import { Directive, HostListener } from '@angular/core';
import { PannerService } from './panner.service';
import { FlowRendererService } from '@activepieces/ui/common';

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
      !this.flowRendererService.isDraggingStep
    ) {
      this.pannerService.setPanningState({
        isPanning: true,
        currentOffset: {
          x: event.clientX,
          y: event.clientY,
        },
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
      });
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

    if (!this.flowRendererService.isDraggingStep) {
      const lastPanningOffset = {
        x: this.pannerService.lastPanningOffset.x - event.deltaX,
        y: this.pannerService.lastPanningOffset.y - event.deltaY,
      };
      this.pannerService.setLastPanningOffset(lastPanningOffset);
      this.pannerService.setPanningState({
        currentOffset: {
          x: event.clientX,
          y: event.clientY,
        },
        isPanning: false,
      });
    }
    event.preventDefault();
  }
}
