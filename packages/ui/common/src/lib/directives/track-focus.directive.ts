import { Directive, HostListener } from '@angular/core';

@Directive({
  selector: '[apTrackFocus]',
  exportAs: 'focusTrackerDirective',
})
export class TrackFocusDirective {
  isFocused = false;

  @HostListener('focus', ['$event']) onFocus() {
    this.isFocused = true;
  }
  @HostListener('blur', ['$event']) onblur() {
    this.isFocused = false;
  }
}
