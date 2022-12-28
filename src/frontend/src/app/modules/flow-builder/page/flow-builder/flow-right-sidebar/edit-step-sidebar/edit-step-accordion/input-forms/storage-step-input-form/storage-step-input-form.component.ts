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
import { fadeInUp400ms } from 'src/app/modules/common/animation/fade-in-up.animation';
import { DropdownOption } from 'src/app/modules/common/model/dropdown-options';
import { ActionType } from 'src/app/modules/common/model/enum/action-type.enum';
import { StorageOperation } from 'src/app/modules/common/model/flow-builder/actions/storage-operation.enum';
import { StorageScope } from 'src/app/modules/common/model/flow-builder/actions/storage-scope.enum';
import { StorageStepInputFormSchema } from '../input-forms-schema';

interface StorageStepForm {
	operation: FormControl<StorageOperation>;
	key: FormControl<string>;
	value: FormControl<string>;
	scope: FormControl<StorageScope>;
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
	operationDropdownOptions: DropdownOption[] = [
		{ label: 'GET', value: StorageOperation.GET },
		{ label: 'PUT', value: StorageOperation.PUT },
	];
	operationChanged$: Observable<StorageOperation>;
	storageStepForm: FormGroup<StorageStepForm>;
	onChange = (value: StorageStepInputFormSchema) => {};
	onTouch = () => {};
	updateComponentValue$: Observable<any>;
	constructor(private formBuilder: FormBuilder) {
		this.storageStepForm = this.formBuilder.group({
			operation: new FormControl(StorageOperation.GET, { nonNullable: true, validators: [Validators.required] }),
			key: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
			value: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
			scope: new FormControl(StorageScope.COLLECTION, { nonNullable: true }),
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
				operation: StorageOperation.GET,
				key: '',
				value: '',
				scope: StorageScope.COLLECTION,
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

	operationControlChecker(operation: StorageOperation) {
		const valueControl = this.storageStepForm.controls.value;
		if (operation === StorageOperation.GET) {
			valueControl.setValue('');
			valueControl.disable();
		} else if (operation === StorageOperation.PUT && this.storageStepForm.enabled) {
			valueControl.enable();
		}
	}
	validate() {
		if (this.storageStepForm.invalid) {
			return { invalid: true };
		}
		return null;
	}

	isOperationSelected(item: DropdownOption) {
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
		return StorageOperation;
	}
}
