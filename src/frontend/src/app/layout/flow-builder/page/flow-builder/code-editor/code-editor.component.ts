import { Component, Input, OnInit } from '@angular/core';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';
import { CodeService } from '../../../service/code.service';
import { TestCodeModalComponent } from './test-code-modal/test-code-modal.component';
import { faExpand } from '@fortawesome/free-solid-svg-icons';
import { FormControl, FormGroup } from '@angular/forms';
import { ThemeService } from 'src/app/layout/common-layout/service/theme.service';
import { map, Observable, of, switchMap, take, tap } from 'rxjs';
import { Store } from '@ngrx/store';
import { BuilderSelectors } from '../../../store/selector/flow-builder.selector';
import { AddNpmPackageModalComponent } from './add-npm-package-modal/add-npm-package-modal.component';

@Component({
	selector: 'app-code-editor',
	templateUrl: './code-editor.component.html',
	styleUrls: ['./code-editor.component.css'],
})
export class CodeEditorComponent implements OnInit {
	faExpand = faExpand;
	@Input() fControl: FormGroup;

	selectedFile = 'CONTENT';
	selectedTab = 'OUTPUT';
	testLoading: boolean = false;
	output: string = '';
	console: string = '';
	executionResult: any;
	viewMode$: Observable<boolean> = of(false);
	addNpmPackage$: Observable<void>;
	testCode$: Observable<void>;

	constructor(
		public bsModalRef: BsModalRef,
		private bsModalService: BsModalService,
		private codeService: CodeService,
		private store: Store,
		public themeService: ThemeService
	) {}

	ngOnInit(): void {
		this.viewMode$ = this.store.select(BuilderSelectors.selectReadOnly);
	}

	openNpmPackage() {
		const bsModalRef = this.bsModalService.show(AddNpmPackageModalComponent, {
			initialState: {},
		});
		this.addNpmPackage$ = (bsModalRef.content as AddNpmPackageModalComponent).packageEmitter.pipe(
			take(1),
			tap(npmPkg => {
				const packageJson = JSON.parse(this.fControl.value.package);
				if (packageJson.dependencies == undefined) {
					packageJson.dependencies = {};
				}
				packageJson.dependencies[npmPkg.package] = npmPkg.version;
				this.fControl.controls['package'].setValue(JSON.stringify(packageJson, null, 2));
			}),
			map(() => void 0)
		);
	}

	openTestModal() {
		const bsModalRef = this.bsModalService.show(TestCodeModalComponent, {
			initialState: {},
		});
		this.testCode$ = (bsModalRef.content as TestCodeModalComponent).contextSubmitted.pipe(
			take(1),
			tap(value => {
				this.testLoading = true;
			}),
			switchMap(value => {
				return this.codeService.executeTest(this.fControl.value, JSON.parse(value.context));
			}),
			tap({
				next: value => {
					this.executionResult = value;
					this.output = this.codeService.beautifyJson(this.executionResult.output);
					this.console = this.executionResult.standardOutput;
					if (this.executionResult.errorMessage != undefined && this.executionResult.errorMessage.length > 0) {
						this.console = this.console + '\n---------error-------\n' + this.executionResult.errorMessage;
					}
					this.testLoading = false;
				},
				error: error => {
					console.error(error);
					this.testLoading = false;
				},
			}),
			map(() => void 0)
		);
	}

	packageFormControl() {
		return this.fControl.controls['package'] as FormControl;
	}

	contentFormControl() {
		return this.fControl.controls['content'] as FormControl;
	}
}
