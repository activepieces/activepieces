import { HighlightService, UiCommonModule } from '@activepieces/ui/common';
import { CodeService } from '@activepieces/ui/feature-builder-store';
import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
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
export class RequestWriterDialogComponent implements OnInit {
  @ViewChild(MatStepper) stepper: MatStepper;
  promptForm: FormGroup<{
    prompt: FormControl<string>;
    reference: FormControl<string>;
  }>;
  method$: any;
  url$: any;
  body$: any;
  generatedRequest$: BehaviorSubject<Record<string, unknown> | null> =
    new BehaviorSubject<Record<string, unknown> | null>(null);
  loading$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  promptOperation$?: Observable<void>;
  prisimFix = false;

  constructor(
    private highlightService: HighlightService,
    private formBuilder: FormBuilder,
    private requestWriterService: RequestWriterService,
    private dialogRef: MatDialogRef<RequestWriterDialogComponent>,
    private codeService: CodeService
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

  ngOnInit() {
    this.method$ = this.generatedRequest$.pipe(
      map((request) => request?.['method'] || '')
    );

    this.url$ = this.generatedRequest$.pipe(
      map((request) => request?.['url'] || '')
    );

    this.body$ = this.generatedRequest$.pipe(map((req) => req?.['body'] || ''));
  }

  prompt() {
    if (this.promptForm.valid && !this.loading$.value) {
      this.loading$.next(true);
      this.promptForm.disable();
      const prompt: string = this.promptForm.controls.prompt.value;
      this.promptOperation$ = this.requestWriterService
        .fetchApiDetails({
          prompt,
        })
        .pipe(
          tap((response) => {
            this.promptForm.enable();
            try {
              this.generatedRequest$.next(
                this.beautifyResponsePresentation(response.result)
              );
              if (this.stepper.selected) {
                this.stepper.selected.completed = true;
                this.stepper.next();
                this.promptForm.controls.prompt.setValue(
                  this.promptForm.controls.prompt.value
                );
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
    if (this.generatedRequest$.value) {
      this.dialogRef.close(
        this.parseResponseAndMatchItToHttpPieceProperties(
          this.generatedRequest$.value
        )
      );
    }
  }

  private highlightPrism() {
    setTimeout(() => {
      this.highlightService.highlightAll();
    }, 10);
  }
  tryParsingJson(string: string) {
    try {
      return JSON.parse(string);
    } catch (err) {
      console.error('Error parsing JSON string');
      console.error(err);
      return {};
    }
  }

  beautifyResponsePresentation(responseString: string) {
    const response = this.tryParsingJson(responseString);
    const beautifiedResponse: Record<string, unknown> = { ...response };
    for (const key in response) {
      if (key === 'queryParams' || key === 'headers' || key === 'body') {
        beautifiedResponse[key] = this.tryParsingJson(
          this.codeService.beautifyJson(this.tryParsingJson(response[key]))
        );
      }
    }
    return beautifiedResponse;
  }
  parseResponseAndMatchItToHttpPieceProperties(
    response: Record<string, unknown>
  ) {
    let correctedResponse = {
      ...response,
    };
    const queryParams = response['queryParams'];
    const headers = response['headers'];
    if (headers) {
      correctedResponse = {
        ...correctedResponse,
        headers,
      };
    }
    if (queryParams) {
      correctedResponse = {
        ...correctedResponse,
        queryParams,
      };
    }
    if (response['body']) {
      correctedResponse = {
        ...correctedResponse,
        body_type: 'json',
        body: {
          data: this.codeService.beautifyJson(response['body']),
        },
      };
    } else {
      correctedResponse = {
        ...correctedResponse,
        body_type: 'none',
      };
    }

    return correctedResponse;
  }
}
