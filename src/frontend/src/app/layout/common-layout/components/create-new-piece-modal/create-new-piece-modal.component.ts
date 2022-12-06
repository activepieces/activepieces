import { Component } from '@angular/core';
import { fadeInUp400ms } from '../../animation/fade-in-up.animation';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { BsModalRef } from 'ngx-bootstrap/modal';
import { CollectionService } from '../../service/collection.service';
import { Router } from '@angular/router';
import { switchMap, take } from 'rxjs';
import { Collection } from '../../model/piece.interface';
import { HttpErrorResponse } from '@angular/common/http';
import { StatusCodes } from 'http-status-codes';
import { Store } from '@ngrx/store';
import { ProjectSelectors } from '../../store/selector/project.selector';

@Component({
	selector: 'app-create-new-piece-modal',
	templateUrl: './create-new-piece-modal.component.html',
	styleUrls: [],
	animations: [fadeInUp400ms],
})
export class CreateNewPieceModalComponent {
	submitted = false;
	loading = false;
	nameExists: boolean;
	pieceForm: FormGroup;

	constructor(
		private formBuilder: FormBuilder,
		private store: Store,
		public modalRef: BsModalRef,
		private pieceService: CollectionService,
		private router: Router
	) {
		this.pieceForm = this.formBuilder.group({
			name: [, [Validators.pattern('[a-z_0-9]*'), Validators.required]],
		});
	}

	createPiece() {
		this.submitted = true;
		if (this.pieceForm.invalid) {
			return;
		}
		this.loading = true;
		this.nameExists = false;
		// TODO REFACTOR
		this.store
			.select(ProjectSelectors.selectProject)
			.pipe(take(1))
			.pipe(
				switchMap(project => {
					const request = this.pieceForm.value;
					return this.pieceService.create(project!.id, {
						display_name: request.name,
					});
				})
			)
			.subscribe({
				next: (response: Collection) => {
					this.loading = false;
					this.router.navigate(['/flows/' + response.id]).then(() => {
						this.modalRef.hide();
						this.pieceForm.reset();
					});
				},
				error: (error: HttpErrorResponse) => {
					console.log(error);
					if (error.status === StatusCodes.CONFLICT) {
						this.nameExists = true;
					}
					this.loading = false;
				},
			});
	}
}
