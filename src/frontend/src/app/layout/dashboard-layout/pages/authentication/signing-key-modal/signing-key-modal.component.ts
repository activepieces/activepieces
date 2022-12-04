import { Component, Input, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ofType } from '@ngrx/effects';
import { ActionsSubject, Store } from '@ngrx/store';
import { BsModalRef } from 'ngx-bootstrap/modal';
import { map, Observable, tap } from 'rxjs';
import { download } from 'src/app/layout/common-layout/helper/helpers';
import { ProjectAuthentication } from 'src/app/layout/common-layout/model/authentication';
import { checkboxIsTrue } from 'src/app/layout/common-layout/validators';
import {
	clearSigningKeyCredentials,
	generateSigningKey,
	generateSigningKeyFailed,
	generateSigningKeySuccessful,
} from '../../../store/action/authentication.action';

@Component({
	selector: 'app-signing-key-modal',
	templateUrl: './signing-key-modal.component.html',
	styleUrls: ['./signing-key-modal.component.scss'],
})
export class SigningKeyModalComponent implements OnInit {
	@Input()
	environmentId: string;
	@Input()
	environmentName: string;
	newKey = '';
	closedPressed = false;
	loading = false;
	keyCopied = false;
	agreementFormControl = new FormControl(false, checkboxIsTrue());
	signingKeyToClean: ProjectAuthentication;

	constructor(
		public bsModalRef: BsModalRef,
		private snackbar: MatSnackBar,
		private actionListener$: ActionsSubject,
		private store: Store
	) {}

	generateSigningKeySuccessful$: Observable<void> = new Observable<void>();
	generateSigningKeyFailed$: Observable<void> = new Observable<void>();

	ngOnInit(): void {
		// TODO MOVE THESE TO EFFECTS
		this.generateSigningKeySuccessful$ = this.actionListener$.pipe(
			ofType(generateSigningKeySuccessful),
			tap(action => {
				this.signingKeyToClean = action.signingKey;
				this.loading = false;
				this.newKey = action.signingKey.privateKey!;
			}),
			map(value => void 0)
		);

		this.generateSigningKeyFailed$ = this.actionListener$.pipe(
			ofType(generateSigningKeyFailed),
			tap(() => {
				this.snackbar.open('Signing Keys generation failed ', '', {
					duration: undefined,
					panelClass: 'error',
				});
				this.loading = false;
			}),
			map(() => void 0)
		);
	}

	generate() {
		this.loading = true;
		this.store.dispatch(generateSigningKey({ environmentId: this.environmentId }));
	}

	close() {
		this.closedPressed = true;
		if (!this.agreementFormControl.invalid) {
			this.store.dispatch(clearSigningKeyCredentials({ key: this.signingKeyToClean }));
			this.snackbar.open('Signing key generated successfully');
			this.bsModalRef.hide();
		}
	}

	copyKey() {
		this.keyCopied = true;
		navigator.clipboard.writeText(this.newKey);
		this.snackbar.open('Signing key copied to clipboard');
	}

	downloadKey() {
		const now = new Date();
		const fileName = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now
			.getDate()
			.toString()
			.padStart(2, '0')}`;
		download(fileName, this.newKey);
	}
}
