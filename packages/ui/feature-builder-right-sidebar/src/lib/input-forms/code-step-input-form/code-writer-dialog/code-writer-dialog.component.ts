import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import {
  FormGroup,
  FormControl,
  FormBuilder,
  Validators,
} from '@angular/forms';
import { Observable, map, tap } from 'rxjs';
import { CodeWriterService } from './code-writer.service';

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
  repromptForm: FormGroup<{ prompt: FormControl<string> }>;
  promptOperation$: Observable<void> | undefined;
  receivedCode: string | undefined;

  constructor(
    private formBuilder: FormBuilder,
    private dialogRef: MatDialogRef<CodeWriterDialogComponent>,
    private codeWriterService: CodeWriterService,
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
    this.repromptForm = this.formBuilder.group({
      prompt: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required],
      }),
    });
  }

  prompt() {
    if (this.promptForm.valid && !this.promptOperation$) {
      let prompt: string = this.promptForm.controls.prompt.value;
      if (this.promptForm.controls.passExistingCode.value) {
        prompt = this.data.existingCode + '\n' + prompt;
      }

      this.promptOperation$ = this.codeWriterService.prompt(prompt).pipe(
        tap((response) => {
          const result = (response as unknown as { result: string }).result;
          this.receivedCode = result;
          this.promptOperation$ = undefined;
          this.repromptForm.reset();
        }),
        map(() => void 0)
      );
    }
  }

  update() {
    if (this.repromptForm.valid && !this.promptOperation$) {
      let prompt: string = this.repromptForm.controls.prompt.value;
      prompt = this.receivedCode + '\n' + prompt;

      this.promptOperation$ = this.codeWriterService.prompt(prompt).pipe(
        tap((response) => {
          const result = (response as unknown as { result: string }).result;
          this.receivedCode = result;
          this.promptOperation$ = undefined;
          this.repromptForm.controls.prompt.reset();
        }),
        map(() => void 0)
      );
    }
  }

  reset() {
    this.receivedCode = undefined;
    this.promptOperation$ = undefined;
    this.repromptForm.reset();
  }

  useCode() {
    this.dialogRef.close(this.receivedCode);
    this.reset();
  }
}

export interface CodeWriterDialogData {
  existingCode: string;
}
