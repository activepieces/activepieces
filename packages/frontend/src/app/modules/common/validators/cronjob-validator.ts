import { AbstractControl, ValidationErrors } from '@angular/forms';
import { isValidCron } from 'cron-validator';

export function cronJobValidator(control: AbstractControl): ValidationErrors | null {
	if (isValidCron(control.value, { seconds: true })) {
		return null;
	}
	return { 'invalid-cron-job': true };
}
