import { Directive, HostListener } from '@angular/core';

/* eslint-disable */
@Directive({
	selector: '[clickStopPropagation]',
})
export class ClickStopPropagationDirective {
	@HostListener('click', ['$event'])
	public onClick(event: any): void {
		event.stopPropagation();
	}
}
