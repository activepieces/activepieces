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
import { RequestWriterDialogComponent } from './request-writer-dialog/request-writer-dialog.component';
import { GeneratedCodeService } from './request-writer-dialog/request-writer-dialog.service';

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
  generatedCode$: Observable<string | null>;

  constructor(
    private dialogService: MatDialog,
    private flagService: FlagService,
    private generatedCodeService: GeneratedCodeService
  ) {
    this.generateCodeEnabled$ = this.flagService.isFlagEnabled(
      ApFlagId.COPILOT_ENABLED
    );
    this.showGenerateCode$ = this.flagService.isFlagEnabled(
      ApFlagId.SHOW_COPILOT
    );
    this.generatedCode$ = this.generatedCodeService.getGeneratedCode$();
  }

  openCodeWriterDialog() {
    this.dialogService.open(RequestWriterDialogComponent);
  }
}
