import { AbstractControl, ValidationErrors } from '@angular/forms';

export function codenameValidator(control: AbstractControl): ValidationErrors | null {
	const regex = /^[a-z0-9_]*$/;
	const valid = regex.test(control.value);
	return {
		validCodename: valid,
	};
}
