import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { BehaviorSubject, Observable, catchError, of, tap } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PopulatedFlow } from '@activepieces/shared';
import { SyncProjectService } from '../../../services/sync-project.service';

export type PushToGitDialogData = {
  projectName: string;
  repoId: string;
  flow: PopulatedFlow;
};

@Component({
  selector: 'app-push-dialog',
  templateUrl: './push-to-git-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PushToGitDialogComponent {
  commitMsgFormControl = new FormControl('', {
    nonNullable: true,
    validators: Validators.required,
  });
  loading$ = new BehaviorSubject<boolean>(false);
  push$?: Observable<void>;
  flowDisplayName = '';
  constructor(
    private syncProjectService: SyncProjectService,
    @Inject(MAT_DIALOG_DATA)
    public data: PushToGitDialogData,
    private snackbar: MatSnackBar,
    private matDialogRef: MatDialogRef<PushToGitDialogComponent>
  ) {
    this.flowDisplayName = this.data.flow.version.displayName;
  }
  submit() {
    this.commitMsgFormControl.markAllAsTouched();
    if (this.commitMsgFormControl.valid && !this.loading$.value) {
      this.loading$.next(true);
      const request = {
        flowId: this.data.flow?.id,
        commitMessage: this.commitMsgFormControl.getRawValue(),
      };

      this.push$ = this.syncProjectService.push(this.data.repoId, request).pipe(
        tap(() => {
          this.snackbar.open($localize`Pushed successfully`);
          this.matDialogRef.close();
        }),
        catchError((err) => {
          console.error(err);
          this.snackbar.open(
            $localize`Error occured, please check your console`,
            '',
            {
              panelClass: 'error',
            }
          );
          return of(void 0);
        }),
        tap(() => {
          this.loading$.next(false);
        })
      );
    }
  }
}
