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
      this.dragState.currentOffset.x = event.clientX;
      this.dragState.currentOffset.y = event.clientY;
      this.dragState.isDragging = true;
      this.pannerService.isGrabbing$.next(true);
    }
  }


  @HostListener('mouseup', ['$event'])
  mouseUp(ignoredEvent) {
    this.dragState.isDragging = false;
    this.pannerService.isGrabbing$.next(false);
  }
  @HostListener('mouseleave', ['$event'])
  mouseleave(ignoredEvent) {
    this.dragState.isDragging = false;
    this.pannerService.isGrabbing$.next(false);
  }


  @HostListener('mousemove', ['$event'])
  mouseMover(event: MouseEvent) {
    if (this.dragState.isDragging) {
      const delta = {
        x: event.pageX - this.dragState.currentOffset.x,
        y: event.pageY - this.dragState.currentOffset.y,
      };
      console.log(delta);
      this.lastPanningOffset = {
        x: this.lastPanningOffset.x + delta.x,
        y: this.lastPanningOffset.y + delta.y,
      };
      this.dragState.currentOffset.x = event.clientX;
      this.dragState.currentOffset.y = event.clientY;
      this.pannerService.panningOffset$.next(this.lastPanningOffset);
    }
  }
  @HostListener('wheel',['$event'])
  macPanning(event:WheelEvent)
  {
    var isMac = navigator.platform.toUpperCase().indexOf('MAC')>=0;
    if(isMac)
    {
      console.log(event);
      this.dragState.currentOffset.x+=event.deltaX;
      this.dragState.currentOffset.y+=event.deltaY;
      this.pannerService.panningOffset$.next({
       ...this.dragState.currentOffset
      });
    }
  }
  
}
