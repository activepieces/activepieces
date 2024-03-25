import { Component } from '@angular/core';
import {
  ControlValueAccessor,
  NG_VALUE_ACCESSOR,
  FormGroup,
  FormBuilder,
  FormControl,
} from '@angular/forms';
import { Observable, tap } from 'rxjs';
import {
  ActionErrorHandlingOptions,
  ActionType,
  ApFlagId,
  SourceCode,
} from '@activepieces/shared';
import { CodeStepInputFormSchema } from '../input-forms-schema';
import { MatDialog } from '@angular/material/dialog';
import { CodeWriterDialogComponent } from './code-writer-dialog/code-writer-dialog.component';
import {
  FlagService,
  codeGeneratorTooltip,
  disabledCodeGeneratorTooltip,
} from '@activepieces/ui/common';
import { InputFormCore } from '../input-form-core';
import { Store } from '@ngrx/store';
import { PieceMetadataService } from '@activepieces/ui/feature-pieces';

@Component({
  selector: 'app-code-step-input-form',
  templateUrl: './code-step-input-form.component.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      multi: true,
      useExisting: CodeStepInputFormComponent,
    },
  ],
})
export class CodeStepInputFormComponent
  extends InputFormCore
  implements ControlValueAccessor
{
  codeStepForm: FormGroup<{
    input: FormControl<Record<string, unknown>>;
    sourceCode: FormControl<SourceCode>;
    errorHandlingOptions: FormControl<ActionErrorHandlingOptions>;
  }>;
  formValueChanged$: Observable<unknown>;
  dialogClosed$?: Observable<unknown>;
  generateCodeEnabled$: Observable<boolean>;
  showGenerateCode$: Observable<boolean>;
  codeGeneratorTooltip = codeGeneratorTooltip;
  disabledCodeGeneratorTooltip = disabledCodeGeneratorTooltip;
  markdown = `
  To use data from previous steps in your code, include them as pairs of keys and values below.
  <br>
  <br>
  You can access these inputs in your code using **inputs.key**, where **key** is the name you assigned below.
  <br>
  <br>
  **Warning: "const code" is the entry to the code, if it is removed or renamed, your step will fail.**
  `;

  onChange: (val: CodeStepInputFormSchema) => void = (
    value: CodeStepInputFormSchema
  ) => {
    value;
  };
  onTouch: () => void = () => {
    //ignore
  };

  constructor(
    store: Store,
    pieceService: PieceMetadataService,
    private formBuilder: FormBuilder,
    private dialogService: MatDialog,
    private flagService: FlagService
  ) {
    super(store, pieceService);
    this.generateCodeEnabled$ = this.flagService.isFlagEnabled(
      ApFlagId.COPILOT_ENABLED
    );
    this.showGenerateCode$ = this.flagService.isFlagEnabled(
      ApFlagId.SHOW_COPILOT
    );

    this.codeStepForm = this.formBuilder.group({
      input: new FormControl({}, { nonNullable: true }),
      sourceCode: new FormControl(
        { code: '', packageJson: '' },
        { nonNullable: true }
      ),
      errorHandlingOptions: new FormControl<ActionErrorHandlingOptions>(
        {
          continueOnFailure: {
            value: false,
          },
          retryOnFailure: {
            value: false,
          },
        },
        { nonNullable: true }
      ),
    });
    this.formValueChanged$ = this.codeStepForm.valueChanges.pipe(
      tap((formValue) => {
        this.onChange({
          input: this.codeStepForm.value.input || {},
          sourceCode: formValue.sourceCode!,
          type: ActionType.CODE,
          errorHandlingOptions: formValue.errorHandlingOptions ?? {
            continueOnFailure: {
              value: false,
            },
            retryOnFailure: {
              value: false,
            },
          },
        });
      })
    );
  }

  writeValue(obj: CodeStepInputFormSchema): void {
    if (obj.type === ActionType.CODE) {
      this.codeStepForm.controls.sourceCode.setValue(obj.sourceCode, {
        emitEvent: false,
      });
      this.codeStepForm.controls.input.setValue(obj.input, {
        emitEvent: false,
      });
      this.codeStepForm.controls.errorHandlingOptions.setValue(
        obj.errorHandlingOptions,
        {
          emitEvent: false,
        }
      );
      if (this.codeStepForm.disabled) {
        this.codeStepForm.disable();
      }
    }
  }
  registerOnChange(fn: any): void {
    this.onChange = fn;
  }
  registerOnTouched(fn: any): void {
    this.onTouch = fn;
  }
  setDisabledState?(isDisabled: boolean): void {
    if (isDisabled) {
      this.codeStepForm.disable();
    } else if (this.codeStepForm.disabled) {
      this.codeStepForm.enable();
    }
  }

  openCodeWriterDialog() {
    const dialogRef = this.dialogService.open(CodeWriterDialogComponent, {
      data: {
        existingCode: this.codeStepForm.controls.sourceCode.value.code,
      },
    });

    this.dialogClosed$ = dialogRef.afterClosed().pipe(
      tap(
        (result: {
          code: string;
          inputs: { key: string; value: unknown }[];
          packages: { [key: string]: string }[];
        }) => {
          if (result) {
            let packageJson = this.codeStepForm.value.sourceCode!.packageJson;
            if (result.packages.length > 0) {
              try {
                const packageJsonObj = JSON.parse(packageJson);
                if (!packageJsonObj.dependencies) {
                  packageJsonObj.dependencies = {};
                }
                result.packages.forEach((pkg) => {
                  packageJsonObj.dependencies = {
                    ...packageJsonObj.dependencies,
                    ...pkg,
                  };
                });
                packageJson = JSON.stringify(packageJsonObj, null, 2);
              } catch (e) {
                console.error('Invalid package.json');
              }
            }
            this.codeStepForm.controls.sourceCode.setValue({
              code: result.code as string,
              packageJson,
            });
            const inputs: Record<string, unknown> = {};
            result.inputs.forEach((input) => {
              inputs[input.key] =
                this.codeStepForm.controls.input.value[input.key] ??
                input.value;
            });
            this.codeStepForm.controls.input.setValue(inputs);
          }
        }
      )
    );
  }
}
