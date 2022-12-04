import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { BsModalRef } from 'ngx-bootstrap/modal';
import { HttpErrorResponse, HttpStatusCode } from '@angular/common/http';
import { AccountService } from '../../service/account.service';
import { Account } from '../../model/account.interface';
import { EnvironmentService } from '../../service/environment.service';
import { fadeInUp400ms } from '../../animation/fade-in-up.animation';
import { switchMap, throwError } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
	selector: 'app-create-account-modal',
	templateUrl: './create-account-modal.component.html',
	styleUrls: [],
	animations: [fadeInUp400ms],
})
export class CreateAccountModalComponent implements OnInit {
	submitted = false;
	loading = false;
	accountForm: FormGroup;
	accountExists: boolean = false;

	@Output() created: EventEmitter<Account> = new EventEmitter<Account>();

	constructor(
		public bsModalRef: BsModalRef,
		private formBuilder: FormBuilder,
		private snackbar: MatSnackBar,
		private environmentService: EnvironmentService,
		private accountService: AccountService
	) {}

	ngOnInit() {
		this.accountForm = this.formBuilder.group({
			name: ['', [Validators.required]],
		});
	}

	createAccount() {
		this.submitted = true;
		if (!this.accountForm.valid || this.loading) {
			return;
		}
		this.accountExists = false;
		this.loading = true;

		this.environmentService
			.cachedSelectedEnvironment()
			.pipe(
				switchMap(environment => {
					if (!environment) {
						return throwError(() => new Error('selected environment is null'));
					}
					const request = this.accountForm.value;
					return this.accountService.create(environment.id, request);
				})
			)
			.subscribe({
				next: (response: Account) => {
					this.loading = false;
					this.created.emit(response);
					this.bsModalRef?.hide();
					this.accountForm.reset();
				},
				error: (error: HttpErrorResponse) => {
					console.log(error);
					if (error.status === HttpStatusCode.Conflict) {
						this.accountExists = true;
					} else if (error.status == HttpStatusCode.PaymentRequired) {
						this.snackbar.open(
							'You reached the maximum accounts number allowed. Contact support to discuss your plan.',
							'',
							{
								duration: 3000,
								panelClass: 'error',
							}
						);
						this.bsModalRef.hide();
					}
					this.loading = false;
				},
			});
	}
}
