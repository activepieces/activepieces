import { Component } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, NG_VALUE_ACCESSOR } from '@angular/forms';
import { Observable, tap } from 'rxjs';
import { DropdownOption } from 'src/app/layout/common-layout/model/dynamic-controls/dropdown-options';
import { ThemeService } from 'src/app/layout/common-layout/service/theme.service';

@Component({
	selector: 'app-static-drop-down-options',
	templateUrl: './static-drop-down-options.component.html',
	styleUrls: ['./static-drop-down-options.component.scss'],
	providers: [
		{
			provide: NG_VALUE_ACCESSOR,
			multi: true,
			useExisting: StaticDropDownOptionsComponent,
		},
	],
})
export class StaticDropDownOptionsComponent {
	allowCustomLabels: boolean = false;
	optionsForm: FormGroup;
	disabled = false;
	valueControlsChanged$: Observable<void>[] = [];
	constructor(private fb: FormBuilder, public themeService: ThemeService) {
		this.optionsForm = this.fb.group({ pairs: this.fb.array([]) });
	}
	onChange = ({}) => {};

	registerOnChange(change: any): void {
		this.onChange = change;
	}
	registerOnTouched(touched: any): void {}

	get pairs() {
		return this.optionsForm.get('pairs') as FormArray;
	}

	addNewPair() {
		this.addPair({ label: '', value: '' });
	}
	writeValue(obj: DropdownOption[]) {
		this.pairs.clear();
		this.valueControlsChanged$ = [];
		if (obj) {
			obj.forEach(o => this.addPair(o));
		}
		this.addNewPair();
	}
	addPair(pair: { label: string; value: string }) {
		const labelControl = new FormControl(pair.label);
		const valueControl = new FormControl(pair.value);
		const pairGroup = this.fb.group({
			label: labelControl,
			value: valueControl,
		});

		if (!this.allowCustomLabels) {
			labelControl.disable();
			const valueChange$ = valueControl.valueChanges.pipe(
				tap(value => {
					labelControl.setValue(value);
				})
			);
			this.valueControlsChanged$.push(valueChange$);
		}
		this.pairs.push(pairGroup);
		this.onChange(this.formatControlValue());
	}

	removePair(indexOfPair: number) {
		if (this.pairs.length > 1) {
			this.pairs.removeAt(indexOfPair);
			this.onChange(this.formatControlValue());
		}
	}
	getPair(indexOfPair: number) {
		return this.pairs.at(indexOfPair) as FormGroup;
	}

	dictionaryControlValueChanged() {
		this.onChange(this.formatControlValue());
	}
	setDisabledState(disabled: boolean) {
		this.disabled = disabled;
		if (disabled) {
			this.pairs.disable();
		} else {
			this.pairs.enable();
		}
	}
	formatControlValue() {
		const values: DropdownOption[] = [];
		this.pairs.controls.forEach(pairGroup => {
			if (pairGroup.get('label')?.value && pairGroup.get('value')?.value) {
				const key = pairGroup.get('label')?.value;
				const value = pairGroup.get('value')?.value;
				values.push({ label: key, value: value });
			}
		});
		return values;
	}

	customizeLabels() {
		this.allowCustomLabels = true;
		this.pairs.controls.forEach(pairGroup => {
			const labelControl = pairGroup.get('label');
			labelControl?.enable();
			this.valueControlsChanged$ = [];
		});
	}

	setLabelsToValues() {
		this.allowCustomLabels = false;
		this.pairs.controls.forEach(pairGroup => {
			const labelControl = pairGroup.get('label')!;
			const valueControl = pairGroup.get('value')!;
			labelControl.setValue(valueControl?.value);
			labelControl.disable();
			const valueChanges$ = valueControl.valueChanges.pipe(tap(() => labelControl?.setValue(valueControl?.value)));
			this.valueControlsChanged$.push(valueChanges$);
		});

		this.onChange(this.formatControlValue());
	}
}
