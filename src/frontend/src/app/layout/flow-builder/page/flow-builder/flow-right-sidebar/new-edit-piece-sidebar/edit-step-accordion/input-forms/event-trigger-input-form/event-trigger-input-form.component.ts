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
import { Store } from '@ngrx/store';
import { BsModalService } from 'ngx-bootstrap/modal';
import { map, Observable, tap } from 'rxjs';
import { fadeInUp400ms } from 'src/app/layout/common-layout/animation/fade-in-up.animation';
import { CreateNewEventModalComponent } from 'src/app/layout/common-layout/components/create-new-event-modal/create-new-event-modal.component';
import { TriggerType } from 'src/app/layout/common-layout/model/enum/trigger-type.enum';
import { DropdownOption } from 'src/app/layout/common-layout/model/fields/variable/config-settings';
import { selectEvents } from 'src/app/layout/common-layout/store/selector/common.selector';
import { InputFormsSchema } from '../input-forms-schema';

@Component({
	selector: 'app-event-trigger-input-form',
	templateUrl: './event-trigger-input-form.component.html',
	styleUrls: ['./event-trigger-input-form.component.scss'],
	providers: [
		{
			provide: NG_VALUE_ACCESSOR,
			multi: true,
			useExisting: EventTriggerInputFormComponent,
		},
		{
			provide: NG_VALIDATORS,
			multi: true,
			useExisting: EventTriggerInputFormComponent,
		},
	],
	animations: [fadeInUp400ms],
})
export class EventTriggerInputFormComponent implements ControlValueAccessor {
	eventTriggerInputForm: FormGroup;
	events$: Observable<DropdownOption[]>;
	placeholder = 'Please select';
	onChange = (value: InputFormsSchema) => {};
	onTouch = () => {};
	updateComponentValue$: Observable<any>;
	constructor(private modalService: BsModalService, private formBuilder: FormBuilder, private store: Store) {
		this.eventTriggerInputForm = this.formBuilder.group({ eventsName: new FormControl([], Validators.required) });
		this.updateComponentValue$ = this.eventTriggerInputForm.valueChanges.pipe(
			tap(() => {
				this.onChange(this.eventTriggerInputForm.value);
			})
		);
		this.events$ = this.store.select(selectEvents).pipe(
			tap(events => {
				if (events.length === 0) {
					this.placeholder = 'No events';
				} else {
					this.placeholder = 'Please select';
				}
			}),
			map(events => {
				return events.map(ev => {
					return {
						label: ev.displayName,
						value: ev.name,
					};
				});
			})
		);
	}
	writeValue(obj: InputFormsSchema): void {
		if (obj.type === TriggerType.EVENT) {
			this.eventTriggerInputForm.patchValue(obj);
		}
	}
	registerOnChange(fn: any): void {
		this.onChange = fn;
	}
	registerOnTouched(fn: any): void {
		this.onTouch = fn;
	}

	validate() {
		if (this.eventTriggerInputForm.invalid) {
			return { invalid: true };
		}
		return null;
	}

	openNewEventModal() {
		this.modalService.show(CreateNewEventModalComponent);
	}
	isEventSelected(eventName: string) {
		const eventsNames: string[] = this.eventTriggerInputForm.get('eventsName')!.value;
		return !!eventsNames.find(selectedEventName => selectedEventName === eventName);
	}
	setDisabledState?(isDisabled: boolean): void {
		if (isDisabled) {
			this.eventTriggerInputForm.disable();
		} else if (this.eventTriggerInputForm.disabled) {
			this.eventTriggerInputForm.enable();
		}
	}
}
