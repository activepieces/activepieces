import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';

import { BsModalRef } from 'ngx-bootstrap/modal';
import { Observable, tap } from 'rxjs';
import { fadeInUp400ms } from 'src/app/modules/common/animation/fade-in-up.animation';
import { CodeService } from 'src/app/modules/flow-builder/service/code.service';
type PackageName = string;
type PackageVersion = string;
@Component({
	selector: 'app-add-npm-package-modal',
	templateUrl: './add-npm-package-modal.component.html',
	animations: [fadeInUp400ms],
})
export class NewAddNpmPackageModalComponent implements OnInit {
	npmForm: UntypedFormGroup;
	@Output()
	packageFound$: EventEmitter<{ [key: PackageName]: PackageVersion }> = new EventEmitter();
	loading = false;
	npmPackage$: Observable<{ [key: PackageName]: PackageVersion } | null>;
	submitted = false;
	packageNameChanged$: Observable<void>;
	constructor(private formBuilder: UntypedFormBuilder, private modalRef: BsModalRef, private codeService: CodeService) {
		this.npmForm = this.formBuilder.group({ packageName: new UntypedFormControl('', Validators.required) });
	}

	ngOnInit(): void {
		const packaageNameControl = this.npmForm.get('packageName')!;
		this.packageNameChanged$ = packaageNameControl.valueChanges.pipe(
			tap(() => {
				packaageNameControl.setErrors(null);
			})
		);
	}
	hide() {
		this.modalRef.hide();
	}
	lookForNpmPackage() {
		this.submitted = true;
		if (this.npmForm.valid && !this.loading) {
			this.loading = true;
			this.npmPackage$ = this.codeService.getLatestVersionOfNpmPackage(this.npmForm.get('packageName')!.value).pipe(
				tap(pkg => {
					if (pkg) {
						console.log(pkg);
						this.packageFound$.emit(pkg);
						this.modalRef.hide();
					} else {
						this.npmForm.get('packageName')?.setErrors({ invalid: true });
					}
					this.loading = false;
				})
			);
		}
	}
}
