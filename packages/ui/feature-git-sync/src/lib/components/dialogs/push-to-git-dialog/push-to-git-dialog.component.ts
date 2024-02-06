import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { BehaviorSubject, Observable, catchError, of, tap } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PushSyncMode } from '@activepieces/shared';
import { PopulatedFlow } from '@activepieces/shared';
import { SyncProjectService } from '../../../services/sync-project.service';

export type PushToGitDialogData =
  | {
      projectName: string;
      repoId: string;
      mode: PushSyncMode.PROJECT;
    }
  | {
      projectName: string;
      repoId: string;
      mode: PushSyncMode.FLOW;
      flow: PopulatedFlow;
    };

@Component({
  selector: 'app-push-dialog',
  templateUrl: './push-to-git-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PushToGitDialogComponent {
  readonly PushSyncMode=PushSyncMode;
  commitMsgFormControl = new FormControl('', {
    nonNullable: true,
    validators: Validators.required,
  });
  loading$ = new BehaviorSubject<boolean>(false);
  push$?: Observable<void>;
  flowDisplayName='';
  constructor(
    private syncProjectService: SyncProjectService,
    @Inject(MAT_DIALOG_DATA)
    public data: PushToGitDialogData,
    private snackbar: MatSnackBar,
    private matDialogRef: MatDialogRef<PushToGitDialogComponent>
  ) {
    if(this.data.mode===PushSyncMode.FLOW){
      this.flowDisplayName=this.data.flow.version.displayName;
    }
  }
  submit() {
    this.commitMsgFormControl.markAllAsTouched();
    if (this.commitMsgFormControl.valid && !this.loading$.value) {
      this.loading$.next(true);
      let request;
      switch (this.data.mode) {
        case PushSyncMode.FLOW:
          request = {
            flowId: this.data.flow?.id,
            mode: this.data.mode,
            commitMessage: this.commitMsgFormControl.getRawValue(),
          };
          break;
        case PushSyncMode.PROJECT:
          request = {
            mode: this.data.mode,
            commitMessage: this.commitMsgFormControl.getRawValue(),
          };
          break;
      }

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
