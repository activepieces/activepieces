import { AbstractControl, ValidationErrors } from '@angular/forms';

export function jsonValidator(
  control: AbstractControl
): ValidationErrors | null {
  try {
    JSON.parse(control.value);
  } catch (e) {
    return { jsonInvalid: true };
  }

  return null;
}
