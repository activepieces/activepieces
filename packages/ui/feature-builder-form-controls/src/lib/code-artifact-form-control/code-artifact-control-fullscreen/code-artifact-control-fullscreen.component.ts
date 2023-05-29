import { ChangeDetectorRef, Component, Inject, OnInit } from '@angular/core';
import { FormControl, FormGroup, UntypedFormBuilder } from '@angular/forms';
import {
  MatDialog,
  MatDialogRef,
  MAT_DIALOG_DATA,
} from '@angular/material/dialog';
import { forkJoin, map, Observable, switchMap, take, tap } from 'rxjs';
import { CodeExecutionResult } from '@activepieces/shared';
import { CodeArtifactForm } from '../code-artifact-form-control.component';
import { SelectedFileInFullscreenCodeEditor } from '../selected-file-in-fullscreeen-code-editor.enum';
import { AddNpmPackageModalComponent } from './add-npm-package-modal/add-npm-package-modal.component';
import { SelectedTabInFullscreenCodeEditor } from './selected-tab-in-fullscreen-code-editor.enum';

import {
  BuilderSelectors,
  CodeService,
} from '@activepieces/ui/feature-builder-store';
import { TestStepService } from '@activepieces/ui/common';
import { Store } from '@ngrx/store';

type PackageName = string;
type PackageVersion = string;
interface PackagesMetada {
  [key: PackageName]: PackageVersion;
}

@Component({
  templateUrl: './code-artifact-control-fullscreen.component.html',
  styleUrls: ['./code-artifact-control-fullscreen.component.scss'],
})
export class CodeArtifactControlFullscreenComponent implements OnInit {
  codeFilesForm: FormGroup<CodeArtifactForm>;
  readOnly: boolean;
  selectedFile = SelectedFileInFullscreenCodeEditor.CONTENT;
  executeCodeTest$: Observable<CodeExecutionResult>;
  codeEditorOptions = {
    minimap: { enabled: false },
    theme: 'vs',
    language: 'typescript',
    readOnly: false,
  };
  packageDotJsonOptions = {
    minimap: { enabled: false },
    theme: 'vs',
    language: 'json',
    readOnly: false,
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
  constructor(
    private formBuilder: UntypedFormBuilder,
    private codeService: CodeService,
    @Inject(MAT_DIALOG_DATA)
    public state: { codeFilesForm: FormGroup; readOnly: boolean },
    private dialogRef: MatDialogRef<CodeArtifactControlFullscreenComponent>,
    private dialogService: MatDialog,
    private testStepService: TestStepService,
    private store: Store,
    private cd: ChangeDetectorRef
  ) {
    this.testResultForm = this.formBuilder.group({
      outputResult: new FormControl(),
      consoleResult: new FormControl(),
    });
    this.codeFilesForm = this.state.codeFilesForm;
    this.readOnly = this.state.readOnly;
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
    this.codeFilesForm.controls.package.setValue(
      this.codeService.beautifyJson(packageDotJson)
    );
  }
  getPackageDotJsonObject(): { dependencies: PackagesMetada } {
    const packageControlValue = this.codeFilesForm.controls.package.value;
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
  openTestCodeModal() {
    this.testResultForm.setValue({ outputResult: '', consoleResult: '' });
    this.testLoading = true;
    const testCodeParams$ = forkJoin({
      step: this.store.select(BuilderSelectors.selectCurrentStep).pipe(take(1)),
      flowVersionId: this.store
        .select(BuilderSelectors.selectCurrentFlowVersionId)
        .pipe(take(1)),
    });

    this.executeCodeTest$ = testCodeParams$.pipe(
      switchMap((params) => {
        if (!params.step || !params.flowVersionId) {
          throw Error(
            `Flow version Id or step name are undefined, step:${params.step} versionId:${params.flowVersionId}`
          );
        }
        return this.testStepService
          .testPieceOrCodeStep<CodeExecutionResult>({
            stepName: params.step.name,
            flowVersionId: params.flowVersionId,
          })
          .pipe(
            map((result) => {
              return result.output;
            })
          );
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

  getConsoleResult(codeTestExecutionResult: CodeExecutionResult) {
    if (codeTestExecutionResult.standardError) {
      return `${codeTestExecutionResult.standardOutput} \n---------error-------\n ${codeTestExecutionResult.standardError}`;
    }
    return codeTestExecutionResult.standardOutput;
  }
  hide() {
    this.dialogRef.close(true);
  }
}
