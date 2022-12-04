import { ControlType } from './control-type.enum';
import { DynamicFormControl } from './dynamic-form-control';
import { FormControl, ValidatorFn } from '@angular/forms';

export class DocumentationInfoControl extends DynamicFormControl {
	private docUrl: string;
	private logoUrl: string;
	private pieceTitle: string;

	constructor({
		label,
		name,
		helpText = '',
		docUrl,
		logoUrl,
		pieceTitle,
		hidden = false,
	}: {
		label: string;
		name: string;
		pieceTitle: string;
		logoUrl: string;
		docUrl: string;
		helpText?: string;
		validatorFns?: ValidatorFn[];
		hidden?: boolean;
	}) {
		super();
		this.name = name;
		this.docUrl = docUrl;
		this.pieceTitle = pieceTitle;
		this.label = label;
		this.hidden = hidden;
		this.helpText = helpText;
		this.type = ControlType.DOCUMENTATION_LINK;
		this.validatorFns = [];
		this.logoUrl = logoUrl;
		this.value = null;
		this.disabled = true;
		this._formControl = new FormControl(this.value, { validators: [] });
		this._formControl.disable();
	}

	formControl(): FormControl {
		return this._formControl as FormControl;
	}

	getPieceTitle(): string {
		return this.pieceTitle;
	}

	getLogoUrl(): string {
		return this.logoUrl;
	}

	getDocumentationLink(): string {
		return this.docUrl;
	}
}
