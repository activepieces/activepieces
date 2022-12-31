import { Component } from '@angular/core';
import {
	ControlValueAccessor,
	FormBuilder,
	FormControl,
	FormGroup,
	NG_VALIDATORS,
	NG_VALUE_ACCESSOR,
	Validators,
} from '@angular/forms';
import { Observable, tap } from 'rxjs';
import { ActionType, StoreOperation } from 'shared';
import { fadeInUp400ms } from 'src/app/modules/common/animation/fade-in-up.animation';
import { DropdownItem } from 'src/app/modules/common/model/dropdown-item.interface';
import { StorageStepInputFormSchema } from '../input-forms-schema';

interface StorageStepForm {
	operation: FormControl<StoreOperation>;
	key: FormControl<string>;
	value: FormControl<string>;
}
@Component({
	selector: 'app-storage-step-input-form',
	templateUrl: './storage-step-input-form.component.html',
	providers: [
		{
			provide: NG_VALUE_ACCESSOR,
			multi: true,
			useExisting: StorageStepInputFormComponent,
		},
		{
			provide: NG_VALIDATORS,
			multi: true,
			useExisting: StorageStepInputFormComponent,
		},
	],
	animations: [fadeInUp400ms],
})
export class StorageStepInputFormComponent implements ControlValueAccessor {
	operationDropdownOptions: DropdownItem[] = [
		{ label: 'GET', value: StoreOperation.GET },
		{ label: 'PUT', value: StoreOperation.PUT },
	];
	operationChanged$: Observable<StoreOperation>;
	storageStepForm: FormGroup<StorageStepForm>;
	onChange = (value: StorageStepInputFormSchema) => {};
	onTouch = () => {};
	updateComponentValue$: Observable<any>;
	constructor(private formBuilder: FormBuilder) {
		this.storageStepForm = this.formBuilder.group({
			operation: new FormControl(StoreOperation.GET, { nonNullable: true, validators: [Validators.required] }),
			key: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
			value: new FormControl('', { nonNullable: true, validators: [Validators.required] })
		});
		this.storageStepForm.markAllAsTouched();
		this.setUpListenerToOperationControl();
		this.updateComponentValue$ = this.storageStepForm.valueChanges.pipe(
			tap(() => {
				this.onChange(this.storageStepForm.getRawValue());
			})
		);
	}
	writeValue(obj: StorageStepInputFormSchema): void {
		if (obj.type === ActionType.STORAGE) {
			this.storageStepForm.setValue({
				operation: StoreOperation.GET,
				key: '',
				value: ''
			});
			this.storageStepForm.patchValue(obj);
			this.operationControlChecker(obj.operation);
		}
	}
	registerOnChange(fn: any): void {
		this.onChange = fn;
	}
	registerOnTouched(fn: any): void {
		this.onTouch = fn;
	}
	setUpListenerToOperationControl() {
		const operationControl = this.storageStepForm.controls.operation;

		this.operationChanged$ = operationControl.valueChanges.pipe(
			tap(operation => {
				this.operationControlChecker(operation);
			})
		);
	}

	operationControlChecker(operation: StoreOperation) {
		const valueControl = this.storageStepForm.controls.value;
		if (operation === StoreOperation.GET) {
			valueControl.setValue('');
			valueControl.disable();
		} else if (operation === StoreOperation.PUT && this.storageStepForm.enabled) {
			valueControl.enable();
		}
	}
	validate() {
		if (this.storageStepForm.invalid) {
			return { invalid: true };
		}
		return null;
	}

	isOperationSelected(item: DropdownItem) {
		return this.storageStepForm.controls.operation.value === item.value;
	}

	setDisabledState?(isDisabled: boolean): void {
		if (isDisabled) {
			this.storageStepForm.disable();
		} else if (this.storageStepForm.disabled) {
			this.storageStepForm.enable();
		}
	}

	get StorageOperation() {
		return StoreOperation;
	}
}
