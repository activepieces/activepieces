import { Directive, HostListener } from '@angular/core';

@Directive({
  selector: '[apTrackHover]',
  exportAs: 'hoverTrackerDirective',
})
export class TrackHoverDirective {
  isHovered = false;

  @HostListener('mouseenter', ['$event']) onHover() {
    this.isHovered = true;
  }
  @HostListener('mouseleave', ['$event']) onLoeave() {
    this.isHovered = false;
  }
}
