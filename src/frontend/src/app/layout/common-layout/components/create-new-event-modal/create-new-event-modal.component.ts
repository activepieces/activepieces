import { Component, OnInit } from '@angular/core';
import { fadeInUp400ms } from '../../animation/fade-in-up.animation';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { BsModalRef } from 'ngx-bootstrap/modal';
import { Store } from '@ngrx/store';
import { ProjectService } from '../../service/project.service';
import { EventDefinitionService } from '../../service/events-definitions.service';
import { switchMap } from 'rxjs';
import { EventDefinition } from '../../model/event.-definition.interface';
import { HttpErrorResponse } from '@angular/common/http';
import { StatusCodes } from 'http-status-codes';
import { EventActions } from '../../store/action/events.action';

@Component({
	selector: 'app-create-new-event-modal',
	templateUrl: './create-new-event-modal.component.html',
	styleUrls: [],
	animations: [fadeInUp400ms],
})
export class CreateNewEventModalComponent implements OnInit {
	submitted = false;
	loading = false;
	eventForm: FormGroup;

	constructor(
		public bsModalRef: BsModalRef,
		private formBuilder: FormBuilder,
		private store: Store,
		private projectService: ProjectService,
		private eventDefinitionService: EventDefinitionService
	) {}

	ngOnInit() {
		this.eventForm = this.formBuilder.group({
			displayName: [, [Validators.required]],
			name: [, [Validators.pattern('[a-z0-9_]*'), Validators.required]],
			description: ['', []],
			hidden: [false, []],
		});
	}

	createEvent() {
		this.submitted = true;
		if (this.eventForm.invalid || this.loading) {
			return;
		}
		this.loading = true;
		this.projectService
			.selectedProjectAndTakeOne()
			.pipe(
				switchMap(project => {
					const request = this.eventForm.value;
					return this.eventDefinitionService.create(project.id, request);
				})
			)
			.subscribe({
				next: (response: EventDefinition) => {
					this.loading = false;
					this.store.dispatch(EventActions.addEvent({ eventDefinition: response }));
					this.bsModalRef.hide();
					this.eventForm.reset();
				},
				error: (error: HttpErrorResponse) => {
					console.log(error);
					if (error.status === StatusCodes.CONFLICT) {
						this.eventForm.get('name')?.setErrors({ nameExists: true });
					}
					this.loading = false;
				},
			});
	}

	nameChanged() {
		const nameControl = this.eventForm.get('name');
		console.log(nameControl?.hasError('nameExists'));
		if (nameControl && nameControl.errors && nameControl.hasError('nameExists')) {
			delete nameControl.errors['nameExists'];
			nameControl.updateValueAndValidity();
		}
	}
}
