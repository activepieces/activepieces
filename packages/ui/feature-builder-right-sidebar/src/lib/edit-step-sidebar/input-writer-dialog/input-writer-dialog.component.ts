import {
  ChangeDetectionStrategy,
  Component,
  Inject,
  ViewChild,
} from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import {
  FormGroup,
  FormControl,
  FormBuilder,
  Validators,
} from '@angular/forms';
import { BehaviorSubject, Observable, map, tap } from 'rxjs';
import { InputWriterService } from './input-writer.service';
import { FlagService, HighlightService } from '@activepieces/ui/common';
import { ApEdition, FlowVersion } from '@activepieces/shared';
import { MatStepper } from '@angular/material/stepper';

export interface InputWriterDialogData {
  flowVersion: FlowVersion;
  selectedStep: string;
}
@Component({
  selector: 'app-input-writer-dialog',
  templateUrl: './input-writer-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InputWriterDialogComponent {
  @ViewChild(MatStepper) stepper: MatStepper;
  promptForm: FormGroup<{
    prompt: FormControl<string>;
  }>;
  promptOperation$?: Observable<void>;
  receivedInputs$: BehaviorSubject<string> = new BehaviorSubject<string>('');
  receivedInputs: {
    step: string;
    input: unknown;
  }[] = [];
  loading$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  betaNote = $localize`<b> Note: </b> This feature uses OpenAI's API to generate inputs, it will be available for free during the beta period.`;
  isCloudEdition$: Observable<boolean>;
  /**Prism refuses to render new text within it so you have to destroy the element and build it again, this flag will do that */
  prisimFix = false;
  constructor(
    private formBuilder: FormBuilder,
    private dialogRef: MatDialogRef<InputWriterDialogComponent>,
    private inputWriterService: InputWriterService,
    private flagService: FlagService,
    private highlightService: HighlightService,
    @Inject(MAT_DIALOG_DATA)
    public data: InputWriterDialogData
  ) {
    this.promptForm = this.formBuilder.group({
      prompt: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required],
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
      const prompt: string =
        JSON.stringify(this.data.flowVersion.trigger) +
        '\n' +
        this.promptForm.controls.prompt.value;
      this.promptOperation$ = this.inputWriterService
        .generateInputs(prompt)
        .pipe(
          tap((response) => {
            this.promptForm.enable();
            this.promptForm.controls.prompt.removeValidators(
              Validators.required
            );
            this.promptForm.controls.prompt.setValue('');
            try {
              const result: {
                inputs: {
                  step: string;
                  input: any;
                }[];
              } = JSON.parse(response.result);
              this.receivedInputs = result.inputs.filter(
                (input) => input.step === this.data.selectedStep
              )[0]?.input;
              this.receivedInputs$.next(JSON.stringify(result.inputs));
              if (this.stepper.selected) {
                this.stepper.selected.completed = true;
                this.stepper.next();
              }
              this.prisimFix = !this.prisimFix;
              this.highlightPrism();
            } catch (e) {
              console.error('Copilot response not valid JSON.');
              console.error((e as Error).message);
            }
            this.loading$.next(false);
          }),
          map(() => void 0)
        );
    }
  }

  reset() {
    this.receivedInputs$.next('');
    this.receivedInputs = [];
    this.promptForm.reset();
  }

  useInputs() {
    this.dialogRef.close({
      inputs: this.receivedInputs,
    });
    this.reset();
  }
  private highlightPrism() {
    setTimeout(() => {
      this.highlightService.highlightAll();
    }, 10);
  }
}
