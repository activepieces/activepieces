import {
  Directive,
  ElementRef,
  Output,
  EventEmitter,
  AfterViewInit,
  OnDestroy,
} from '@angular/core';

@Directive({
  selector: '[apCheckOverflow]',
  standalone: true,
})
export class CheckOverflowDirective implements AfterViewInit, OnDestroy {
  @Output() isOverflowed = new EventEmitter<boolean>();

  private resizeObserver: ResizeObserver;

  constructor(private elementRef: ElementRef) {}

  ngAfterViewInit() {
    this.startObserving();
  }

  ngOnDestroy() {
    this.stopObserving();
  }

  private startObserving() {
    this.resizeObserver = new ResizeObserver((entries) => {
      this.checkOverflow();
    });

    this.resizeObserver.observe(this.elementRef.nativeElement);
  }

  private stopObserving() {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
  }

  private checkOverflow() {
    const element: HTMLElement = this.elementRef.nativeElement;
    const overflown =
      element.scrollWidth > element.clientWidth ||
      element.scrollHeight > element.clientHeight;
    this.isOverflowed.emit(overflown);
  }
}
