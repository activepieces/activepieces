import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { BehaviorSubject, Observable, catchError, map, of, tap } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SyncProjectService } from '../../../services/sync-project.service';

export type PullFromGitDialogData = {
  operations: string[]
  repoId: string;
};

@Component({
  selector: 'app-pull-from-git-dialog',
  templateUrl: './pull-from-git-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PullFromGitDialogComponent {
  loading$ = new BehaviorSubject<boolean>(false);
  pull$?: Observable<void>;
  constructor(
    private syncProjectService: SyncProjectService,
    @Inject(MAT_DIALOG_DATA)
    public data: PullFromGitDialogData,
    private snackbar: MatSnackBar,
    private matDialogRef: MatDialogRef<PullFromGitDialogComponent>
  ) { }

  submit() {
    if (!this.loading$.value) {
      this.loading$.next(true);
      this.pull$ = this.syncProjectService.pull(this.data.repoId, {
        dryRun: false,
      }).pipe(
        tap((response) => {
          if (response.errors.length > 0) {
            this.snackbar.open($localize`${response.errors.length} Flows failed to publish`, '', {
              panelClass: 'error',
            });
          } else {
            this.snackbar.open($localize`Pulled successfully`);
          }
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
        map(() => void 0),
        tap(() => {
          this.loading$.next(false);
        })
      );
    }
  }
}
