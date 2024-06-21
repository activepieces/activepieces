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
import { TEN_SECONDS } from '../../../utils/consts';

export interface DeleteEntityDialogData {
  entityName: string;
  note: string;
  note$?: Observable<string>;
  deleteEntity$: Observable<unknown>;
  errorMessageBuilder?: (e: unknown) => string | undefined;
}

@Component({
  templateUrl: './delete-entity-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeleteEntityDialogComponent {
  private DEFAULT_ERROR_MESSAGE = `<b>${this.data.entityName}</b> deletion failed, please check the console`;

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
        tap(() => {
          this.success();
          this.dialogRef.close(true);
        }),
        catchError((error) => this.handleError(error)),
        map(() => undefined)
      );
    }
  }

  success() {
    const successMessage = `<b>${this.data.entityName}</b> has been deleted successfully`;
    this.snackbar.openFromComponent(GenericSnackbarTemplateComponent, {
      data: successMessage,
    });
  }

  handleError(e: unknown) {
    const errorMessage =
      this.data.errorMessageBuilder?.(e) ?? this.DEFAULT_ERROR_MESSAGE;
    this.snackbar.openFromComponent(GenericSnackbarTemplateComponent, {
      data: errorMessage,
      panelClass: 'error',
      duration: TEN_SECONDS,
    });
    console.error(e);
    return of(e);
  }
}
