import { Directive, Input, HostListener } from '@angular/core';
@Directive({
  selector: '[appResize]',
})
export class FlexResizeDirective {
  @Input({ required: true }) leftElement!: HTMLElement;
  @Input({ required: true }) rightElement!: HTMLElement;
  @Input({ required: true }) containerElement!: HTMLElement;
  grabber = false;
  startingX = 0;

  @HostListener('mousedown', ['$event']) onMouseDown(event: MouseEvent) {
    event.preventDefault();
    this.grabber = true;
    this.startingX = event.clientX;
  }

  @HostListener('window:mouseup', ['$event']) onMouseUp(event: MouseEvent) {
    event.preventDefault();
    this.grabber = false;
  }

  @HostListener('window:mousemove', ['$event']) onMouseMove(event: MouseEvent) {
    if (this.grabber) {
      event.preventDefault();
      const containerRect = this.containerElement.getBoundingClientRect();
      const newLeftWidth =
        ((event.clientX - containerRect.left) / containerRect.width) * 100;
      const newRightWidth = 100 - newLeftWidth;
      this.leftElement.style.flexBasis = `${newLeftWidth}%`;
      this.rightElement.style.flexBasis = `${newRightWidth}%`;
    }
  }
}
