import { Component, EventEmitter, OnInit } from '@angular/core';
import { BsModalRef } from 'ngx-bootstrap/modal';
import { HttpClient } from '@angular/common/http';
import { catchError, map, Observable, of, Subject, switchMap, tap } from 'rxjs';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { fadeInUp400ms } from 'src/app/modules/common/animation/fade-in-up.animation';

@Component({
	selector: 'app-add-npm-package-modal',
	templateUrl: './add-npm-package-modal.component.html',
	styleUrls: ['./add-npm-package-modal.component.css'],
	animations: [fadeInUp400ms],
})
export class AddNpmPackageModalComponent implements OnInit {
	loading = false;
	submitted = false;

	npmForm: FormGroup;
	errorMessage: string | undefined = undefined;

	npmButtonClicked$: Observable<void> = new Observable<void>();

	private addNpmButtonClicked: Subject<void> = new Subject<void>();
	public packageEmitter: EventEmitter<{ package: string; version: string }> = new EventEmitter<any>();

	constructor(public modalRef: BsModalRef, private formBuilder: FormBuilder, private httpClient: HttpClient) {}

	ngOnInit(): void {
		this.npmForm = this.formBuilder.group({
			npmName: [, [Validators.required]],
		});
		this.npmButtonClicked$ = this.addNpmButtonClicked.pipe(
			switchMap(value => {
				const npmName = this.npmForm.controls['npmName'].value;
				this.loading = true;
				return this.latestVersion(npmName).pipe(catchError(err => of(undefined)));
			}),
			tap(pkg => {
				const npmName = this.npmForm.controls['npmName'].value;
				if (pkg !== undefined) {
					const lastVersion = pkg['dist-tags']['latest'];
					if (lastVersion != undefined) {
						this.packageEmitter.emit({
							package: npmName,
							version: lastVersion,
						});
						this.modalRef.hide();
					}
					this.loading = false;
				} else {
					this.errorMessage = npmName + ' is not found!';
					this.loading = false;
				}
			}),
			map(() => void 0)
		);
	}

	latestVersion(npmName: string): Observable<any> {
		return this.httpClient.get('https://registry.npmjs.org/' + npmName, undefined);
	}

	submitText() {
		this.errorMessage = undefined;
		this.submitted = true;
		if (this.npmForm.invalid) {
			return;
		}
		this.addNpmButtonClicked.next();
	}
}
