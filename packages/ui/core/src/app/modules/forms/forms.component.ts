import {
  FileResponseInterface,
  FormInput,
  FormInputType,
  FormResponse,
  TelemetryEventName,
  USE_DRAFT_QUERY_PARAM_NAME,
} from '@activepieces/shared';
import { TelemetryService, environment } from '@activepieces/ui/common';
import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import {
  Observable,
  Observer,
  Subject,
  catchError,
  forkJoin,
  isNil,
  of,
  switchMap,
  tap,
} from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FormResult, FormResultTypes, FormsService } from './forms.service';
import { StatusCodes } from 'http-status-codes';
import { getInputKey } from './input-form-control.pipe';
import { FORMS_RESOLVE_DATA } from './forms.resolver';

@Component({
  selector: 'app-forms',
  templateUrl: './forms.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormsComponent implements OnInit {
  submitForm$: Observable<FormResult | null>;
  form: FormGroup;
  loading = false;
  error: string | null = null;
  webhookUrl: string | null = null;
  flowForm: FormResponse | null = null;
  markdownResponse: Subject<string | null> = new Subject<string | null>();
  FormInputType = FormInputType;

  constructor(
    private route: ActivatedRoute,
    private snackBar: MatSnackBar,
    private formsService: FormsService,
    private telemteryService: TelemetryService
  ) {}

  ngOnInit(): void {
    this.flowForm = this.route.snapshot.data[FORMS_RESOLVE_DATA];
    this.form = new FormGroup({});
    if (this.flowForm) {
      const useDraftQueryParam =
        this.route.snapshot.queryParams[USE_DRAFT_QUERY_PARAM_NAME];
      const useTestingEndpoint =
        !isNil(useDraftQueryParam) &&
        useDraftQueryParam.toLowerCase() === 'true';
      const routePostfix = useTestingEndpoint
        ? '/test'
        : this.flowForm.props.waitForResponse
        ? '/sync'
        : '';
      this.buildInputs(this.flowForm.props.inputs);
      this.webhookUrl =
        environment.apiUrl + '/webhooks/' + this.flowForm.id + routePostfix;
    }
  }

  async submit() {
    this.form.markAllAsTouched();
    if (this.form.valid && !this.loading) {
      this.markdownResponse.next(null);
      this.loading = true;
      const observables = this.createFormValueObservables();
      this.submitForm$ = forkJoin(observables).pipe(
        switchMap((formData) =>
          this.formsService.submitForm(this.webhookUrl!, formData)
        ),
        tap((result: FormResult | null) => {
          this.telemteryService.capture({
            name: TelemetryEventName.FORMS_SUBMITTED,
            payload: {
              flowId: this.flowForm!.id,
              formProps: this.flowForm!.props,
              projectId: this.flowForm!.projectId,
            },
          });
          if (result && Object.keys(result).length > 0) {
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
            }
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
          console.error(error);
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
          return of(null);
        })
      );
    }
  }

  buildInputs(inputs: FormInput[]) {
    inputs.forEach((prop) => {
      const controlDefaultValue = this.getDefaultControlValue(prop);
      this.form.addControl(
        getInputKey(prop.displayName),
        new FormControl(controlDefaultValue, {
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
  private getDefaultControlValue(prop: FormInput) {
    switch (prop.type) {
      case FormInputType.TOGGLE:
        return false;
      case FormInputType.FILE:
        return null;
      case FormInputType.TEXT:
      case FormInputType.TEXT_AREA:
        return '';
    }
  }
  private createFormValueObservables() {
    const keys = Object.keys(this.form.value);
    return keys.reduce((acc, key) => {
      const isFileInput = this.flowForm!.props.inputs.filter(
        (f) => f.type === FormInputType.FILE
      ).find((input) => getInputKey(input.displayName) === key);
      return {
        ...acc,
        [key]:
          isFileInput && this.form.value[key]
            ? this.toBase64(this.form.value[key])
            : of(this.form.value[key]),
      };
    }, {} as { [key: string]: Observable<string | boolean> });
  }
}
