import { Component, Inject } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Observable, tap, catchError, map } from 'rxjs';
import {
  FlagService,
  GenericSnackbarTemplateComponent,
  PieceMetadataModel,
} from '@activepieces/ui/common';
import { MatSnackBar } from '@angular/material/snack-bar';
import {
  ApFlagId,
  EXACT_VERSION_PATTERN,
  PackageType,
  PieceScope,
} from '@activepieces/shared';
import { PieceMetadataService } from '../services/piece.service';

type AddPackageFormControl = {
  packageType: FormControl<PackageType>;
  pieceName: FormControl<string>;
  pieceVersion: FormControl<string>;
  pieceArchive: FormControl<File | null>;
};

@Component({
  selector: 'ap-install-community-piece-modal',
  templateUrl: './install-community-piece-modal.component.html',
})
export class InstallCommunityPieceModalComponent {
  risksMarkdown = $localize`
  Use this to install a <a href="https://www.activepieces.com/docs/developers/building-pieces/create-action" target="_blank" rel="noopener">custom piece</a> that you (or someone else) created.
  Once the piece is installed, you can use it in the flow builder.
 <br><br>**Warning:**
 Make sure you trust the author as the piece will have access to your flow data and it might not be compatible with the current version of Activepieces.
  `;

  packageTypeOptions$: Observable<
    {
      name: string;
      value: PackageType;
    }[]
  >;

  loading = false;
  submitted = false;

  addPieceForm: FormGroup<AddPackageFormControl>;
  addPieceRequest$!: Observable<PieceMetadataModel | null>;
  pieceNameControlChanged$!: Observable<string>;

  constructor(
    @Inject(MAT_DIALOG_DATA)
    public data: { scope: PieceScope },
    private fb: FormBuilder,
    private pieceService: PieceMetadataService,
    private dialogRef: MatDialogRef<InstallCommunityPieceModalComponent>,
    private snackBar: MatSnackBar,
    private flagService: FlagService
  ) {
    this.addPieceForm = this.fb.group({
      packageType: this.fb.nonNullable.control(PackageType.REGISTRY, [
        Validators.required,
      ]),
      pieceName: this.fb.nonNullable.control('', [Validators.required]),
      pieceVersion: this.fb.nonNullable.control('', [
        Validators.required,
        Validators.pattern(EXACT_VERSION_PATTERN),
      ]),
      pieceArchive: this.fb.control<File | null>(null),
    });
    this.packageTypeOptions$ = this.flagService
      .isFlagEnabled(ApFlagId.PRIVATE_PIECES_ENABLED)
      .pipe(
        map((enabled) => {
          if (enabled) {
            return [
              {
                name: 'NPM Registry',
                value: PackageType.REGISTRY,
              },
              {
                name: 'Packed Archive (.tgz)',
                value: PackageType.ARCHIVE,
              },
            ];
          }
          return [
            {
              name: 'NPM Registry',
              value: PackageType.REGISTRY,
            },
          ];
        })
      );
  }

  get isPackageArchive(): boolean {
    return this.addPieceForm.controls.packageType.value === PackageType.ARCHIVE;
  }

  hide() {
    this.dialogRef.close();
  }

  addPiece() {
    this.submitted = true;
    if (this.addPieceForm.valid && !this.loading) {
      this.loading = true;
      const pieceInfo = this.addPieceForm.getRawValue();

      this.addPieceRequest$ = this.pieceService
        .installCommunityPiece({...pieceInfo,scope: this.data.scope,})
        .pipe(
          catchError((err) => {
            this.loading = false;
            this.addPieceForm.setErrors({
              failedInstall: true,
            });

            throw err;
          }),
          tap(() => {
            this.snackBar.openFromComponent(GenericSnackbarTemplateComponent, {
              data: `<b>${pieceInfo.pieceName}@${pieceInfo.pieceVersion}</b> added`,
            });

            this.dialogRef.close(pieceInfo);
          })
        );
    }
  }
}
