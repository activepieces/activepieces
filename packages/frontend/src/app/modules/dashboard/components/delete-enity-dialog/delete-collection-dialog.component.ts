import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { catchError, map, Observable, of, tap } from 'rxjs';

export interface DeleteEntityDialogData {
  entityName: string;
  deleteEntity$: Observable<unknown>;
  note?: {
    text: string;
    danger: boolean;
  };
}

@Component({
  templateUrl: './delete-entity-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeleteEntityDialogComponent {
  confirmationForm: FormGroup<{ confirmation: FormControl<string> }>;
  deleteOperation$: Observable<void>;
  constructor(
    private formBuilder: FormBuilder,
    private snackBar: MatSnackBar,
    @Inject(MAT_DIALOG_DATA)
    public data: DeleteEntityDialogData,
    private dialogRef: MatDialogRef<DeleteEntityDialogComponent>
  ) {
    this.confirmationForm = this.formBuilder.group({
      confirmation: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, Validators.pattern('DELETE')],
      }),
    });
  }
  deleteCollection() {
    if (this.confirmationForm.valid && !this.deleteOperation$) {
      this.deleteOperation$ = this.data.deleteEntity$.pipe(
        catchError((err) => {
          this.snackBar.open(
            'An error occurred while deleting, please check your console',
            '',
            {
              duration: undefined,
              panelClass: 'error',
            }
          );
          console.error(err);
          return of(err);
        }),
        map(() => {
          return void 0;
        }),
        tap(() => {
          this.dialogRef.close(true);
          this.snackBar.open(
            `${this.data.entityName} was deleted successfully`
          );
        })
      );
    }
  }
}
