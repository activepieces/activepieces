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
import { CodeWriterService } from './code-writer.service';
import { FlagService, HighlightService } from '@activepieces/ui/common';
import { ApEdition } from '@activepieces/shared';
import { MatStepper } from '@angular/material/stepper';
import { CodeService } from '@activepieces/ui/feature-builder-store';
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
    private highlightService: HighlightService,
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
        })
        .pipe(
          tap((response) => {
            this.promptForm.enable();
            this.promptForm.controls.prompt.removeValidators(
              Validators.required
            );
            this.promptForm.controls.prompt.setValue('');
            try {
              const result: {
                code: string;
                inputs: {
                  key: string;
                  value: unknown;
                }[];
                packages: string[];
              } = JSON.parse(response.result);
              this.receivedCode$.next(
                result.code.replace(/\*\*\*NEW_LINE\*\*\*/g, '\n')
              );
              this.receivedInputs = result.inputs;
              this.receivedPackages = result.packages;
              this.receivedPackages.forEach((pkg) => {
                this.lookForNpmPackage(pkg);
              });
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
  private highlightPrism() {
    setTimeout(() => {
      this.highlightService.highlightAll();
    }, 10);
  }
}
