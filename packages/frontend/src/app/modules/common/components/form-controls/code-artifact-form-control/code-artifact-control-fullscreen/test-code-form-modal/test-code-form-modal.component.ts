import { Component, EventEmitter, Inject, Output } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { fadeInUp400ms } from 'src/app/modules/common/animation/fade-in-up.animation';
import { jsonValidator } from 'src/app/modules/common/validators/json-validator';
import { CodeService } from 'src/app/modules/flow-builder/service/code.service';

@Component({
	selector: 'app-test-code-form-modal',
	templateUrl: './test-code-form-modal.component.html',
	animations: [fadeInUp400ms],
})
export class TestCodeFormModalComponent {
	testCodeForm: FormGroup<{ context: FormControl<string> }>;
	editorOptions = {
		lineNumbers: true,
		theme: 'lucario',
		mode: 'javascript',
	};
	@Output() contextSubmitted: EventEmitter<Object> = new EventEmitter();
	submitted = false;
	constructor(
		private formBuilder: FormBuilder,
		private dialogRef: MatDialogRef<TestCodeFormModalComponent>,
		private codeService: CodeService,
		@Inject(MAT_DIALOG_DATA) public data: { testData: Object | undefined }
	) {
		this.testCodeForm = this.formBuilder.group({
			context: new FormControl(this.data.testData ? JSON.stringify(this.data.testData) : '{\n\n}', {
				nonNullable: true,
				validators: [Validators.required, jsonValidator],
			}),
		});

		this.beautify();
	}

	submitContext() {
		this.submitted = true;
		if (this.testCodeForm.valid) {
			this.dialogRef.close(JSON.parse(this.testCodeForm.controls.context.value));
		}
	}
	beautify() {
		try {
			const context = this.testCodeForm.controls.context;
			context.setValue(this.codeService.beautifyJson(JSON.parse(context.value)));
		} catch {}
	}
}
