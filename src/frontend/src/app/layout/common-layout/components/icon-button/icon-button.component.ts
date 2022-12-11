import { Component, Input } from '@angular/core';

@Component({
	selector: 'app-icon-button',
	templateUrl: './icon-button.component.html',
	styleUrls: ['./icon-button.component.scss'],
})
export class IconButtonComponent {
	hover = false;
	@Input() hoverColor: string;
	@Input() color: string;
	@Input() width = 15;
	@Input() iconFilename: string;
	@Input() height = 15;
	@Input() tooltipText = '';
	@Input() zeroPadding = false;
	@Input() buttonHeight = 40;
	@Input() buttonWidth = 40;
	@Input() buttonPadding = '';
	@Input() disabled = false;

	constructor() {}

	iconSvgStyle(hover: boolean) {
		return {
			fill: hover ? this.hoverColor : this.color,
			// stroke: hover ? this.hoverColor : this.color,
			'width.px': this.width,
			'height.px': this.height,
			opacity: this.disabled ? '0.3' : '1',
		};
	}
}
