import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
	selector: 'app-checkbox',
	templateUrl: './checkbox.component.html',
	styleUrls: ['./checkbox.component.scss'],
	providers: [
		{
			provide: NG_VALUE_ACCESSOR,
			multi: true,
			useExisting: CheckboxComponent,
		},
	],
})
export class CheckboxComponent implements ControlValueAccessor {
	trueSvgSrc = 'assets/img/custom/checkbox-control/true.svg';
	falseSvgSrc = 'assets/img/custom/checkbox-control/false.svg';
	@Input() label: string;

	@Input() state = false;
	@Output() stateChanged: EventEmitter<boolean> = new EventEmitter();
	onChange = (state: boolean) => {};
	constructor() {}

	writeValue(state: boolean): void {
		this.state = state;
	}
	registerOnChange(onChange: any): void {
		this.onChange = onChange;
	}
	registerOnTouched(fn: any): void {}

	checkboxClicked(event: Event) {
		event.stopPropagation();
		this.state = !this.state;
		this.onChange(this.state);
		this.stateChanged.emit(this.state);
	}
}
