import { Component } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { ErrorCode, FolderDto } from '@activepieces/shared';
import { Observable, catchError, of, take, tap } from 'rxjs';
import {
  FolderActions,
  FoldersSelectors,
} from '@activepieces/ui/feature-folders-store';
import { Store } from '@ngrx/store';
import { MatDialogRef } from '@angular/material/dialog';
import { FolderValidator } from '../../../validators/folderName.validator';

import { FoldersService } from '@activepieces/ui/common';

@Component({
  selector: 'app-new-folder-dialog',
  templateUrl: './new-folder-dialog.component.html',
})
export class NewFolderDialogComponent {
  folderForm: FormGroup<{ displayName: FormControl<string> }>;
  creatingFolder$: Observable<FolderDto | undefined>;
  loading = false;
  constructor(
    private fb: FormBuilder,
    private foldersService: FoldersService,
    public dialogRef: MatDialogRef<NewFolderDialogComponent>,
    private store: Store
  ) {
    this.folderForm = this.fb.group({
      displayName: new FormControl('', {
        validators: Validators.required,
        asyncValidators: FolderValidator.createValidator(
          this.store.select(FoldersSelectors.selectFolders).pipe(take(1))
        ),
        nonNullable: true,
      }),
    });
  }
  createFolder() {
    if (this.folderForm.valid) {
      this.loading = true;
      this.creatingFolder$ = this.foldersService
        .create({
          displayName: this.folderForm.getRawValue().displayName.trim(),
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
              this.store.dispatch(FolderActions.addFolder({ folder }));
              this.dialogRef.close(folder.id);
            }
          })
        );
    }
  }
}
