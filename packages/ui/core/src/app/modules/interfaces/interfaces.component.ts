import { Property } from '@activepieces/pieces-framework';
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
import { ActivatedRoute } from '@angular/router';
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
import {
  InterfaceResult,
  InterfaceResultTypes,
  InterfacesService,
} from './interfaces.service';
import { MatSnackBar } from '@angular/material/snack-bar';

type Input = {
  displayName: string;
  required: boolean;
  description: string;
  type: InputTypes;
};

enum InputTypes {
  TEXT = 'text',
  FILE = 'file',
}

type InterfaceProps = {
  inputs: Input[];
  waitForResponse: boolean;
};

@Component({
  selector: 'app-interfaces',
  templateUrl: './interfaces.component.html',
})
export class InterfacesComponent implements OnInit {
  fullLogoUrl$: Observable<string>;
  flow$: Observable<FlowVersion>;
  submitInterface$: Observable<InterfaceResult | undefined>;
  interfaceForm: FormGroup;
  props: InterfaceProps | null = null;
  textInputs: Input[] = [];
  fileInputs: Input[] = [];
  loading = false;
  error: string | null = null;
  webhookUrl: string | null = null;
  title: string | null = null;
  flow: PopulatedFlow | null = null;
  markdownResponse: Subject<string | null> = new Subject<string | null>();
  constructor(
    private flowService: FlowService,
    private router: ActivatedRoute,
    private snackBar: MatSnackBar,
    private flagService: FlagService,
    private interfacesService: InterfacesService,
    private telemteryService: TelemetryService
  ) {
    this.fullLogoUrl$ = this.flagService
      .getLogos()
      .pipe(map((logos) => logos.fullLogoUrl));
  }

  ngOnInit(): void {
    this.flow$ = this.router.paramMap.pipe(
      switchMap((params) =>
        this.flowService.get(params.get('flowId') as string)
      ),
      tap((flow) => {
        this.title = flow.version.displayName;
        this.interfaceForm = new FormGroup({});
        this.props = flow.version.trigger.settings.input;
        this.telemteryService.capture({
          name: TelemetryEventName.INTERFACES_VIEWED,
          payload: {
            flowId: flow.id,
            interfaceProps: this.props!,
            projectId: flow.projectId,
          },
        });
        this.flow = flow;
      }),
      switchMap((flow) => {
        {
          if (flow.publishedVersionId)
            return this.flowService
              .get(flow.id, flow.publishedVersionId)
              .pipe(map((flow) => flow.version));
          return of(flow.version);
        }
      }),
      tap((version) => {
        const { pieceName, triggerName } = version.trigger.settings;
        if (
          pieceName === '@activepieces/piece-interfaces' &&
          triggerName === 'form_submission'
        ) {
          this.webhookUrl = environment.apiUrl + '/webhooks/' + version.id;

          if (this.props?.waitForResponse) {
            this.webhookUrl += '/sync';
          }
          const textInputs: Input[] = [];
          const fileInputs: Input[] = [];
          this.props?.inputs.forEach((input) => {
            switch (input.type) {
              case InputTypes.TEXT:
                textInputs.push(input);
                break;
              case InputTypes.FILE:
                fileInputs.push(input);
                break;
            }
          });
          if (textInputs.length > 0) {
            this.buildTextInputs(textInputs);
          }
          if (fileInputs.length > 0) {
            this.buildFileInputs(fileInputs);
          }
        } else {
          this.props = null;
          this.error = 'This flow does not have an interface.';
        }
      })
    );
  }

  async submit() {
    if (this.interfaceForm.valid && !this.loading) {
      this.markdownResponse.next(null);
      this.loading = true;

      const observables: Observable<string>[] = [];

      for (const key in this.interfaceForm.value) {
        const isFileInput = this.fileInputs.find(
          (input) => this.getInputKey(input.displayName) === key
        );

        if (isFileInput && this.interfaceForm.value[key]) {
          observables.push(this.toBase64(this.interfaceForm.value[key]));
        } else {
          observables.push(of(this.interfaceForm.value[key]));
        }
      }

      this.submitInterface$ = forkJoin(observables).pipe(
        map((values) => {
          const formData = new FormData();
          for (let i = 0; i < values.length; i++) {
            const key = Object.keys(this.interfaceForm.value)[i];
            formData.append(key, values[i]);
          }
          return formData;
        }),
        switchMap((formData) =>
          this.interfacesService.submitInterface(this.webhookUrl!, formData)
        ),
        tap((result: InterfaceResult) => {
          this.telemteryService.capture({
            name: TelemetryEventName.INTERFACES_SUBMITTED,
            payload: {
              flowId: this.flow!.id,
              interfaceProps: this.props!,
              projectId: this.flow!.projectId,
            },
          });
          if (result.type === InterfaceResultTypes.MARKDOWN) {
            this.markdownResponse.next(result.value as string);
          } else if (result.type === InterfaceResultTypes.FILE) {
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

  buildTextInputs(inputs: Input[]) {
    inputs.forEach((prop) => {
      this.textInputs.push(Property.ShortText(prop) as unknown as Input);
      this.interfaceForm.addControl(
        this.getInputKey(prop.displayName),
        new FormControl('', {
          nonNullable: prop.required,
          validators: prop.required ? [Validators.required] : [],
        })
      );
    });
  }

  buildFileInputs(inputs: Input[]) {
    inputs.forEach((prop) => {
      this.fileInputs.push(Property.File(prop) as unknown as Input);
      this.interfaceForm.addControl(
        this.getInputKey(prop.displayName),
        new FormControl('', {
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
