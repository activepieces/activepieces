import { Directive, HostListener } from '@angular/core';

@Directive({
  selector: '[appTrackHover]',
  exportAs: 'hoverTrackerDirective',
})
export class TrackHoverDirective {
  isHovered = false;

  @HostListener('mouseenter', ['$event']) onHover(e) {
    this.isHovered = true;
  }
  @HostListener('mouseleave', ['$event']) onLoeave(e) {
    this.isHovered = false;
  }
}
