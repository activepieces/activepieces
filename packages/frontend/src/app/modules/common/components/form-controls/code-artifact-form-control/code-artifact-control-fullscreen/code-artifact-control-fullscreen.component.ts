import { Component, Inject, OnInit } from '@angular/core';
import { FormControl, FormGroup, UntypedFormBuilder } from '@angular/forms';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { filter, Observable, switchMap, tap } from 'rxjs';
import { CodeExecutionResult } from '@activepieces/shared';
import { CodeService } from 'packages/frontend/src/app/modules/flow-builder/service/code.service';
import { CodeArtifactForm } from '../code-artifact-form-control.component';
import { SelectedFileInFullscreenCodeEditor } from '../selected-file-in-fullscreeen-code-editor.enum';
import { AddNpmPackageModalComponent } from './add-npm-package-modal/add-npm-package-modal.component';
import { SelectedTabInFullscreenCodeEditor } from './selected-tab-in-fullscreen-code-editor.enum';
import { TestCodeFormModalComponent } from './test-code-form-modal/test-code-form-modal.component';

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
	addPackageDialogClosed$: Observable<{ [key: PackageName]: PackageVersion } | undefined>;
	constructor(
		private formBuilder: UntypedFormBuilder,
		private codeService: CodeService,
		@Inject(MAT_DIALOG_DATA) public state: { codeFilesForm: FormGroup; readOnly: boolean },
		private dialogRef: MatDialogRef<CodeArtifactControlFullscreenComponent>,
		private dialogService: MatDialog
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
		this.codeFilesForm.controls.package.setValue(this.codeService.beautifyJson(packageDotJson));
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
		this.executeCodeTest$ = this.dialogService
			.open(TestCodeFormModalComponent)
			.afterClosed()
			.pipe(
				filter(res => !!res),
				tap(() => {
					this.testResultForm.setValue({ outputResult: '', consoleResult: '' });
					this.testLoading = true;
				}),
				switchMap(context => {
					return this.codeService.executeTest(this.codeFilesForm.getRawValue(), context);
				}),
				tap(result => {
					const outputResult = this.codeService.beautifyJson(result.output);
					const consoleResult = this.getConsoleResult(result);
					this.testResultForm.patchValue({
						outputResult: outputResult ? outputResult : 'No output returned, check logs in case of errors',
						consoleResult: consoleResult,
					});
					this.testLoading = false;
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
