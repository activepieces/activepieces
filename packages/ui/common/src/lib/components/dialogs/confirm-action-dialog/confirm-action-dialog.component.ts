import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { catchError, map, Observable, of, tap } from 'rxjs';
import { GenericSnackbarTemplateComponent } from '../../generic-snackbar-template/generic-snackbar-template.component';
import { TEN_SECONDS } from '../../../utils/consts';
export interface ConfirmActionDialogData {
  title: string;
  note: string;
  action$: Observable<unknown>;
  successMessage: string;
}

@Component({
  templateUrl: './confirm-action-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfirmActionDialogComponent {
  confirmationForm: FormGroup<{ confirmation: FormControl<string> }>;
  action$: Observable<void>;

  constructor(
    private snackbar: MatSnackBar,
    @Inject(MAT_DIALOG_DATA)
    public data: ConfirmActionDialogData,
    private dialogRef: MatDialogRef<ConfirmActionDialogData>
  ) {}

  submit() {
    if (!this.action$) {
      this.action$ = this.data.action$.pipe(
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
    this.snackbar.openFromComponent(GenericSnackbarTemplateComponent, {
      data: this.data.successMessage,
    });
  }

  handleError(e: unknown) {
    this.snackbar.openFromComponent(GenericSnackbarTemplateComponent, {
      data: $localize`Action failed`,
      panelClass: 'error',
      duration: TEN_SECONDS,
    });
    console.error(e);
    return of(e);
  }
}
