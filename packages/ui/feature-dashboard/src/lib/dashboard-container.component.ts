import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatSnackBar, MatSnackBarRef } from '@angular/material/snack-bar';
import { FlagService } from '@activepieces/ui/common';
import { map, Observable, tap } from 'rxjs';
import { ApEdition } from '@activepieces/shared';
import { RunsLeftSnackbarComponent } from '@activepieces/ee/billing/ui';
declare const Beamer: { init: () => {} };
@Component({
  templateUrl: './dashboard-container.component.html',
  styleUrls: ['./dashboard-container.component.scss'],
  selector: 'app-dashboard-container',
})
export class DashboardContainerComponent implements OnInit, OnDestroy {
  runsLeftSnackBarRef!: MatSnackBarRef<RunsLeftSnackbarComponent>;
  showSnackbar$!: Observable<void>;

  constructor(
    private snackBar: MatSnackBar,
    private flagService: FlagService
  ) {}

  ngOnInit(): void {
    if (Beamer) {
      Beamer?.init();
    } else {
      console.error('Failed to initialise Beamer');
    }

    this.showSnackbar$ = this.flagService.getEdition().pipe(
      tap((edition) => {
        if (edition === ApEdition.ENTERPRISE) {
          this.runsLeftSnackBarRef = this.snackBar.openFromComponent(
            RunsLeftSnackbarComponent,
            {
              duration: undefined,
            }
          );
        }
      }),
      map(() => void 0)
    );
  }

  ngOnDestroy(): void {
    if (this.runsLeftSnackBarRef !== undefined) {
      this.runsLeftSnackBarRef.dismiss();
    }
  }
}
