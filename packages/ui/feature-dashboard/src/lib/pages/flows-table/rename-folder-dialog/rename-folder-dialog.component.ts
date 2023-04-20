import { Component, Inject } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { FoldersService } from '../../../services/folders.service';
import { Observable, tap } from 'rxjs';
import { FolderActions } from '../../../store/folders/folders.actions';
import { Store } from '@ngrx/store';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

export interface RenameFolderDialogData {
  folderId: string;
}

@Component({
  selector: 'app-rename-folder-dialog',
  templateUrl: './rename-folder-dialog.component.html',
})
export class RenameFolderDialogComponent {
  folderForm: FormGroup<{ displayName: FormControl<string> }>;
  renamingFolder$: Observable<void>;
  constructor(
    private fb: FormBuilder,
    private foldersService: FoldersService,
    public dialogRef: MatDialogRef<RenameFolderDialogComponent>,
    private store: Store,
    @Inject(MAT_DIALOG_DATA)
    public data: RenameFolderDialogData,
  ) {
    this.folderForm = this.fb.group({
      displayName: new FormControl('', {
        validators: Validators.required,
        nonNullable: true,
      }),
    });
  }
  renameFolder() {
    if (this.folderForm.valid) {
      this.renamingFolder$ = this.foldersService
        .renameFolder({displayName:this.folderForm.controls.displayName.value, folderId:this.data.folderId})
        .pipe(
          tap(() => {
            this.store.dispatch(FolderActions.renameFolder({ folderId:this.data.folderId, newName:this.folderForm.controls.displayName.value }));
            this.dialogRef.close();
          })
        );
    }
  }
}
