import { Directive, HostListener } from '@angular/core';

@Directive({
  selector: '[apTrackHover]',
  exportAs: 'hoverTrackerDirective',
})
export class TrackHoverDirective {
  isHovered = false;

  @HostListener('mouseenter', ['$event']) onHover() {
    console.log(12344);
    this.isHovered = true;
  }
  @HostListener('mouseleave', ['$event']) onLoeave() {
    this.isHovered = false;
  }
}
