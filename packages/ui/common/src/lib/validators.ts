import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { BranchCondition, singleValueConditions } from '@activepieces/shared';
import { isValidCron } from 'cron-validator';

export function branchConditionValidator(
  control: AbstractControl
): ValidationErrors | null {
  const val: BranchCondition = control.value;
  return validateCondition(val);
}

export function branchConditionGroupValidator(
  control: AbstractControl
): ValidationErrors | null {
  const val: BranchCondition[] = control.value;
  const hasError = val.some((c) => {
    return !!validateCondition(c);
  });

  if (hasError) {
    return { invalid: true };
  }
  return null;
}
function validateCondition(val: BranchCondition) {
  if (!val.firstValue) {
    return { invalidFirstValue: true };
  }
  if (!val.operator) {
    return { invalidOperator: true };
  }
  if (
    !singleValueConditions.find((o) => o === val.operator) &&
    !('secondValue' in val) // Check if `val` has `secondValue` property
  ) {
    return { invalidSecondValue: true };
  }
  return null;
}

export function containsSpecialCharacter(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const specialCharacterRegex = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/;
    if (!control.value || !specialCharacterRegex.test(control.value)) {
      return { specialCharacter: true };
    }
    return null;
  };
}
export function containsLowercaseCharacter(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const lowercaseCharacterRegex = /[a-z]/;
    if (!control.value || !lowercaseCharacterRegex.test(control.value)) {
      return { lowercase: true };
    }
    return null;
  };
}

export function matchesString(val: string): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!val || val.toLowerCase() !== control.value?.toLowerCase()) {
      return { invalid: true };
    }
    return null;
  };
}

export function containsUppercaseCharacter(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const uppsercaseCharacterRegex = /[A-Z]/;
    if (!control.value || !uppsercaseCharacterRegex.test(control.value)) {
      return { uppercase: true };
    }
    return null;
  };
}

export function containsNumber(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const numberRegex = /[0-9]/;
    if (!control.value || !numberRegex.test(control.value)) {
      return { number: true };
    }
    return null;
  };
}
export function checkboxIsTrue(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) {
      return { checkBoxMustBeTrue: true };
    }
    return null;
  };
}

export function jsonValidator(
  control: AbstractControl
): ValidationErrors | null {
  if (!control.value) {
    return null;
  }
  try {
    JSON.parse(control.value);
  } catch (e) {
    return { jsonInvalid: true };
  }

  return null;
}

export function cronJobValidator(
  control: AbstractControl
): ValidationErrors | null {
  if (isValidCron(control.value, { seconds: false })) {
    return null;
  }
  return { 'invalid-cron-job': true };
}

export function validateFileControl(
  extensions: string[],
  fileSizeLimit: number
) {
  return (formControl: AbstractControl) => {
    const file = formControl.value;
    if (file) {
      const parts = file.name.split('.');
      if (parts.length === 0) {
        return { emptyFile: true };
      }
      const extension = '.' + parts[parts.length - 1].toLowerCase();
      if (
        !extensions.find(
          (allowedExtension) =>
            allowedExtension.toLocaleLowerCase() ==
            extension.toLocaleLowerCase()
        )
      ) {
        return { invalidExtension: true };
      }
      if (file.size > fileSizeLimit) {
        return { sizeLimit: true };
      }
      return null;
    }
    return { emptyFile: true };
  };
}
