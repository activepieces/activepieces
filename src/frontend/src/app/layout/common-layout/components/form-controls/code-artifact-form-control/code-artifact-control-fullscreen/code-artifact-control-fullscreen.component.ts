import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';

import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';
import { Observable, switchMap, take, tap } from 'rxjs';
import { CodeTestExecutionResult } from 'src/app/layout/common-layout/model/flow-builder/code-test-execution-result';
import { ThemeService } from 'src/app/layout/common-layout/service/theme.service';
import { CodeService } from 'src/app/layout/flow-builder/service/code.service';
import { SelectedFileInFullscreenCodeEditor } from '../selected-file-in-fullscreeen-code-editor.enum';
import { NewAddNpmPackageModalComponent } from './add-npm-package-modal/add-npm-package-modal.component';
import { SelectedTabInFullscreenCodeEditor } from './selected-tab-in-fullscreen-code-editor.enum';
import { TestCodeFormModalComponent } from './test-code-form-modal/test-code-form-modal.component';

type PackageName = string;
type PackageVersion = string;
@Component({
	templateUrl: './code-artifact-control-fullscreen.component.html',
	styleUrls: ['./code-artifact-control-fullscreen.component.scss'],
})
export class CodeArtifactControlFullscreenComponent implements OnInit {
	@Input() codeFilesForm: FormGroup;
	@Input() readOnly: boolean;
	selectedFile = SelectedFileInFullscreenCodeEditor.CONTENT;
	executeCodeTest$: Observable<CodeTestExecutionResult>;
	codeEditorOptions = {
		minimap: { enabled: false },
		theme: 'vs',
		language: 'javascript',
		readOnly: false,
	};
	packageDotJsonOptions = {
		minimap: { enabled: false },
		theme: 'vs',
		language: 'json',
		readOnly: false,
	};
	testResultForm: FormGroup;
	addNpmPackage$: Observable<Object>;
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
	constructor(
		public themeService: ThemeService,
		private modalRef: BsModalRef,
		private formBuilder: FormBuilder,
		private modalService: BsModalService,
		private codeService: CodeService
	) {
		this.testResultForm = this.formBuilder.group({ outputResult: new FormControl(), consoleResult: new FormControl() });
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
		const npmModal: BsModalRef<NewAddNpmPackageModalComponent> = this.modalService.show(NewAddNpmPackageModalComponent);
		this.addNpmPackage$ = npmModal.content!.packageFound$.pipe(
			take(1),
			tap(pkg => {
				this.addNewPackage(pkg);
				this.selectedFile = SelectedFileInFullscreenCodeEditor.PACKAGE;
			})
		);
	}
	addNewPackage(pkg: { [key: PackageName]: PackageVersion }) {
		const packageDotJson = this.getPackageDotJsonObject();
		packageDotJson.dependencies = { ...packageDotJson.dependencies, ...pkg };
		this.codeFilesForm.get('package')!.setValue(this.codeService.beautifyJson(packageDotJson));
	}
	getPackageDotJsonObject(): { dependencies: { [key: PackageName]: PackageVersion } } {
		const packageControlValue = this.codeFilesForm.get('package')!.value;
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
		const testContextModal: BsModalRef<TestCodeFormModalComponent> = this.modalService.show(TestCodeFormModalComponent);
		this.executeCodeTest$ = testContextModal.content!.contextSubmitted.pipe(
			take(1),
			tap(() => {
				this.testResultForm.setValue({ outputResult: '', consoleResult: '' });
				this.testLoading = true;
			}),
			switchMap(context => {
				return this.codeService.executeTest(this.codeFilesForm.value, context);
			}),
			tap(result => {
				const outputResult = this.codeService.beautifyJson(result.output);
				const consoleResult = this.getConsoleResult(result);
				this.testResultForm.setValue({ outputResult: outputResult, consoleResult: consoleResult });
				this.testLoading = false;
			})
		);
	}

	getConsoleResult(codeTestExecutionResult: CodeTestExecutionResult) {
		if (codeTestExecutionResult.errorMessage) {
			return `${codeTestExecutionResult.standardOutput} \n---------error-------\n ${codeTestExecutionResult.errorMessage}`;
		}
		return codeTestExecutionResult.standardOutput;
	}
	hide() {
		this.modalRef.hide();
	}
	packageControl() {
		return this.codeFilesForm.get('package')!;
	}
	contentControl() {
		return this.codeFilesForm.get('content')!;
	}
}
