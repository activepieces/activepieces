import { Property } from '@activepieces/pieces-framework';
import { PopulatedFlow } from '@activepieces/shared';
import { FlagService, FlowService, environment } from '@activepieces/ui/common';
import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Observable, Observer, forkJoin, map, of, switchMap, tap } from 'rxjs';
import { InterfacesService } from './interfaces.service';

type Input = {
  displayName: string;
  required: boolean;
  description: string;
  placeholder: string;
};

type InterfaceProps = {
  textInputs: Input[];
  fileInputs: Input[];
  waitForResponse: boolean;
};

@Component({
  selector: 'app-interfaces',
  templateUrl: './interfaces.component.html',
  styleUrls: ['./interfaces.component.scss'],
})
export class InterfacesComponent implements OnInit {
  fullLogoUrl$: Observable<string>;
  flow$: Observable<PopulatedFlow>;
  submitInterface$: Observable<any>;
  interfaceForm: FormGroup;
  props: InterfaceProps | null = null;
  textInputs: Input[] = [];
  fileInputs: Input[] = [];
  loading = false;
  error: string | null = null;
  webhookUrl: string | null = null;
  title: string | null = null;
  markdownResponse: string | null = null;
  constructor(
    private flowService: FlowService,
    private router: ActivatedRoute,
    private flagService: FlagService,
    private interfacesService: InterfacesService
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
        if (flow.version.trigger.settings.triggerName === 'interface_trigger') {
          this.webhookUrl = environment.apiUrl + '/webhooks/' + flow.id;
          this.title = flow.version.displayName;
          this.interfaceForm = new FormGroup({});
          this.props = flow.version.trigger.settings.input;
          if (this.props?.waitForResponse) {
            this.webhookUrl += '/sync';
          }
          if (this.props?.textInputs) {
            this.buildTextInputs(this.props.textInputs);
          }
          if (this.props?.fileInputs) {
            this.buildFileInputs(this.props.fileInputs);
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
        tap((result: { type: 'markdown' | 'file'; value: unknown }) => {
          if (result.type === 'markdown') {
            this.markdownResponse = result.value as string;
          } else if (result.type === 'file') {
            // Your base64 string
            const base64String = result.value as string;
            // Splitting the base64 string to extract MIME type
            const mimeType = base64String.match(
              /data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+).*,.*/
            );
            let extension = '';
            if (mimeType) {
              extension = this.mimeToExtension(mimeType[1]);
            }
            const base64Data = base64String.split(',')[1];
            const byteCharacters = atob(base64Data);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
              byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            const blob = new Blob([byteArray]);
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${this.title}.${extension}`; // Set your desired file name here
            link.click();
            // Clean up by revoking the object URL
            URL.revokeObjectURL(url);
          }
          this.loading = false;
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

  mimeToExtension(mimeType) {
    const mapping = {
      // Images
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/gif': 'gif',
      'image/webp': 'webp',
      'image/tiff': 'tiff',
      'image/svg+xml': 'svg',
      // Audio
      'audio/mpeg': 'mp3',
      'audio/ogg': 'ogg',
      'audio/wav': 'wav',
      'audio/webm': 'webm',
      'audio/aac': 'aac',
      'audio/flac': 'flac',
      // Video
      'video/mp4': 'mp4',
      'video/ogg': 'ogv',
      'video/webm': 'webm',
      'video/avi': 'avi',
      'video/mpeg': 'mpeg',
      'video/quicktime': 'mov',
      // Documents
      'application/pdf': 'pdf',
      'application/msword': 'doc',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        'docx',
      'application/vnd.ms-excel': 'xls',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
        'xlsx',
      'application/vnd.ms-powerpoint': 'ppt',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation':
        'pptx',
      'text/plain': 'txt',
      'text/html': 'html',
      'text/css': 'css',
      'text/javascript': 'js',
      'application/json': 'json',
      'application/xml': 'xml',
      // Archives
      'application/zip': 'zip',
      'application/x-rar-compressed': 'rar',
      'application/x-7z-compressed': '7z',
      'application/x-tar': 'tar',
      // Others
      'application/octet-stream': 'bin', // Generic binary type
      // Add other specific MIME types and mappings as needed
    };
    return mapping[mimeType] || '';
  }
}
