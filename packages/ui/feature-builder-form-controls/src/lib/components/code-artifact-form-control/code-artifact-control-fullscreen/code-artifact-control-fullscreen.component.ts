import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Inject,
  OnInit,
} from '@angular/core';
import { FormControl, FormGroup, UntypedFormBuilder } from '@angular/forms';
import {
  MatDialog,
  MatDialogRef,
  MAT_DIALOG_DATA,
} from '@angular/material/dialog';
import { forkJoin, Observable, switchMap, take, tap } from 'rxjs';
import { CodeArtifactForm } from '../code-artifact-form-control.component';
import { SelectedFileInFullscreenCodeEditor } from '../selected-file-in-fullscreen-code-editor.enum';
import { AddNpmPackageModalComponent } from './add-npm-package-modal/add-npm-package-modal.component';
import { SelectedTabInFullscreenCodeEditor } from './selected-tab-in-fullscreen-code-editor.enum';
import {
  BuilderSelectors,
  CodeService,
} from '@activepieces/ui/feature-builder-store';
import {
  FlagService,
  TestStepService,
  codeGeneratorTooltip,
  disabledCodeGeneratorTooltip,
} from '@activepieces/ui/common';
import { Store } from '@ngrx/store';
import { ApFlagId, StepRunResponse } from '@activepieces/shared';
import { MatSnackBar } from '@angular/material/snack-bar';

type PackageName = string;
type PackageVersion = string;
interface PackagesMetadata {
  [key: PackageName]: PackageVersion;
}

export type CodeArtifactControlFullscreenData = {
  codeFilesForm: FormGroup;
  readOnly: boolean;
  openCodeWriterDialog$: EventEmitter<boolean>;
};

@Component({
  templateUrl: './code-artifact-control-fullscreen.component.html',
  styleUrls: ['./code-artifact-control-fullscreen.component.scss'],
})
export class CodeArtifactControlFullscreenComponent implements OnInit {
  codeFilesForm: FormGroup<CodeArtifactForm>;
  readOnly: boolean;
  selectedFile = SelectedFileInFullscreenCodeEditor.CONTENT;
  executeCodeTest$: Observable<StepRunResponse>;
  codeGeneratorTooltip = codeGeneratorTooltip;
  disabledCodeGeneratorTooltip = disabledCodeGeneratorTooltip;
  codeEditorOptions = {
    minimap: { enabled: false },
    theme: 'apTheme',
    language: 'typescript',
    readOnly: false,
    automaticLayout: true,
  };
  packageDotJsonOptions = {
    minimap: { enabled: false },
    theme: 'apTheme',
    language: 'json',
    readOnly: false,
    automaticLayout: true,
  };
  testResultForm: FormGroup;
  selectedTab = SelectedTabInFullscreenCodeEditor.OUTPUT;
  consoleResultEditoroptions = {
    theme: 'lucario',
    lineWrapping: true,
    readOnly: 'nocursor',
    mode: 'shell',
  };
  outputResultEditorOptions = {
    theme: 'lucario',
    lineWrapping: true,
    readOnly: 'nocursor',
    mode: 'javascript',
  };
  testLoading = false;
  addPackageDialogClosed$: Observable<
    { [key: PackageName]: PackageVersion } | undefined
  >;
  generateCodeEnabled$: Observable<boolean>;
  showGenerateCode$: Observable<boolean>;
  constructor(
    private formBuilder: UntypedFormBuilder,
    private codeService: CodeService,
    @Inject(MAT_DIALOG_DATA)
    public state: CodeArtifactControlFullscreenData,
    private dialogRef: MatDialogRef<CodeArtifactControlFullscreenComponent>,
    private dialogService: MatDialog,
    private testStepService: TestStepService,
    private store: Store,
    private cd: ChangeDetectorRef,
    private snackbar: MatSnackBar,
    private flagService: FlagService
  ) {
    this.testResultForm = this.formBuilder.group({
      outputResult: new FormControl(),
      consoleResult: new FormControl(),
    });
    this.codeFilesForm = this.state.codeFilesForm;
    this.readOnly = this.state.readOnly;
    this.generateCodeEnabled$ = this.flagService.isFlagEnabled(
      ApFlagId.COPILOT_ENABLED
    );
    this.showGenerateCode$ = this.flagService.isFlagEnabled(
      ApFlagId.SHOW_COPILOT
    );
  }

  focusEditor(editor: { focus: () => void }) {
    //needs to wait for the dialog to finish opening
    setTimeout(() => {
      editor.focus();
    }, 200);
  }

  ngOnInit(): void {
    if (this.readOnly) {
      this.codeEditorOptions.readOnly = this.readOnly;
      this.packageDotJsonOptions.readOnly = this.readOnly;
    }
  }

  selectFile(fileToSelect: SelectedFileInFullscreenCodeEditor) {
    this.selectedFile = fileToSelect;
  }
  selectTab(tabToSelect: SelectedTabInFullscreenCodeEditor) {
    this.selectedTab = tabToSelect;
  }
  get SelectedFileInFullscreenCodeEditor() {
    return SelectedFileInFullscreenCodeEditor;
  }
  get SelectedTabInFullscreenCodeEditor() {
    return SelectedTabInFullscreenCodeEditor;
  }
  openNpmPackageModal() {
    this.addPackageDialogClosed$ = this.dialogService
      .open(AddNpmPackageModalComponent)
      .afterClosed()
      .pipe(
        tap((pkg: { [key: PackageName]: PackageVersion } | undefined) => {
          if (pkg) {
            this.addNewPackage(pkg);
          }
        })
      );
  }
  addNewPackage(pkg: { [key: PackageName]: PackageVersion }) {
    const packageDotJson = this.getPackageDotJsonObject();
    packageDotJson.dependencies = { ...packageDotJson.dependencies, ...pkg };
    this.selectedFile = SelectedFileInFullscreenCodeEditor.PACKAGE;
    this.codeFilesForm.controls.packageJson.setValue(
      this.codeService.beautifyJson(packageDotJson)
    );
  }
  getPackageDotJsonObject(): { dependencies: PackagesMetadata } {
    const packageControlValue = this.codeFilesForm.controls.packageJson.value;
    try {
      const packageDotJson = JSON.parse(packageControlValue);
      if (!packageDotJson.dependencies) {
        return { dependencies: {} };
      }
      return packageDotJson;
    } catch (ignored) {
      return { dependencies: {} };
    }
  }
  testCode() {
    this.testResultForm.setValue({ outputResult: '', consoleResult: '' });
    this.testLoading = true;
    const testCodeParams$ = forkJoin({
      step: this.store.select(BuilderSelectors.selectCurrentStep).pipe(take(1)),
      flowVersionId: this.store
        .select(BuilderSelectors.selectDraftVersionId)
        .pipe(take(1)),
    });

    this.executeCodeTest$ = testCodeParams$.pipe(
      switchMap((params) => {
        if (!params.step || !params.flowVersionId) {
          throw Error(
            `Flow version Id or step name are undefined, step:${params.step} versionId:${params.flowVersionId}`
          );
        }
        return this.testStepService.testPieceOrCodeStep({
          stepName: params.step.name,
          flowVersionId: params.flowVersionId,
        });
      }),
      tap((result) => {
        const outputResult = this.codeService.beautifyJson(result.output);
        const consoleResult = this.getConsoleResult(result);
        this.testResultForm.patchValue({
          outputResult: outputResult
            ? outputResult
            : 'No output returned, check logs in case of errors',
          consoleResult: consoleResult,
        });
        this.testLoading = false;
        this.cd.markForCheck();
      })
    );
  }

  getConsoleResult(codeTestExecutionResult: StepRunResponse) {
    if (codeTestExecutionResult.standardError) {
      return `${codeTestExecutionResult.standardOutput} \n---------error-------\n ${codeTestExecutionResult.standardError}`;
    }
    return codeTestExecutionResult.standardOutput;
  }
  hide() {
    this.dialogRef.close(true);
  }

  copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    this.snackbar.open($localize`Copied to clipboard`);
  }
}
