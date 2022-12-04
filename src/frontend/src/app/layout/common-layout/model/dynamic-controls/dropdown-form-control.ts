import { ControlType } from './control-type.enum';
import { DynamicFormControl } from './dynamic-form-control';
import { FormControl, ValidatorFn, Validators } from '@angular/forms';
import { DropdownItemOption } from '../fields/variable/subfields/dropdown-item-option';
import { UUID } from 'angular2-uuid';
import { Subject } from 'rxjs';

export class DropdownFormControl extends DynamicFormControl {
	private dropdownOptions: DropdownItemOption[];
	private _isDynamic = false;
	private _collectionVersionId: UUID = '';
	private _flowVersionId: UUID = '';
	private _refreshReferences: string[] = [];
	public dynamicDropdownRefreshSubject: Subject<any> = new Subject();
	constructor({
		label,
		name,
		helpText = '',
		validatorFns = [],
		dropdownOptions,
		hidden = false,
		disabled = false,
		value = null,
		isDynamic = false,
		refreshReferences = [],
		collectionVersionId = '',
		flowVersionId = '',
	}: {
		label: string;
		name: string;
		helpText?: string;
		validatorFns?: ValidatorFn[];
		dropdownOptions: DropdownItemOption[];
		hidden?: boolean;
		disabled?: boolean;
		value?: string | null;
		isDynamic?: boolean;
		refreshReferences?: string[];
		collectionVersionId?: UUID;
		flowVersionId?: UUID;
	}) {
		super();
		this.name = name;
		this.label = label;
		this.disabled = disabled;
		this.hidden = hidden;
		this.helpText = helpText;
		this.validatorFns = validatorFns;
		this.dropdownOptions = dropdownOptions;
		this.value = value;
		this.type = ControlType.DROPDOWN;
		this._isDynamic = isDynamic;
		this._refreshReferences = refreshReferences;
		this._collectionVersionId = collectionVersionId;
		this._flowVersionId = flowVersionId;
		this._formControl = new FormControl(value, this.validatorFns);
		if (this.disabled) {
			this._formControl.disable();
		}
	}

	formControl(): FormControl {
		return this._formControl as FormControl;
	}

	setDropdownOptions(dropdownOptions: DropdownItemOption[]) {
		this.dropdownOptions = dropdownOptions;
	}

	getDropdownOptions() {
		return this.dropdownOptions;
	}
	get isDynamic() {
		return this._isDynamic;
	}

	get collectionVersionId() {
		return this._collectionVersionId;
	}
	get flowVersionId() {
		return this._flowVersionId;
	}
	get refreshReferences() {
		return this._refreshReferences;
	}
	get isRequired() {
		return this.validatorFns.findIndex(fn => fn == Validators.required) !== -1;
	}
}
