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
import { BehaviorSubject, Observable, map, startWith } from 'rxjs';
import { RequestWriterDialogComponent } from './request-writer-dialog/request-writer-dialog.component';

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
  private generatedCodeSubject = new BehaviorSubject<string>(''); // Subject to handle the generated code
  generatedCode$ = this.generatedCodeSubject.asObservable(); // Observable to be used with async pipe

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
    const dialogRef = this.dialogService.open(RequestWriterDialogComponent);

    dialogRef
      .afterClosed()
      .pipe(
        map((code: string) => code || ''),
        startWith('')
      )
      .subscribe((code) => {
        console.log(JSON.parse(code));
        this.generatedCodeSubject.next(code);
      });
  }
}
