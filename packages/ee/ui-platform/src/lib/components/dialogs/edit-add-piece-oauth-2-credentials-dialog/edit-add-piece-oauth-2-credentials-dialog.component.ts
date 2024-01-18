import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { BehaviorSubject, Observable, catchError, map, tap } from 'rxjs';
import { FlagService, OAuth2AppsService } from '@activepieces/ui/common';

export type PieceOAuth2CredentialsDialogData = {
  isEditing: boolean;
  pieceName: string;
  pieceDisplayName: string;
};

@Component({
  selector: 'app-edit-add-piece-oauth-2-credentials-dialog',
  templateUrl: './edit-add-piece-oauth-2-credentials-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditAddPieceOAuth2CredentialsDialogComponent {
  readonly edit = $localize`Edit`;
  readonly add = $localize`Add`;
  readonly credentials = $localize`OAuth2 app`;
  loading$ = new BehaviorSubject(false);
  upsertOAuth2App$?: Observable<void>;
  formGroup: FormGroup<{
    clientId: FormControl<string>;
    clientSecret: FormControl<string>;
  }>;
  redirectUrlNote$!: Observable<string>;
  constructor(
    private fb: FormBuilder,
    @Inject(MAT_DIALOG_DATA)
    public data: PieceOAuth2CredentialsDialogData,
    private oauth2AppsService: OAuth2AppsService,
    private dialogRef: MatDialogRef<EditAddPieceOAuth2CredentialsDialogComponent>,
    private flagsService: FlagService
  ) {
    this.formGroup = this.fb.group({
      clientId: this.fb.control<string>('', {
        nonNullable: true,
        validators: [Validators.required],
      }),
      clientSecret: this.fb.control<string>('', {
        nonNullable: true,
        validators: [Validators.required],
      }),
    });
    this.setRedriectUrlNote();
  }
  setRedriectUrlNote() {
    this.redirectUrlNote$ = this.flagsService.getFrontendUrl().pipe(
      map((frontendUrl) => {
        return (
          $localize`Please use ` +
          `${frontendUrl}/redirect` +
          $localize` as your redirect URL in your OAuth2 app`
        );
      })
    );
  }

  submit() {
    this.formGroup.markAllAsTouched();
    if (!this.loading$.value && this.formGroup.valid) {
      this.loading$.next(true);
      const rawData = this.formGroup.getRawValue();
      this.upsertOAuth2App$ = this.oauth2AppsService
        .uspertOAuth2AppCredentials({
          pieceName: this.data.pieceName,
          clientId: rawData.clientId,
          clientSecret: rawData.clientSecret,
        })
        .pipe(
          tap(() => {
            this.loading$.next(false);
            this.dialogRef.close(true);
          }),
          catchError((err) => {
            this.loading$.next(false);
            console.error(err);
            throw err;
          })
        );
    }
  }
}
