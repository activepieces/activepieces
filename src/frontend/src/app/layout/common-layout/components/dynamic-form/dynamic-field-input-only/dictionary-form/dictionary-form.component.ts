import { Component, Input, OnInit } from '@angular/core';
import { ThemeService } from '../../../../service/theme.service';
import { DictonaryItem } from './dictonary-item';
import { KeyValueFormControl } from '../../../../model/dynamic-controls/key-value-form-control';

@Component({
	selector: 'app-dictionary-form',
	templateUrl: './dictionary-form.component.html',
	styleUrls: ['./dictionary-form.component.css'],
})
export class DictionaryFormComponent implements OnInit {
	entrySet: DictonaryItem[] = [];

	_dynamicControl: KeyValueFormControl;
	get dynamicControl(): KeyValueFormControl {
		return this._dynamicControl;
	}

	@Input() set dynamicControl(value: KeyValueFormControl) {
		this._dynamicControl = value;
		this.entrySet = [];
		if (
			this._dynamicControl.formControl().value &&
			Object.entries(this._dynamicControl.formControl().value).length > 0
		) {
			for (const [key, value] of Object.entries(this._dynamicControl.formControl().value)) {
				this.entrySet.push({ key: key, value: value });
			}
		} else {
			this.addEmptyPair();
		}
	}

	constructor(public themeService: ThemeService) {}

	addEmptyPair() {
		this.entrySet.push({ key: '', value: '' });
		this.emitValue();
	}

	ngOnInit(): void {
		this.emitValue();
	}

	emitValue() {
		const map = {};
		for (let i = 0; i < this.entrySet.length; ++i) {
			if (this.entrySet[i].key.length > 0) {
				map[this.entrySet[i].key] = this.entrySet[i].value;
			}
		}
		this._dynamicControl.formControl().setValue(map);
	}

	getValue(target: any) {
		return target.value;
	}

	removePair(pairIndex: number) {
		if (this.entrySet.length > 1) {
			this.entrySet.splice(pairIndex, 1);
			this.emitValue();
		} else {
			this.setPairKey(0, '');
			this.setPairValue(0, '');
		}
	}
	addPair(pairPosition: number) {
		this.entrySet.splice(pairPosition + 1, 0, { key: '', value: '' });
		this.emitValue();
	}

	setPairValue(pairIndex: number, value: any) {
		this.entrySet[pairIndex].value = value;
		this.emitValue();
	}
	setPairKey(pairIndex: number, key: any) {
		this.entrySet[pairIndex].key = key;
		this.emitValue();
	}
}
