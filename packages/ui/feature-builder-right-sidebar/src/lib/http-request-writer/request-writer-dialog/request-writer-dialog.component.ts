import { HighlightService, UiCommonModule } from '@activepieces/ui/common';
import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Output,
  ViewChild,
} from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
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
  @Output() codeGenerated = new EventEmitter<string>();
  promptForm: FormGroup<{
    prompt: FormControl<string>;
    reference: FormControl<string>;
  }>;
  receivedCode$: BehaviorSubject<string> = new BehaviorSubject<string>('');
  loading$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  promptOperation$?: Observable<void>;
  prisimFix = false;

  constructor(
    private highlightService: HighlightService,
    private formBuilder: FormBuilder,
    private requestWriterService: RequestWriterService,
    private dialogRef: MatDialogRef<RequestWriterDialogComponent> // Inject MatDialogRef
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
      // const reference: string = this.promptForm.controls.reference.value;

      this.promptOperation$ = this.requestWriterService
        .fetchApiDetails({
          prompt,
        })
        .pipe(
          tap((response) => {
            this.promptForm.enable();
            this.promptForm.controls.prompt.removeValidators(
              Validators.required
            );
            this.promptForm.controls.prompt.setValue('');
            // this.promptForm.controls.reference.setValue('');
            try {
              const result = response.result;
              this.receivedCode$.next(result);
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

  useGeneratedCode() {
    this.dialogRef.close(this.receivedCode$.value);
  }

  private highlightPrism() {
    setTimeout(() => {
      this.highlightService.highlightAll();
    }, 10);
  }
}
