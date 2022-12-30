import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
	selector: 'app-long-text-form-control',
	templateUrl: './long-text-form-control.component.html',
	styleUrls: ['./long-text-form-control.component.scss'],
	providers: [
		{
			provide: NG_VALUE_ACCESSOR,
			multi: true,
			useExisting: LongTextFormControlComponent,
		},
	],
})
export class LongTextFormControlComponent implements ControlValueAccessor {
	@Output()
	valueEditted = new EventEmitter();
	@Input()
	placeholder: string = '';
	@Input()
	applyInvalidFormControlCss = false;
	value: string = '';
	disabled = false;
	onChange = (newValue: string) => {};
	onTouched = () => {};
	constructor() {}
	writeValue(newValue: string): void {
		this.value = newValue;
	}
	registerOnChange(change: any): void {
		this.onChange = change;
	}
	registerOnTouched(touched: any): void {
		this.onTouched = touched;
	}
	setDisabledState(disabled: boolean) {
		console.log(disabled);
		this.disabled = disabled;
	}

	valueChanged(event: Event) {
		this.value = (event.target as HTMLDivElement).textContent
			? ((event.target as HTMLDivElement).textContent as string)
			: '';
		this.valueEditted.emit(this.value);
		this.onChange(this.value);
	}
}
