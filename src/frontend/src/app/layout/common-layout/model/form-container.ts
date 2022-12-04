import { DynamicFormControl } from './dynamic-controls/dynamic-form-control';
import { FormBuilder, FormGroup } from '@angular/forms';

export class FormContainer {
	submitted: boolean;
	fields: DynamicFormControl[];
	public form: FormGroup;

	constructor({
		submitted,
		fields,
		formBuilder,
	}: {
		fields: DynamicFormControl[];
		submitted: boolean;
		formBuilder: FormBuilder;
	}) {
		this.submitted = submitted;
		this.fields = fields;
		this.form = formBuilder.group({});
		for (let i = 0; i < fields.length; ++i) {
			this.form.addControl(fields[i].getName(), fields[i].formControl());
		}
	}
}
