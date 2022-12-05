import { Component, Input } from '@angular/core';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';
import { CodeEditorComponent } from '../../../../../flow-builder/page/flow-builder/code-editor/code-editor.component';
import { FormControl } from '@angular/forms';
import { CodeEmbeddedControl } from '../../../../model/dynamic-controls/code-embedded-control-form';

@Component({
	selector: 'app-embedded-code-editor',
	templateUrl: './code-embedded-editor.component.html',
	styleUrls: ['./code-embedded-editor.component.css'],
})
export class CodeEmbeddedEditorComponent {
	bsModalRef: BsModalRef;
	@Input() dynamicControl: CodeEmbeddedControl;

	constructor(private bsModalService: BsModalService) {}

	openCodeModal() {
		this.bsModalRef = this.bsModalService.show(CodeEditorComponent, {
			class: 'modal-fullscreen',
			ignoreBackdropClick: false,
			initialState: {
				fControl: this.dynamicControl.formControl(),
			},
		});
	}

	contentControl() {
		return this.dynamicControl.formControl().controls['content'] as FormControl;
	}
}
