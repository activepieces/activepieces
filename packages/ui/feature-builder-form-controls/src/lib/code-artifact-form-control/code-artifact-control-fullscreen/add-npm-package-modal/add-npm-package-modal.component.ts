import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { Observable, tap } from 'rxjs';
import { fadeInUp400ms } from '@activepieces/ui/common';
import { CodeService } from '@activepieces/ui/feature-builder-store';
type PackageName = string;
type PackageVersion = string;
@Component({
  selector: 'app-add-npm-package-modal',
  templateUrl: './add-npm-package-modal.component.html',
  animations: [fadeInUp400ms],
})
export class AddNpmPackageModalComponent implements OnInit {
  npmForm: FormGroup<{ packageName: FormControl<string> }>;
  @Output()
  packageFound$: EventEmitter<{ [key: PackageName]: PackageVersion }> =
    new EventEmitter();
  loading = false;
  npmPackage$: Observable<{ [key: PackageName]: PackageVersion } | null>;
  submitted = false;
  packageNameChanged$: Observable<string>;
  constructor(
    private formBuilder: FormBuilder,
    private codeService: CodeService,
    private dialogRef: MatDialogRef<AddNpmPackageModalComponent>
  ) {
    this.npmForm = this.formBuilder.group({
      packageName: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required],
      }),
    });
  }
  ngOnInit(): void {
    const packaageNameControl = this.npmForm.controls.packageName;
    this.packageNameChanged$ = packaageNameControl.valueChanges.pipe(
      tap(() => {
        packaageNameControl.setErrors(null);
      })
    );
  }
  hide() {
    this.dialogRef.close();
  }
  lookForNpmPackage() {
    this.submitted = true;
    if (this.npmForm.valid && !this.loading) {
      this.loading = true;
      this.npmPackage$ = this.codeService
        .getLatestVersionOfNpmPackage(this.npmForm.controls.packageName.value)
        .pipe(
          tap((pkg) => {
            if (pkg) {
              this.packageFound$.emit(pkg);
              this.dialogRef.close(pkg);
            } else {
              this.npmForm.controls.packageName.setErrors({ invalid: true });
            }
            this.loading = false;
          })
        );
    }
  }
}
