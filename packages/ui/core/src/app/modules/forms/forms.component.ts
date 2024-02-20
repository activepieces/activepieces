import { Property, PropertyType } from '@activepieces/pieces-framework';
import {
  FileResponseInterface,
  FlowVersion,
  PopulatedFlow,
  TelemetryEventName,
} from '@activepieces/shared';
import {
  FlagService,
  FlowService,
  TelemetryService,
  environment,
} from '@activepieces/ui/common';
import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  Observable,
  Observer,
  Subject,
  catchError,
  forkJoin,
  map,
  of,
  switchMap,
  tap,
} from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FormResult, FormResultTypes, FormsService } from './forms.service';

type Input = {
  displayName: string;
  required: boolean;
  description: string;
  type: InputTypes;
};

enum InputTypes {
  TEXT = 'text',
  FILE = 'file',
  TEXT_AREA = 'text_area',
  TOGGLE = 'toggle',
}

type FormProps = {
  inputs: Input[];
  waitForResponse: boolean;
};

@Component({
  selector: 'app-forms',
  templateUrl: './forms.component.html',
})
export class FormsComponent implements OnInit {
  fullLogoUrl$: Observable<string>;
  flow$: Observable<FlowVersion>;
  submitForm$: Observable<FormResult | undefined>;
  form: FormGroup;
  props: FormProps | null = null;
  textInputs: Input[] = [];
  fileInputs: Input[] = [];
  inputs: Input[] = [];
  loading = false;
  error: string | null = null;
  webhookUrl: string | null = null;
  title: string | null = null;
  flow: PopulatedFlow | null = null;
  markdownResponse: Subject<string | null> = new Subject<string | null>();
  PropertyType = PropertyType;
  constructor(
    private flowService: FlowService,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar,
    private flagService: FlagService,
    private formsService: FormsService,
    private telemteryService: TelemetryService,
    private router: Router
  ) {
    this.fullLogoUrl$ = this.flagService
      .getLogos()
      .pipe(map((logos) => logos.fullLogoUrl));
  }

  ngOnInit(): void {
    this.flow$ = this.route.paramMap.pipe(
      switchMap((params) =>
        this.flowService.get(params.get('flowId') as string)
      ),
      tap((flow) => {
        this.title = flow.version.displayName;
        this.form = new FormGroup({});

        this.telemteryService.capture({
          name: TelemetryEventName.FORMS_VIEWED,
          payload: {
            flowId: flow.id,
            formProps: this.props!,
            projectId: flow.projectId,
          },
        });
        this.flow = flow;
      }),
      switchMap((flow) => {
        {
          return of(flow.version);
        }
      }),
      tap((version) => {
        this.props = version.trigger.settings.input;
        const { triggerName } = version.trigger.settings;
        if (this.doesFlowHaveForm(version)) {
          this.webhookUrl = environment.apiUrl + '/webhooks/' + this.flow!.id;
          if (this.props?.waitForResponse) {
            this.webhookUrl += '/sync';
          }

          switch (triggerName) {
            case 'form_submission':
              this.buildInputs(this.props!.inputs);
              break;
            case 'file_submission':
              this.buildInputs([
                {
                  displayName: 'File',
                  description: 'File to submit.',
                  required: true,
                  type: InputTypes.FILE,
                },
              ]);
              break;
          }
        } else {
          this.props = null;
          this.error = 'This flow does not have a form.';
        }
      }),
      catchError((err) => {
        console.error(err);
        this.router.navigate(['/']);
        throw err;
      })
    );
  }

  doesFlowHaveForm(version: FlowVersion) {
    const { pieceName, triggerName } = version.trigger.settings;
    const validTriggerNames = ['form_submission', 'file_submission'];

    return pieceName === '@activepieces/piece-forms' && validTriggerNames.includes(triggerName);
  }

  async submit() {
    if (this.form.valid && !this.loading) {
      this.markdownResponse.next(null);
      this.loading = true;

      const observables: Observable<string>[] = [];

      for (const key in this.form.value) {
        const isFileInput = this.fileInputs.find(
          (input) => this.getInputKey(input.displayName) === key
        );

        if (isFileInput && this.form.value[key]) {
          observables.push(this.toBase64(this.form.value[key]));
        } else {
          observables.push(of(this.form.value[key]));
        }
      }

      this.submitForm$ = forkJoin(observables).pipe(
        map((values) => {
          const formData = new FormData();
          for (let i = 0; i < values.length; i++) {
            const key = Object.keys(this.form.value)[i];
            formData.append(key, values[i]);
          }
          return formData;
        }),
        switchMap((formData) =>
          this.formsService.submitForm(this.webhookUrl!, formData)
        ),
        tap((result: FormResult) => {
          this.telemteryService.capture({
            name: TelemetryEventName.FORMS_SUBMITTED,
            payload: {
              flowId: this.flow!.id,
              formProps: this.props!,
              projectId: this.flow!.projectId,
            },
          });
          if (result.type === FormResultTypes.MARKDOWN) {
            this.markdownResponse.next(result.value as string);
          } else if (result.type === FormResultTypes.FILE) {
            const link = document.createElement('a');
            // Your base64 string
            const fileBase = result.value as FileResponseInterface;
            link.download = fileBase.fileName;
            link.href = fileBase.base64Url;
            link.target = '_blank';
            link.click();
            // Clean up by revoking the object URL
            URL.revokeObjectURL(fileBase.base64Url);
          } else {
            this.snackBar.open(
              `Your submission was successfully received.`,
              '',
              {
                duration: 5000,
              }
            );
          }
          this.loading = false;
        }),
        catchError((error) => {
          if (error.status === 404) {
            this.snackBar.open(`Flow not found. Please publish the flow.`, '', {
              panelClass: 'error',
              duration: 5000,
            });
          } else {
            this.snackBar.open(`Flow failed to execute`, '', {
              panelClass: 'error',
              duration: 5000,
            });
          }
          this.loading = false;
          return of(void 0);
        })
      );
    }
  }

  getInputKey(str: string) {
    return str
      .replace(/\s(.)/g, function ($1) {
        return $1.toUpperCase();
      })
      .replace(/\s/g, '')
      .replace(/^(.)/, function ($1) {
        return $1.toLowerCase();
      });
  }

  buildInputs(inputs: Input[]) {
    inputs.forEach((prop) => {
      switch (prop.type) {
        case InputTypes.TEXT:
          this.inputs.push(Property.ShortText(prop) as unknown as Input);
          break;
        case InputTypes.FILE:
          this.inputs.push(Property.File(prop) as unknown as Input);
          break;
        case InputTypes.TEXT_AREA:
          this.inputs.push(Property.LongText(prop) as unknown as Input);
          break;
        case InputTypes.TOGGLE:
          this.inputs.push(Property.Checkbox(prop) as unknown as Input);
          break;
      }

      this.form.addControl(
        this.getInputKey(prop.displayName),
        new FormControl('', {
          nonNullable: prop.required,
          validators: prop.required ? [Validators.required] : [],
        })
      );
    });
  }

  toBase64(file: File): Observable<string> {
    return new Observable((observer: Observer<string>) => {
      const reader = new FileReader();

      reader.readAsDataURL(file);

      reader.onload = () => {
        observer.next(reader.result as string);
        observer.complete();
      };

      reader.onerror = (error) => {
        observer.error(error);
      };
    });
  }
}
