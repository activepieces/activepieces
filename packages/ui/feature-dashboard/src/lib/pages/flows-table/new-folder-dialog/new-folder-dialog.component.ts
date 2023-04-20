import { Component } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { FoldersService } from '../../../services/folders.service';
import { FoldersListDto } from '@activepieces/shared';
import { Observable, tap } from 'rxjs';
import { FolderActions } from '../../../store/folders/folders.actions';
import { Store } from '@ngrx/store';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-new-folder-dialog',
  templateUrl: './new-folder-dialog.component.html',
})
export class NewFolderDialogComponent {
  folderForm: FormGroup<{ displayName: FormControl<string> }>;
  creatingFolder$: Observable<FoldersListDto>;
  constructor(
    private fb: FormBuilder,
    private foldersService: FoldersService,
    public dialogRef: MatDialogRef<NewFolderDialogComponent>,
    private store: Store
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
          tap((folder) => {
            this.store.dispatch(FolderActions.addFolder({ folder }));
            this.dialogRef.close(folder.id);
          })
        );
    }
  }
}
