import { AfterViewInit, Directive } from '@angular/core';
import { MatMenu } from '@angular/material/menu';

@Directive({
  // eslint-disable-next-line @angular-eslint/directive-selector
  selector: 'mat-menu[ap-center]',
})
export class CenterMatMenuDirective implements AfterViewInit {
  constructor(private menu: MatMenu) {}

  ngAfterViewInit(): void {
    this.menu.overlayPanelClass = [
      `center-${this.menu.xPosition}`,
      `center-${this.menu.yPosition}`,
    ];
  }
}
