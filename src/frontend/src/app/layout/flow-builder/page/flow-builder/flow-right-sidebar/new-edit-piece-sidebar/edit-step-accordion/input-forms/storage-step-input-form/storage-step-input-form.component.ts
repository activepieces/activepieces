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
import { fadeInUp400ms } from 'src/app/layout/common-layout/animation/fade-in-up.animation';
import { DropdownOption } from 'src/app/layout/common-layout/model/dynamic-controls/dropdown-options';
import { ActionType } from 'src/app/layout/common-layout/model/enum/action-type.enum';
import { StorageOperation } from 'src/app/layout/common-layout/model/flow-builder/actions/storage-operation.enum';
import { StorageScope } from 'src/app/layout/common-layout/model/flow-builder/actions/storage-scope.enum';
import { InputFormsSchema, StorageStepInputFormSchema } from '../input-forms-schema';

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
	scopeOptions: DropdownOption[] = [
		{ label: 'Instance', value: StorageScope.INSTANCE },
		{ label: 'Collection', value: StorageScope.COLLECTION },
	];
	operationChanged$: Observable<StorageOperation>;
	storageStepForm: FormGroup;
	onChange = (value: InputFormsSchema) => {};
	onTouch = () => {};
	updateComponentValue$: Observable<any>;
	constructor(private formBuilder: FormBuilder) {
		this.storageStepForm = this.formBuilder.group({
			operation: new FormControl('', Validators.required),
			key: new FormControl('', Validators.required),
			value: new FormControl('', Validators.required),
			scope: new FormControl(StorageScope.INSTANCE, Validators.required),
		});

		this.setUpListenerToOperationControl();
		this.updateComponentValue$ = this.storageStepForm.valueChanges.pipe(
			tap(() => {
				this.onChange(this.storageStepForm.value);
			})
		);
	}
	writeValue(obj: InputFormsSchema): void {
		if (obj.type === ActionType.STORAGE) {
			this.storageStepForm.setValue({ operation: '', key: '', value: '', scope: StorageScope.INSTANCE });
			this.storageStepForm.patchValue(obj);
			this.operationControlChecker((obj as StorageStepInputFormSchema).operation);
		}
	}
	registerOnChange(fn: any): void {
		this.onChange = fn;
	}
	registerOnTouched(fn: any): void {
		this.onTouch = fn;
	}
	setUpListenerToOperationControl() {
		const operationControl = this.storageStepForm.get('operation')!;

		this.operationChanged$ = operationControl.valueChanges.pipe(
			tap(operation => {
				this.operationControlChecker(operation);
			})
		);
	}

	operationControlChecker(operation: StorageOperation) {
		const valueControl = this.storageStepForm.get('value')!;
		if (operation === StorageOperation.GET) {
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
		return this.storageStepForm.get('operation')!.value === item.value;
	}

	getControl(name: string) {
		return this.storageStepForm.get(name)!;
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
