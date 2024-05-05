import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Observable, catchError, forkJoin, map } from 'rxjs';
import { ApFlagId } from '@activepieces/shared';
import { UiCommonModule } from '../../../ui-common.module';
import { jsonEditorOptionsMonaco } from '../../../utils/consts';
import { FlagService } from '../../../service';

export type DialogData = {
  information: unknown;
};

@Component({
  selector: 'ap-diagnostic-dialog',
  templateUrl: './diagnostic-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [UiCommonModule],
})
export class DiagnosticDialogComponent {
  data: DialogData;
  readonly jsonEditorOptionsMonaco = jsonEditorOptionsMonaco;
  enrichData$: Observable<string>;
  showSupport$: Observable<boolean>;
  constructor(
    @Inject(MAT_DIALOG_DATA) dialogData: DialogData,
    flagsService: FlagService
  ) {
    this.data = dialogData;
    this.showSupport$ = flagsService.isFlagEnabled(ApFlagId.SHOW_COMMUNITY);
    this.enrichData$ = forkJoin({
      edition: flagsService.getEdition(),
      currentVersion: flagsService.getStringFlag(ApFlagId.CURRENT_VERSION),
    }).pipe(
      map(({ edition, currentVersion }) => {
        return JSON.stringify(
          {
            instance: {
              edition,
              currentVersion,
            },
            error: this.data.information,
          },
          null,
          2
        );
      }),
      catchError((err) => {
        console.error(err);
        return JSON.stringify({ error: this.data.information });
      })
    );
  }

  openSupport() {
    window.open('https://activepieces.com/report-issue', '_blank');
  }
}
