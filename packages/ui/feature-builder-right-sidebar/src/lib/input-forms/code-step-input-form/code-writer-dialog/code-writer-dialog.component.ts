import { ApEdition } from '@activepieces/shared';
import { FlagService } from '@activepieces/ui/common';
import { CodeService } from '@activepieces/ui/feature-builder-store';
import {
  ChangeDetectionStrategy,
  Component,
  Inject,
  ViewChild,
} from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatStepper } from '@angular/material/stepper';
import { BehaviorSubject, Observable, map, tap } from 'rxjs';
import { CodeWriterService } from './code-writer.service';
export interface CodeWriterDialogData {
  existingCode: string;
}
@Component({
  selector: 'app-code-writer-dialog',
  templateUrl: './code-writer-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CodeWriterDialogComponent {
  @ViewChild(MatStepper) stepper: MatStepper;
  promptForm: FormGroup<{
    prompt: FormControl<string>;
    passExistingCode: FormControl<boolean>;
  }>;
  promptOperation$?: Observable<void>;
  receivedCode$: BehaviorSubject<string> = new BehaviorSubject<string>('');
  receivedInputs: {
    key: string;
    value: unknown;
  }[] = [];
  receivedPackages: string[] = [];
  packageVersions: { [key: string]: string }[] = [];
  loading$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  betaNote = $localize`<b> Note: </b> This feature uses OpenAi's API to generate code, it will be available for free during the beta period.`;
  isCloudEdition$: Observable<boolean>;
  /**Prism refuses to render new text within it so you have to destroy the element and build it again, this flag will do that */
  prisimFix = false;
  npmPackage$: Observable<{ [key: string]: string } | null>;
  constructor(
    private formBuilder: FormBuilder,
    private dialogRef: MatDialogRef<CodeWriterDialogComponent>,
    private codeWriterService: CodeWriterService,
    private flagService: FlagService,
    @Inject(MAT_DIALOG_DATA)
    public data: CodeWriterDialogData,
    private codeService: CodeService
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
    this.isCloudEdition$ = this.flagService
      .getEdition()
      .pipe(map((edition) => edition === ApEdition.CLOUD));
  }

  prompt(reprompt = false) {
    if (this.promptForm.valid && !this.loading$.value) {
      this.loading$.next(true);
      this.promptForm.disable();
      let prompt: string = this.promptForm.controls.prompt.value;
      if (this.promptForm.controls.passExistingCode.value || reprompt) {
        prompt = this.data.existingCode + '\n' + prompt;
      }
      this.promptOperation$ = this.codeWriterService
        .prompt({
          prompt,
          previousContext: [],
        })
        .pipe(map(() => void 0));
    }
  }

  reset() {
    this.receivedCode$.next('');
    this.receivedInputs = [];
    this.promptForm.reset();
  }

  lookForNpmPackage(packageName: string) {
    this.npmPackage$ = this.codeService
      .getLatestVersionOfNpmPackage(packageName)
      .pipe(
        tap((pkg) => {
          if (pkg) {
            this.packageVersions.push(pkg);
          }
        })
      );
  }

  useCode() {
    this.dialogRef.close({
      code: this.receivedCode$.value,
      inputs: this.receivedInputs,
      packages: this.packageVersions,
    });
    this.reset();
  }
}
