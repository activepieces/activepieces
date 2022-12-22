import { Component, ElementRef, OnInit, QueryList, ViewChildren } from '@angular/core';
import {
	ControlValueAccessor,
	UntypedFormArray,
	UntypedFormBuilder,
	UntypedFormControl,
	UntypedFormGroup,
	NG_VALUE_ACCESSOR,
} from '@angular/forms';
import { Observable, tap, timer } from 'rxjs';
import { ThemeService } from '../../../service/theme.service';

@Component({
	selector: 'app-dictonary-form-control',
	templateUrl: './dictionary-form-control.component.html',
	styleUrls: ['./dictionary-form-control.component.scss'],
	providers: [
		{
			provide: NG_VALUE_ACCESSOR,
			multi: true,
			useExisting: DictionaryFormControlComponent,
		},
	],
})
export class DictionaryFormControlComponent implements ControlValueAccessor, OnInit {
	form!: UntypedFormGroup;
	disabled = false;
	onChange = val => {};
	onTouched = () => {};
	focusOnLastKeyInput$: Observable<0>;
	@ViewChildren('key') inputs: QueryList<ElementRef>;
	constructor(private fb: UntypedFormBuilder, public themeService: ThemeService) {
		this.form = this.fb.group({ pairs: this.fb.array([]) });
	}
	ngOnInit(): void {
		this.addNewPair();
	}

	writeValue(dictionaryValue: any): void {
		this.pairs.clear();
		if (dictionaryValue) {
			const pairsKeys = Object.keys(dictionaryValue);
			const pairsToInsert = pairsKeys.map(key => {
				return { key: key, value: dictionaryValue[key] };
			});
			pairsToInsert.forEach(p => {
				this.addPair(p);
			});
		}
		this.addNewPair();
	}
	registerOnChange(change: any): void {
		this.onChange = change;
	}
	registerOnTouched(touched: any): void {
		this.onTouched = touched;
	}

	get pairs() {
		return this.form.get('pairs') as UntypedFormArray;
	}
	addNewPair(withFocus = false) {
		this.addPair({ key: '', value: '' });
		if (withFocus) {
			this.focusOnLastKeyInput$ = timer(50).pipe(
				tap(() => {
					const lastKeyInput = this.inputs.get(this.inputs.length - 1);
					if (lastKeyInput) {
						lastKeyInput.nativeElement.focus();
					}
				})
			);
		}
	}

	addPair(pair: { key: string; value: string }) {
		const pairGroup = this.fb.group({
			key: new UntypedFormControl(pair.key),
			value: new UntypedFormControl(pair.value),
		});
		this.pairs.push(pairGroup);
	}

	removePair(indexOfPair: number) {
		if (this.pairs.length > 1) {
			this.pairs.removeAt(indexOfPair);
			this.onChange(this.formatControlValue());
		}
	}
	getPair(indexOfPair: number) {
		return this.pairs.at(indexOfPair) as UntypedFormGroup;
	}

	dictionaryControlValueChanged() {
		this.onChange(this.formatControlValue());
	}
	setDisabledState(disabled: boolean) {
		this.disabled = disabled;
		if (this.disabled) {
			this.pairs.disable();
		} else {
			this.pairs.enable();
		}
	}
	formatControlValue() {
		const dictonaryControlValue: { [key: string]: any } = {};
		this.pairs.controls.forEach(pairGroup => {
			if (pairGroup.get('key')?.value && pairGroup.get('value')?.value) {
				const key = pairGroup.get('key')?.value;
				const value = pairGroup.get('value')?.value;
				dictonaryControlValue[key] = value;
			}
		});
		return dictonaryControlValue;
	}
}
