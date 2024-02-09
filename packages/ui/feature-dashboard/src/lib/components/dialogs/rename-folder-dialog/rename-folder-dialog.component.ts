import { Component, Inject } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { Observable, catchError, map, of, take, tap } from 'rxjs';
import {
  FolderActions,
  FoldersSelectors,
} from '@activepieces/ui/feature-folders-store';
import { Store } from '@ngrx/store';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FolderValidator } from '../../../validators/folderName.validator';
import { ErrorCode } from '@activepieces/shared';
import { FoldersService } from '@activepieces/ui/common';

export interface RenameFolderDialogData {
  folderId: string;
  folderDisplayName: string;
}

@Component({
  selector: 'app-rename-folder-dialog',
  templateUrl: './rename-folder-dialog.component.html',
})
export class RenameFolderDialogComponent {
  folderForm: FormGroup<{ displayName: FormControl<string> }>;
  renamingFolder$: Observable<void>;
  displayNameIsReplicated = false;
  loading = false;
  valueChanges$: Observable<string>;
  constructor(
    private fb: FormBuilder,
    private foldersService: FoldersService,
    public dialogRef: MatDialogRef<RenameFolderDialogComponent>,
    private store: Store,
    @Inject(MAT_DIALOG_DATA)
    public data: RenameFolderDialogData
  ) {
    this.folderForm = this.fb.group({
      displayName: new FormControl('', {
        validators: Validators.required,
        asyncValidators: FolderValidator.createValidator(
          this.store.select(FoldersSelectors.selectFolders).pipe(take(1)),
          this.data.folderId
        ),
        nonNullable: true,
      }),
    });
    this.valueChanges$ = this.folderForm.controls.displayName.valueChanges.pipe(
      tap(() => {
        this.displayNameIsReplicated = false;
      })
    );
  }
  renameFolder() {
    if (this.folderForm.valid) {
      this.renamingFolder$ = this.foldersService
        .renameFolder({
          displayName: this.folderForm.getRawValue().displayName.trim(),
          folderId: this.data.folderId,
        })
        .pipe(
          catchError((err) => {
            if (err.error.code === ErrorCode.VALIDATION) {
              this.folderForm.controls.displayName.setErrors({
                nameUsed: true,
              });
            }
            console.error(err);
            return of(undefined);
          }),
          tap((folder) => {
            this.loading = false;
            if (folder) {
              this.store.dispatch(
                FolderActions.renameFolder({
                  folderId: this.data.folderId,
                  newName: this.folderForm.controls.displayName.value,
                })
              );
              this.dialogRef.close();
            }
          }),
          map(() => void 0)
        );
    }
  }
}
