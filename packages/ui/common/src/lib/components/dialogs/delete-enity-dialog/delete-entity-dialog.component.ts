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
import { GenericSnackbarTemplateComponent } from '../../generic-snackbar-template/generic-snackbar-template.component';
import { matchesString } from '../../../validators';

export interface DeleteEntityDialogData {
  entityName: string;
  deleteEntity$: Observable<unknown>;
  note: string;
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
    private snackbar: MatSnackBar,
    @Inject(MAT_DIALOG_DATA)
    public data: DeleteEntityDialogData,
    private dialogRef: MatDialogRef<DeleteEntityDialogComponent>
  ) {
    this.confirmationForm = this.formBuilder.group({
      confirmation: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, matchesString('delete')],
      }),
    });
  }
  submit() {
    if (this.confirmationForm.valid && !this.deleteOperation$) {
      this.deleteOperation$ = this.data.deleteEntity$.pipe(
        catchError((err) => {
          this.snackbar.open(
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
          this.snackbar.openFromComponent(GenericSnackbarTemplateComponent, {
            data: `<b> ${this.data.entityName}</b> Deleted`,
          });
        })
      );
    }
  }
}
