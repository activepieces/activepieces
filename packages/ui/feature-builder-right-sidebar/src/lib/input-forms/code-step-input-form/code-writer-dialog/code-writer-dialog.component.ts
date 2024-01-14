import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import {
  FormGroup,
  FormControl,
  FormBuilder,
  Validators,
} from '@angular/forms';
import { BehaviorSubject, Observable, map, tap } from 'rxjs';
import { CodeWriterService } from './code-writer.service';
import { FlagService } from '@activepieces/ui/common';
import { ApEdition } from '@activepieces/shared';
export interface CodeWriterDialogData {
  existingCode: string;
}
@Component({
  selector: 'app-code-writer-dialog',
  templateUrl: './code-writer-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CodeWriterDialogComponent {
  promptForm: FormGroup<{
    prompt: FormControl<string>;
    passExistingCode: FormControl<boolean>;
  }>;
  promptOperation$?: Observable<void>;
  receivedCode = '';
  loading$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  betaNote = $localize`<b> Note: </b> This feature uses OpenAi's API to generate code, it will be available for free during the beta period.`;
  isCloudEdition$: Observable<boolean>;
  constructor(
    private formBuilder: FormBuilder,
    private dialogRef: MatDialogRef<CodeWriterDialogComponent>,
    private codeWriterService: CodeWriterService,
    private flagService: FlagService,
    @Inject(MAT_DIALOG_DATA)
    public data: CodeWriterDialogData
  ) {
    this.promptForm = this.formBuilder.group({
      prompt: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required],
      }),
      passExistingCode: new FormControl(false, {
        nonNullable: true,
      }),
    });
    this.isCloudEdition$ = this.flagService
      .getEdition()
      .pipe(map((edition) => edition === ApEdition.CLOUD));
  }

  prompt(reprompt = false) {
    if (this.promptForm.valid && !this.loading$.value) {
      this.loading$.next(true);
      this.promptForm.disable();
      let prompt: string = this.promptForm.controls.prompt.value;
      if (this.promptForm.controls.passExistingCode.value || reprompt) {
        prompt = this.data.existingCode + '\n' + prompt;
      }
      this.promptOperation$ = this.codeWriterService.prompt(prompt).pipe(
        tap((response) => {
          this.promptForm.enable();
          const result = response.result;
          this.receivedCode = result;
          this.loading$.next(false);
        }),
        map(() => void 0)
      );
    }
  }

  reset() {
    this.receivedCode = '';
    this.promptForm.reset();
  }

  useCode() {
    this.dialogRef.close(this.receivedCode);
    this.reset();
  }
}
