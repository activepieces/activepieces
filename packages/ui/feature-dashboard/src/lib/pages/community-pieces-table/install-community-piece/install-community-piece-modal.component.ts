import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { Observable, of, switchMap, tap, map } from 'rxjs';
import { PieceMetadataService, fadeInUp400ms } from '@activepieces/ui/common';
import { CodeService } from '@activepieces/ui/feature-builder-store';
@Component({
  selector: 'app-install-community-piece-modal',
  templateUrl: './install-community-piece-modal.component.html',
  animations: [fadeInUp400ms],
})
export class InstallCommunityPieceModalComponent implements OnInit {
  risksMarkdown = `
  **Warning: Installing a community piece is a risk.**

  - This community piece is not reviewed or maintained by Activepieces.
  - It may not be compatible with the current version of Activepieces.
  - It has access to all the data provided in the flow.
  
  Please exercise caution and ensure that you trust the author of the piece before installing it.
  <br>
  To install a community, you must provide the name of the npm package that contains the piece.
  `;

  npmForm: FormGroup<{ packageName: FormControl<string> }>;
  @Output()
  packageFound$: EventEmitter<void> = new EventEmitter();
  loading = false;
  npmPackage$: Observable<PieceMetadataService | null>;
  submitted = false;
  packageNameChanged$: Observable<string>;
  constructor(
    private formBuilder: FormBuilder,
    private codeService: CodeService,
    private pieceMetadataService: PieceMetadataService,
    private dialogRef: MatDialogRef<InstallCommunityPieceModalComponent>
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
          switchMap((pkg) => {
            if (pkg) {
              return this.pieceMetadataService
                .installCommunityPiece({
                  pieceName: Object.keys(pkg)[0],
                  pieceVersion: Object.values(pkg)[0],
                })
                .pipe(
                  tap(() => {
                    this.dialogRef.close(pkg);
                  }),
                  map(() => {
                    this.packageFound$.emit();
                    return null;
                  })
                );
            } else {
              this.npmForm.controls.packageName.setErrors({ invalid: true });
              return of(null);
            }
          }),
          tap(() => {
            this.loading = false;
          })
        );
    }
  }
}
