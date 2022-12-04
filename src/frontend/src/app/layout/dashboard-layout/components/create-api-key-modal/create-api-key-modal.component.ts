import { Component, OnInit, TemplateRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';
import { map, Observable, tap } from 'rxjs';
import { fadeInUp400ms } from '../../../common-layout/animation/fade-in-up.animation';
import { ApiKeysActions } from '../../store/action/api-keys.action';
import { Store } from '@ngrx/store';
import { Actions, ofType } from '@ngrx/effects';

@Component({
	selector: 'app-create-api-key-modal',
	templateUrl: './create-api-key-modal.component.html',
	styleUrls: [],
	animations: [fadeInUp400ms],
})
//WTF
export class CreateApiKeyModalComponent implements OnInit {
	submitted = false;
	loading = false;
	apiKeyForm: FormGroup;
	modalRef?: BsModalRef;

	createApiKeySuccessful$: Observable<void> = new Observable<void>();
	createApiKeyFailed$: Observable<void> = new Observable<void>();

	constructor(
		private formBuilder: FormBuilder,
		private store: Store,
		private actions$: Actions,
		private modalService: BsModalService
	) {}

	openModal(template: TemplateRef<any>) {
		this.modalRef = this.modalService.show(template);
	}

	ngOnInit() {
		this.apiKeyForm = this.formBuilder.group({
			name: ['', [Validators.required]],
		});
		this.createApiKeySuccessful$ = this.actions$.pipe(
			ofType(ApiKeysActions.createApiKeySuccess),
			tap(() => {
				this.apiKeyForm.reset();
				this.modalRef?.hide();
				this.loading = false;
			}),
			map(() => void 0)
		);
		this.createApiKeyFailed$ = this.actions$.pipe(
			ofType(ApiKeysActions.createApiKeyFailed),
			tap(() => {
				this.loading = false;
			}),
			map(() => void 0)
		);
	}

	createApiKey() {
		this.submitted = true;
		if (!this.apiKeyForm.value || this.loading) {
			return;
		}
		this.loading = true;
		this.store.dispatch(ApiKeysActions.createApiKey(this.apiKeyForm.value));
	}
}
