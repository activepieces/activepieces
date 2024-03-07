import {
  FileResponseInterface,
  FormInput,
  FormInputType,
  FormResponse,
  TelemetryEventName,
} from '@activepieces/shared';
import { TelemetryService, environment } from '@activepieces/ui/common';
import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Data, ParamMap, Router } from '@angular/router';
import {
  Observable,
  Observer,
  Subject,
  catchError,
  combineLatest,
  forkJoin,
  map,
  of,
  switchMap,
  tap,
} from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FormResult, FormResultTypes, FormsService } from './forms.service';
import { StatusCodes } from 'http-status-codes';

@Component({
  selector: 'app-forms',
  templateUrl: './forms.component.html',
})
export class FormsComponent implements OnInit {
  formStructure$: Observable<FormResponse>;
  submitForm$: Observable<FormResult | undefined>;
  formGroup: FormGroup;
  inputs: FormInput[] = [];
  loading = false;
  error: string | null = null;
  webhookUrl: string | null = null;
  webhookUrl$: Observable<Data | null>;
  title: string | null = null;
  populatedForm: FormResponse | null = null;
  markdownResponse: Subject<string | null> = new Subject<string | null>();
  FormInputType = FormInputType;
  routeData$: Observable<Data>;
  routeParamMap: ParamMap;

  constructor(
    private route: ActivatedRoute,
    private snackBar: MatSnackBar,
    private formsService: FormsService,
    private telemteryService: TelemetryService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.initializeForm();
  }

  initializeForm() {
    this.formStructure$ = combineLatest([
      this.route.data,
      this.route.paramMap,
    ]).pipe(
      switchMap(([data, params]) => {
        this.routeParamMap = params;
        if (data['approval']) {
          return this.formsService.getApprovalForm(
            params.get('flowId') as string
          );
        } else {
          return this.formsService.get(params.get('flowId') as string);
        }
      }),
      tap((form) => {
        this.telemteryService.capture({
          name: TelemetryEventName.FORMS_VIEWED,
          payload: {
            flowId: form.id,
            formProps: form.props,
            projectId: form.projectId,
          },
        });
        this.title = form.title;
        this.formGroup = new FormGroup({});
        this.buildInputs(form.props.inputs);
        this.populatedForm = form;
        this.buildWebhookUrl();
      }),
      catchError((err) => {
        console.error(err);
        this.router.navigate(['/404']);
        throw err;
      })
    );
  }

  async submit() {
    this.routeData$ = this.route.data.pipe(
      tap((data) => {
        if (data['approval']) {
          this.submitApproval();
        } else {
          this.submitForm();
        }
      })
    );
  }

  async submitForm() {
    if (this.formGroup.valid && !this.loading) {
      this.markdownResponse.next(null);
      this.loading = true;

      const observables: Observable<string>[] = [];

      for (const key in this.formGroup.value) {
        const isFileInput = this.inputs
          .filter((f) => f.type === FormInputType.FILE)
          .find((input) => this.getInputKey(input.displayName) === key);

        if (isFileInput && this.formGroup.value[key]) {
          observables.push(this.toBase64(this.formGroup.value[key]));
        } else {
          observables.push(of(this.formGroup.value[key]));
        }
      }

      this.submitForm$ = forkJoin(observables).pipe(
        map((values) => {
          const formData = new FormData();
          for (let i = 0; i < values.length; i++) {
            const key = Object.keys(this.formGroup.value)[i];
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
              flowId: this.populatedForm!.id,
              formProps: this.populatedForm!.props,
              projectId: this.populatedForm!.projectId,
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
          if (error.status === StatusCodes.NOT_FOUND) {
            this.snackBar.open(
              `Flow is not found, please publish the flow`,
              '',
              {
                panelClass: 'error',
                duration: 5000,
              }
            );
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

  async submitApproval() {
    if (this.formGroup.valid && !this.loading) {
      this.markdownResponse.next(null);
      this.loading = true;
      const isApproved = this.formGroup.controls['approval'].value;

      this.submitForm$ = this.formsService
        .submitApprovalForm(this.webhookUrl!, isApproved)
        .pipe(
          tap(() => {
            this.formGroup.disable();
            this.snackBar.open(
              `Flow run ${
                isApproved ? 'approved' : 'disapproved'
              } successfully.`,
              '',
              {
                duration: 5000,
              }
            );
            this.loading = false;
          }),
          catchError((error) => {
            if (error.status === StatusCodes.NOT_FOUND) {
              this.snackBar.open(
                `Flow is not found, please publish the flow`,
                '',
                {
                  panelClass: 'error',
                  duration: 5000,
                }
              );
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

  buildInputs(inputs: FormInput[]) {
    inputs.forEach((prop) => {
      let defaultValue: string | boolean = '';
      if (prop.type === FormInputType.TOGGLE) {
        defaultValue = false;
      }
      this.formGroup.addControl(
        this.getInputKey(prop.displayName),
        new FormControl(defaultValue, {
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

  buildWebhookUrl() {
    this.webhookUrl$ = this.route.data.pipe(
      tap((data) => {
        if (data['approval']) {
          this.webhookUrl = `${
            environment.apiUrl
          }/flow-runs/${this.routeParamMap.get(
            'flowRunId'
          )}/requests/${this.routeParamMap.get('requestId')}`;
        } else {
          this.webhookUrl = `${environment.apiUrl}/webhooks/${
            this.populatedForm!.id
          }${this.populatedForm!.props.waitForResponse ? '/sync' : ''}`;
        }
      })
    );
  }
}
