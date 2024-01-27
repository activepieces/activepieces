import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { BehaviorSubject, Observable, catchError, of, tap } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SyncProjectService } from '../services/sync-project.service';

export type PullDialogData = {
  projectName: string;
  repoId: string;
};

@Component({
  selector: 'app-pull-dialog',
  templateUrl: './pull-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PullDialogComponent {
  loading$ = new BehaviorSubject<boolean>(false);
  pull$?: Observable<void>;
  constructor(
    private syncProjectService: SyncProjectService,
    @Inject(MAT_DIALOG_DATA)
    public data: PullDialogData,
    private snackbar: MatSnackBar,
    private matDialogRef: MatDialogRef<PullDialogComponent>
  ) {}
  submit() {
    if (!this.loading$.value) {
      this.loading$.next(true);
      this.pull$ = this.syncProjectService.pull(this.data.repoId).pipe(
        tap(() => {
          this.snackbar.open($localize`Pulled successfully`);
          this.matDialogRef.close();
          window.location.reload();
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
