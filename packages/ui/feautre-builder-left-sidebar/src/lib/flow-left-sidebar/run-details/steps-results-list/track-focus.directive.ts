import { Directive, HostListener } from '@angular/core';

@Directive({
  selector: '[appTrackFocus]',
  exportAs: 'focusTrackerDirective',
})
export class TrackFocusDirective {
  isFocused = false;

  @HostListener('focus', ['$event']) onFocus(e) {
    this.isFocused = true;
  }
  @HostListener('blur', ['$event']) onblur(e) {
    this.isFocused = false;
  }
}
