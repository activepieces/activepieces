import { HighlightService, UiCommonModule } from '@activepieces/ui/common';
import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, ViewChild } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { MatDialogModule } from '@angular/material/dialog';
import { MatStepper, MatStepperModule } from '@angular/material/stepper';
import { BehaviorSubject, Observable, map, tap } from 'rxjs';
import { RequestWriterService } from './request-writer.service';

@Component({
  selector: 'app-request-writer-dialog',
  standalone: true,
  imports: [CommonModule, UiCommonModule, MatStepperModule, MatDialogModule],
  templateUrl: './request-writer-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RequestWriterDialogComponent {
  @ViewChild(MatStepper) stepper: MatStepper;
  promptForm: FormGroup<{
    prompt: FormControl<string>;
    reference: FormControl<string>;
  }>;
  receivedCode$: BehaviorSubject<string> = new BehaviorSubject<string>('');
  loading$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  promptOperation$?: Observable<void>;
  receivedInputs: {
    key: string;
    value: unknown;
  }[] = [];
  receivedPackages: string[] = [];
  prisimFix = false;

  constructor(
    private highlightService: HighlightService,
    private formBuilder: FormBuilder,
    private requestWriterService: RequestWriterService
  ) {
    this.promptForm = this.formBuilder.group({
      prompt: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required],
      }),
      reference: new FormControl('', {
        nonNullable: true,
      }),
    });
  }

  prompt(reprompt = false) {
    if (this.promptForm.valid && !this.loading$.value) {
      this.loading$.next(true);
      this.promptForm.disable();
      const prompt: string = this.promptForm.controls.prompt.value;
      const reference: string = this.promptForm.controls.reference.value;
      this.promptOperation$ = this.requestWriterService
        .prompt({
          prompt,
          reference,
        })
        .pipe(
          tap((response: any) => {
            this.promptForm.enable();
            this.promptForm.controls.prompt.removeValidators(
              Validators.required
            );
            this.promptForm.controls.prompt.setValue('');
            this.promptForm.controls.reference.setValue('');
            try {
              const result: {
                code: string;
                inputs: {
                  key: string;
                  value: unknown;
                }[];
                packages: string[];
              } = JSON.parse(response.result);
              console.log(result, 'Res');
              this.receivedCode$.next(
                result.code.replace(/\*\*\*NEW_LINE\*\*\*/g, '\n')
              );
              this.receivedInputs = result.inputs;
              this.receivedPackages = result.packages;
              if (this.stepper.selected) {
                this.stepper.selected.completed = true;
                this.stepper.next();
              }
              this.prisimFix = !this.prisimFix;
              this.highlightPrism();
              console.log(result, 'Res');
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

  private highlightPrism() {
    setTimeout(() => {
      this.highlightService.highlightAll();
    }, 10);
  }
}
