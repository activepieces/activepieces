import { Component } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { FoldersService } from '../../../services/folders.service';
import { Folder } from '@activepieces/shared';
import { Observable, tap } from 'rxjs';
import { DialogRef } from '@angular/cdk/dialog';

@Component({
  selector: 'app-new-folder-dialog',
  templateUrl: './new-folder-dialog.component.html',
})
export class NewFolderDialogComponent {
  folderForm: FormGroup<{ displayName: FormControl<string> }>;
  creatingFolder$: Observable<Folder>;
  constructor(
    private fb: FormBuilder,
    private foldersService: FoldersService,
    public dialogRef: DialogRef
  ) {
    this.folderForm = this.fb.group({
      displayName: new FormControl('', {
        validators: Validators.required,
        nonNullable: true,
      }),
    });
  }
  createFolder() {
    if (this.folderForm.valid) {
      this.creatingFolder$ = this.foldersService
        .create(this.folderForm.getRawValue())
        .pipe(
          tap((f) => {
            console.log(f);
            this.dialogRef.close();
          })
        );
    }
  }
}
