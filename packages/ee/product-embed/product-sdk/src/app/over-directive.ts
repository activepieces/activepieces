import { Directive, ElementRef } from '@angular/core';
import { OverlayContainer } from '@angular/cdk/overlay';

@Directive({
  selector: '[appCdkOverlayContainer]',
})
export class CdkOverlayContainerDirective {
  constructor(
    protected elementReference: ElementRef,
    protected cdkOverlayContainer: OverlayContainer
  ) {
    this.elementReference = elementReference;
    this.cdkOverlayContainer = cdkOverlayContainer;

    this.cdkOverlayContainer['myCreateContainer'](
      this.elementReference.nativeElement
    );
  }
}
