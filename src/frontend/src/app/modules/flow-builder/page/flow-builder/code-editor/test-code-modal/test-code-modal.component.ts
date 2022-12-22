import { Component, EventEmitter, OnInit, TemplateRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';
import { jsonValidator } from '../../../../../common/validators/json-validator';

@Component({
	selector: 'app-test-code-modal',
	templateUrl: './test-code-modal.component.html',
	styleUrls: ['./test-code-modal.component.css'],
})
export class TestCodeModalComponent implements OnInit {
	submitted = false;
	loading = false;
	testForm: FormGroup;

	public contextSubmitted: EventEmitter<{ context: string }> = new EventEmitter<any>();

	constructor(private formBuilder: FormBuilder, public modalRef: BsModalRef, private modalService: BsModalService) {}

	openModal(template: TemplateRef<any>) {
		this.modalRef = this.modalService.show(template);
	}

	ngOnInit() {
		this.testForm = this.formBuilder.group({
			context: ['{\n\n}', [Validators.required, jsonValidator]],
		});
	}

	submitText() {
		this.submitted = true;
		if (this.testForm.invalid) {
			return;
		}
		this.contextSubmitted.next(this.testForm.value);
		this.modalRef.hide();
	}
}
