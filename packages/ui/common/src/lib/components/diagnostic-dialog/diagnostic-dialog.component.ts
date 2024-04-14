import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FormControl } from '@angular/forms';
import { UiCommonModule } from '../../ui-common.module';
import { jsonEditorOptionsMonaco } from '../../utils/consts';
import { Observable, forkJoin, of, switchMap } from 'rxjs';
import { FlagService } from '../../service';
import { ApFlagId } from '@activepieces/shared';

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
  enrichData$: Observable<void>;
  jsonFormControl: FormControl<unknown>;
  showSupport$: Observable<boolean>;
  constructor(
    @Inject(MAT_DIALOG_DATA) dialogData: DialogData,
    flagsService: FlagService
  ) {
    this.data = dialogData;
    this.jsonFormControl = new FormControl();
    this.showSupport$ = flagsService.isFlagEnabled(ApFlagId.SHOW_COMMUNITY);
    this.enrichData$ = forkJoin({
      edition: flagsService.getEdition(),
      currentVersion: flagsService.getStringFlag(ApFlagId.CURRENT_VERSION),
    }).pipe(
      switchMap(({ edition, currentVersion }) => {
        this.jsonFormControl.setValue(
          JSON.stringify(
            {
              instance: {
                edition,
                currentVersion,
              },
              error: this.data.information,
            },
            null,
            2
          )
        );
        return of(void 0);
      })
    );
  }

  openSupport() {
    window.open('https://activepieces.com/report-issue', '_blank');
  }
}
