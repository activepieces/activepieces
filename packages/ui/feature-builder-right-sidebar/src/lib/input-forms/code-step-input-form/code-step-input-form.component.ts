import { Component, Input } from '@angular/core';
import {
  FormGroup,
  FormBuilder,
  FormControl,
  UntypedFormGroup,
} from '@angular/forms';
import { Observable, Subject, of, takeUntil, tap } from 'rxjs';
import {
  ActionErrorHandlingOptions,
  ActionType,
  ApFlagId,
  CodeAction,
  CodeActionSettings,
  SourceCode,
  UpdateActionRequest,
} from '@activepieces/shared';
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
import {
  BuilderSelectors,
  FlowsActions,
} from '@activepieces/ui/feature-builder-store';

@Component({
  selector: 'app-code-step-input-form',
  templateUrl: './code-step-input-form.component.html',
})
export class CodeStepInputFormComponent extends InputFormCore {
  _step!: CodeAction;
  @Input({ required: true }) set step(value: CodeAction) {
    this._step = value;
    this.writeValue(value);
  }
  @Input({ required: true }) stepSettings: CodeActionSettings;
  readOnly$: Observable<boolean> = of(true);
  form: FormGroup<{
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
  /**This is used because Monaco emits changes even if they are silent, like when you are setting the value because a new code step has been selected */
  stepChanged$ = new Subject<true>();
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
    this.readOnly$ = this.store.select(BuilderSelectors.selectReadOnly).pipe(
      tap((val) => {
        val
          ? this.form.disable({ emitEvent: false })
          : this.form.enable({ emitEvent: false });
      })
    );
    this.form = this.formBuilder.group({
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
    this.formValueChanged$ = this.createListener$();
  }

  private createListener$() {
    return this.form.valueChanges.pipe(
      takeUntil(this.stepChanged$),
      tap((formValue) => {
        const codeActionSettings: UpdateActionRequest = {
          settings: {
            ...this.stepSettings,
            input: this.form.value.input || {},
            sourceCode: formValue.sourceCode!,
            errorHandlingOptions: formValue.errorHandlingOptions ?? {
              continueOnFailure: {
                value: false,
              },
              retryOnFailure: {
                value: false,
              },
            },
          },
          type: ActionType.CODE,
          displayName: this._step.displayName,
          name: this._step.name,
          valid: true,
        };
        this.store.dispatch(
          FlowsActions.updateAction({ operation: codeActionSettings })
        );
      })
    );
  }
  private writeValue(value: CodeAction) {
    this.stepChanged$.next(true);

    (this.form as UntypedFormGroup).removeControl('sourceCode', {
      emitEvent: false,
    });
    this.form.addControl(
      'sourceCode',
      new FormControl(
        {
          code: value.settings.sourceCode.code,
          packageJson: value.settings.sourceCode.packageJson,
        },
        { nonNullable: true }
      ),
      { emitEvent: false }
    );
    this.form.controls.input.setValue(value.settings.input, {
      emitEvent: false,
    });
    if (value.settings.errorHandlingOptions) {
      this.form.controls.errorHandlingOptions.setValue(
        value.settings.errorHandlingOptions,
        {
          emitEvent: false,
        }
      );
    }
    setTimeout(() => {
      this.formValueChanged$ = this.createListener$();
    });
  }

  openCodeWriterDialog() {
    const dialogRef = this.dialogService.open(CodeWriterDialogComponent, {
      data: {
        existingCode: this.form.controls.sourceCode.value.code,
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
            let packageJson = this.form.value.sourceCode!.packageJson;
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
            this.form.controls.sourceCode.setValue({
              code: result.code as string,
              packageJson,
            });
            const inputs: Record<string, unknown> = {};
            result.inputs.forEach((input) => {
              inputs[input.key] =
                this.form.controls.input.value[input.key] ?? input.value;
            });
            this.form.controls.input.setValue(inputs);
          }
        }
      )
    );
  }
}
