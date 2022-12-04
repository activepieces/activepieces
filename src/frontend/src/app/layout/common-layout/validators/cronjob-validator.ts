import { AbstractControl, ValidationErrors } from '@angular/forms';
import * as cronValidator from 'cron-expression-validator';

export function cronJobValidator(control: AbstractControl): ValidationErrors | null {
	if (cronValidator.isValidCronExpression(control.value)) {
		return null;
	}
	return { 'invalid-cron-job': true };
}
