import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UiCommonModule } from '@activepieces/ui/common';
import { BehaviorSubject, Observable, catchError, tap } from 'rxjs';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { TagsService } from '../tags.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Tag } from '@activepieces/shared';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'ap-create-tag-dialog',
  standalone: true,
  imports: [CommonModule, UiCommonModule],
  templateUrl: './create-tag-dialog.component.html',
})
export class CreateTagDialogComponent {

  createTag$: Observable<Tag> | undefined;
  formGroup: FormGroup<{
    name: FormControl<string>;
  }>;
  loading$ = new BehaviorSubject(false);

  constructor(private fb: FormBuilder,
    private tagsService: TagsService,
    private matsnackbar: MatSnackBar,
    private dialogRef: MatDialogRef<CreateTagDialogComponent>,) {
    this.formGroup = this.fb.group({
      name: this.fb.control<string>('', {
        nonNullable: true,
        validators: [Validators.required, Validators.pattern(/^[a-zA-Z0-9\s_-]+$/)],
      })
    });
  }

  create() {
    this.formGroup.markAllAsTouched();
    if (!this.loading$.value && this.formGroup.valid) {
      this.loading$.next(true);
      this.createTag$ = this.tagsService.upsert({
        name: this.formGroup.controls.name.value
      }).pipe(
        tap(_tag => {
          this.loading$.next(false);
          this.matsnackbar.open('Tag created successfully', 'Close', {
            duration: 3000
          });
          this.dialogRef.close();
        }),
        catchError(err => {
          this.loading$.next(false);
          this.matsnackbar.open('Error creating tag', 'Close', {
            duration: 3000
          });
          throw err;
        }))
    }
  }
}
