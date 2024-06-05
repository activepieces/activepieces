import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FlagService,
  UiCommonModule,
  fadeIn400ms,
} from '@activepieces/ui/common';
import { MatDialog } from '@angular/material/dialog';
import { RequestTrialComponent } from '../request-trial/request-trial.component';
import { ApEdition } from '@activepieces/shared';
import { Observable, map, tap } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-request-trial-button-component',
  standalone: true,
  imports: [CommonModule, UiCommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [fadeIn400ms],
  template: `@if(showButton$ | async) {
    <ap-button
      btnColor="white"
      btnStyle="stroked"
      btnSize="medium"
      (buttonClicked)="openRequestTrialDialog()"
      i18n
    >
      <div class="ap-flex ap-gap-2 ap-items-center">🚀 <b>Free Trial</b></div>
    </ap-button>
    } @if(openDialog$ | async) {} `,
})
export class RequestTrialButtonComponent {
  showButton$: Observable<boolean>;
  openDialog$: Observable<boolean>;
  constructor(
    private matDialog: MatDialog,
    private flagsService: FlagService,
    private snackbar: MatSnackBar
  ) {
    this.showButton$ = this.flagsService.getEdition().pipe(
      map((env) => {
        return env !== ApEdition.CLOUD;
      })
    );
  }

  openRequestTrialDialog() {
    this.openDialog$ = this.flagsService.getDbType().pipe(
      map((dbType) => {
        return dbType === 'POSTGRES';
      }),
      tap((isPostgres) => {
        if (isPostgres) {
          this.matDialog.open(RequestTrialComponent, {
            panelClass: 'fullscreen-dialog',
          });
        } else {
          this.snackbar.open(
            $localize`Please switch your DBMS to Postgres to request a trial.`,
            $localize`Dismiss`
          );
        }
      })
    );
  }
}
