import { Directive, ElementRef } from '@angular/core';

@Directive({
  selector: '[apElementDirective]',
  exportAs: 'elementDirective',
})
export class ElementDirective {
  constructor(public elementRef: ElementRef<HTMLElement>) {}
}
