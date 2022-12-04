import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { BsModalRef } from 'ngx-bootstrap/modal';

@Component({
	selector: 'app-confirm-delete-modal',
	templateUrl: './confirm-delete-modal.component.html',
	styleUrls: ['./confirm-delete-modal.component.css'],
})
export class ConfirmDeleteModalComponent implements OnInit {
	@Output() confirmState = new EventEmitter<boolean>();
	@Input() entityName: string;
	@Input() archive = false;
	@Input() showText = true;
	@Input() loading = false;
	@Input() instantClose = true;
	confirmationText;
	deleteForm: FormGroup;

	constructor(public bsModalRef: BsModalRef, private formBuilder: FormBuilder) {}

	ngOnInit(): void {
		if (this.archive) {
			this.confirmationText = 'ARCHIVE';
		} else {
			this.confirmationText = 'DELETE';
		}
		this.deleteForm = this.formBuilder.group({
			confirmationTextControl: [, [Validators.required, Validators.pattern(this.confirmationText)]],
		});
	}

	confirmDelete(): void {
		if (this.deleteForm.invalid && this.showText) {
			return;
		}
		this.confirmState.emit(true);
		this.deleteForm.reset();
		if (this.instantClose) {
			this.bsModalRef?.hide();
			this.deleteForm.reset();
		}
	}
}
