import { AfterViewInit, Directive } from '@angular/core';
import { MatLegacyMenu as MatMenu } from '@angular/material/legacy-menu';

@Directive({
	selector: 'mat-menu[ap-center]',
})
export class CenterMatMenuDirective implements AfterViewInit {
	constructor(private menu: MatMenu) {}

	ngAfterViewInit(): void {
		this.menu.overlayPanelClass = [`center-${this.menu.xPosition}`, `center-${this.menu.yPosition}`];
	}
}
