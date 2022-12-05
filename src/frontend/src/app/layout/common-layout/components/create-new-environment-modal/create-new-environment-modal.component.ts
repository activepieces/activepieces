import { fadeInUp400ms } from '../../animation/fade-in-up.animation';
import { Component, TemplateRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';
import { ProjectEnvironment } from '../../model/project-environment.interface';
import { ProjectService } from '../../service/project.service';
import { EnvironmentService } from '../../service/environment.service';
import { switchMap } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { Store } from '@ngrx/store';
import { EnvironmentActions } from '../../store/action/environment.action';

@Component({
	selector: 'app-create-new-environment-modal',
	templateUrl: './create-new-environment-modal.component.html',
	styleUrls: [],
	animations: [fadeInUp400ms],
})
export class CreateNewEnvironmentModalComponent {
	submitted = false;
	loading = false;
	nameExists: boolean;
	environmentForm: FormGroup;
	modalRef?: BsModalRef;

	constructor(
		private formBuilder: FormBuilder,
		private projectService: ProjectService,
		private environmentService: EnvironmentService,
		private modalService: BsModalService,
		private store: Store
	) {
		this.environmentForm = this.formBuilder.group({
			name: [, [Validators.pattern('[a-z0-9_]*'), Validators.required]],
			deployedPieces: [[], []],
		});
	}

	openModal(template: TemplateRef<any>) {
		this.modalRef = this.modalService.show(template);
	}

	createEnvironment() {
		this.submitted = true;
		if (!this.environmentForm.valid || this.loading) {
			return;
		}
		this.loading = true;
		this.nameExists = false;

		this.projectService
			.selectedProjectAndTakeOne()
			.pipe(
				switchMap(project => {
					const request = this.environmentForm.value;
					return this.environmentService.create(project.id, request);
				})
			)
			.subscribe({
				next: (response: ProjectEnvironment) => {
					this.loading = false;
					this.store.dispatch(EnvironmentActions.addEnvironment({ environment: response }));
					this.environmentForm.reset();
					this.modalRef?.hide();
				},
				error: (error: HttpErrorResponse) => {
					console.log(error);
					// if (error.status === StatusCodes.CONFLICT) {
					//WTF
					this.nameExists = true;
					// }
					this.loading = false;
				},
			});
	}
}
