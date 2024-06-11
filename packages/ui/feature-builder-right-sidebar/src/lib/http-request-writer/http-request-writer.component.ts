import { ApFlagId } from '@activepieces/shared';
import {
  FlagService,
  UiCommonModule,
  codeGeneratorTooltip,
  disabledCodeGeneratorTooltip,
} from '@activepieces/ui/common';
import { UiFeatureBuilderFormControlsModule } from '@activepieces/ui/feature-builder-form-controls';
import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Observable } from 'rxjs';
import { CodeWriterDialogComponent } from '../input-forms/code-step-input-form/code-writer-dialog/code-writer-dialog.component';

@Component({
  selector: 'app-http-request-writer',
  standalone: true,
  imports: [CommonModule, UiCommonModule, UiFeatureBuilderFormControlsModule],
  templateUrl: './http-request-writer.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HttpRequestWriterComponent {
  dialogClosed$?: Observable<unknown>;
  generateCodeEnabled$: Observable<boolean>;
  showGenerateCode$: Observable<boolean>;
  codeGeneratorTooltip = codeGeneratorTooltip;
  disabledCodeGeneratorTooltip = disabledCodeGeneratorTooltip;

  constructor(
    private dialogService: MatDialog,
    private flagService: FlagService
  ) {
    this.generateCodeEnabled$ = this.flagService.isFlagEnabled(
      ApFlagId.COPILOT_ENABLED
    );
    this.showGenerateCode$ = this.flagService.isFlagEnabled(
      ApFlagId.SHOW_COPILOT
    );
  }
  openCodeWriterDialog() {
    this.dialogService.open(CodeWriterDialogComponent, {
      data: '',
    });
  }
}
