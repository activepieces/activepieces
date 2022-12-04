import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ofType } from '@ngrx/effects';
import { ActionsSubject, Store } from '@ngrx/store';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';
import { map, Observable, tap } from 'rxjs';
import { fadeInUp400ms } from 'src/app/layout/common-layout/animation/fade-in-up.animation';
import {
	updateFirebaseProjectId,
	updateFirebaseProjectIdFailed,
	updateFirebaseProjectIdSuccessful,
} from '../../../store/action/authentication.action';

@Component({
	selector: 'app-firebase-project-id-modal',
	templateUrl: './firebase-project-id-modal.component.html',
	styleUrls: ['./firebase-project-id-modal.component.scss'],
	animations: [fadeInUp400ms],
})
export class FirebaseProjectIdModalComponent implements OnInit {
	@Input()
	environmentId: string;
	@Input()
	environmentName: string;
	@Input()
	currentProjectId: string = '';
	firebaseProjectForm: FormGroup;
	submitted = false;
	loading = false;

	constructor(
		public bsModalRef: BsModalRef,
		private fb: FormBuilder,
		private modalService: BsModalService,
		private snackbar: MatSnackBar,
		private store: Store,
		private actionsListener$: ActionsSubject
	) {}

	updateSnackbarSuccess$: Observable<void>;
	updateSnackbarFailed$: Observable<void>;

	ngOnInit(): void {
		this.firebaseProjectForm = this.fb.group({
			projectId: new FormControl(this.currentProjectId, Validators.required),
		});

		// TODO MOVE THIS TO EFFECTS
		this.updateSnackbarFailed$ = this.actionsListener$.pipe(
			ofType(updateFirebaseProjectIdFailed),
			tap(() => {
				this.snackbar.open(`${this.environmentName} Project ID update failed`, '', {
					duration: undefined,
					panelClass: 'error',
				});
				this.loading = false;
			}),
			map(() => void 0)
		);

		this.updateSnackbarSuccess$ = this.actionsListener$.pipe(
			ofType(updateFirebaseProjectIdSuccessful),
			tap(() => {
				this.snackbar.open(`${this.environmentName} Project ID updated successfully`);
				this.loading = false;
				this.modalService.hide();
			}),
			map(() => void 0)
		);
	}

	get projectId() {
		return this.firebaseProjectForm.get('projectId');
	}

	submit() {
		this.submitted = true;

		if (this.firebaseProjectForm.valid) {
			this.loading = true;
			this.store.dispatch(
				updateFirebaseProjectId({
					environmentId: this.environmentId,
					projectId: this.projectId?.value,
				})
			);
		}
	}
}
