import { ApFlagId } from '@activepieces/shared';
import {
  FlagService,
  UiCommonModule,
  httpRequestGeneratorTooltip,
  disabledHttpRequestGeneratorTooltip,
} from '@activepieces/ui/common';
import { UiFeatureBuilderFormControlsModule } from '@activepieces/ui/feature-builder-form-controls';
import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Output,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Observable, tap } from 'rxjs';
import { RequestWriterDialogComponent } from './request-writer-dialog/request-writer-dialog.component';

@Component({
  selector: 'app-http-request-writer',
  standalone: true,
  imports: [CommonModule, UiCommonModule, UiFeatureBuilderFormControlsModule],
  templateUrl: './http-request-writer.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HttpRequestWriterComponent {
  @Output() httpRequestGenerated = new EventEmitter<Record<string, unknown>>();
  dialogClosed$?: Observable<Record<string, unknown>>;
  generateHttpRequestEnabled$: Observable<boolean>;
  showGeneratedHttpRequest$: Observable<boolean>;
  httpRequestGeneratorTooltip = httpRequestGeneratorTooltip;
  disableHttpRequestGeneratorTooltip = disabledHttpRequestGeneratorTooltip;

  constructor(
    private dialogService: MatDialog,
    private flagService: FlagService
  ) {
    this.generateHttpRequestEnabled$ = this.flagService.isFlagEnabled(
      ApFlagId.COPILOT_ENABLED
    );
    this.showGeneratedHttpRequest$ = this.flagService.isFlagEnabled(
      ApFlagId.SHOW_COPILOT
    );
  }

  openHttpRequestWriterDialog() {
    const dialogRef = this.dialogService.open(RequestWriterDialogComponent);

    this.dialogClosed$ = dialogRef.afterClosed().pipe(
      tap((result) => {
        if (result) {
          this.httpRequestGenerated.emit(result);
        }
      })
    );
  }
}
