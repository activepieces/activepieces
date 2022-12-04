import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
	selector: 'app-button',
	templateUrl: './ap-button.component.html',
	styleUrls: ['./ap-button.component.scss'],
})
export class ApButtonComponent {
	@Input() loading: boolean;
	@Input() btnStyle: 'flat' | 'raised' | 'stroked' | 'basic' = 'flat';
	@Input() btnColor: 'primary' | 'warn' | 'success' | 'basic' = 'primary';
	@Input() disabled: true | false | null = false;
	@Input() loadingCSS: 'text-white' | 'text-primary' = 'text-white';
	@Input() fullWidthOfContainer = false;
	@Input() tooltipDisabled: boolean = false;
	@Input() tooltipText = '';
	@Input() set btnSize(value: 'extraSmall' | 'small' | 'medium' | 'large') {
		this.btnSizeClass = this.btnClassesMap.get(value)!;
	}
	btnClassesMap: Map<string, string> = new Map(
		Object.entries({
			extraSmall: 'ap-btn-xs',
			small: 'ap-btn-sm',
			medium: 'ap-btn-m',
			large: 'ap-btn-l',
		})
	);
	btnSizeClass = 'ap-btn-l';
	@Output() buttonClicked: EventEmitter<Event> = new EventEmitter<Event>();
	constructor() {}

	click() {
		if (!this.loading) {
			this.buttonClicked.emit();
		}
	}
}
